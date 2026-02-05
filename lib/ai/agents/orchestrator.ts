import OpenAI from 'openai';
import { kimiClient, KIMI_MODEL } from '../kimi-client';
import {
    AgentContext,
    ChatMessage,
    PendingAction,
    handleAIError,
    DocumentContentCache,
} from '../types';
import {
    documentTools,
    getDocumentContent,
    searchInDocuments,
} from '../tools/document-tools';
import {
    taskTools,
    createTaskPreview,
    updateTaskPreview,
    listTasks,
} from '../tools/task-tools';
import {
    calendarTools,
    getCalendarBlocks,
    suggestReschedule,
} from '../tools/calendar-tools';

// ============================================================================
// Orchestrator Agent
// ============================================================================

export async function runOrchestrator(
    message: string,
    context: AgentContext,
    history: ChatMessage[],
    documentCache?: DocumentContentCache
): Promise<{ response: string; pendingAction?: PendingAction; updatedCache?: DocumentContentCache }> {
    try {
        // Determine which tools are available based on context
        const availableTools = getAvailableTools(context);

        // Build system prompt based on context
        const systemPrompt = buildSystemPrompt(context);

        // Prepare messages for Kimi
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...history.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
            { role: 'user', content: message },
        ];

        // Call Kimi with tools
        const response = await kimiClient.chat.completions.create({
            model: KIMI_MODEL,
            messages,
            tools: availableTools.length > 0 ? availableTools : undefined,
            temperature: 0.7,
        });

        const assistantMessage = response.choices[0].message;

        // Handle tool calls
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            const toolCall = assistantMessage.tool_calls[0];
            const result = await executeToolCall(toolCall, context, messages, documentCache);

            return result;
        }

        // Direct response (no tools needed)
        return {
            response: assistantMessage.content || 'I apologize, I could not process that request.',
        };
    } catch (error) {
        return {
            response: handleAIError(error),
        };
    }
}

// ============================================================================
// Tool Execution
// ============================================================================

async function executeToolCall(
    toolCall: any,  // OpenAI.Chat.ChatCompletionMessageToolCall is a union type; using any for simplicity
    context: AgentContext,
    originalMessages?: OpenAI.Chat.ChatCompletionMessageParam[],
    documentCache?: DocumentContentCache
): Promise<{ response: string; pendingAction?: PendingAction; updatedCache?: DocumentContentCache }> {
    const functionName = toolCall.function.name;

    let args: any;
    try {
        args = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
        console.error('Failed to parse tool arguments:', parseError);
        return {
            response: 'I encountered an error processing that request. Please try rephrasing.',
        };
    }

    try {
        // Document tools
        if (functionName === 'get_document_content') {
            const { content, updatedCache } = await getDocumentContent(args.document_id, documentCache);
            // After getting content, send it back to Kimi for processing
            const followUpResponse = await kimiClient.chat.completions.create({
                model: KIMI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant. Answer the user\'s question based on the following document content.',
                    },
                    {
                        role: 'user',
                        content: `Document content:\n\n${content}\n\nPlease summarize or answer questions about this document.`,
                    },
                ],
                temperature: 0.7,
            });

            return {
                response: followUpResponse.choices[0].message.content || 'Could not process document.',
                updatedCache,
            };
        }

        if (functionName === 'search_in_documents') {
            const result = await searchInDocuments(args.query, args.document_ids);
            return { response: result };
        }

        // Task tools (return pending actions)
        if (functionName === 'create_task') {
            const preview = await createTaskPreview(args);
            return {
                response: 'I can create this task for you:',
                pendingAction: preview,
            };
        }

        if (functionName === 'update_task') {
            const preview = await updateTaskPreview(args);
            return {
                response: 'I can make this change:',
                pendingAction: preview,
            };
        }

        if (functionName === 'list_tasks') {
            const taskList = await listTasks(
                context.organizationId,
                context.userId,
                args.status,
                args.scheduled_date
            );

            // Only continue multi-turn if we have original messages (for context)
            if (!originalMessages || originalMessages.length === 0) {
                return { response: taskList };
            }

            // Build conversation with tool result using OpenAI function calling pattern
            const updatedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                ...originalMessages,
                {
                    role: 'assistant' as const,
                    content: '',
                    tool_calls: [toolCall],
                },
                {
                    role: 'tool' as const,
                    tool_call_id: toolCall.id || 'list_tasks_call',
                    content: taskList,
                },
            ];

            // Send result back to Kimi to let it decide next action
            const followUpResponse = await kimiClient.chat.completions.create({
                model: KIMI_MODEL,
                messages: updatedMessages,
                tools: getAvailableTools(context),
                temperature: 0.7,
            });

            const followUpMessage = followUpResponse.choices[0].message;

            // If Kimi wants to call another tool (e.g., update_task)
            if (followUpMessage.tool_calls && followUpMessage.tool_calls.length > 0) {
                const nextToolCall = followUpMessage.tool_calls[0];
                // Recursively execute the next tool call
                return await executeToolCall(nextToolCall, context, updatedMessages, documentCache);
            }

            // Otherwise, return the response to user
            return {
                response: followUpMessage.content || taskList,
            };
        }

        // Calendar tools
        if (functionName === 'get_calendar_blocks') {
            const calendarData = await getCalendarBlocks(
                context.organizationId,
                context.userId,
                args.start_date,
                args.end_date
            );

            // Multi-turn support: allow AI to call follow-up tools
            if (!originalMessages || originalMessages.length === 0) {
                return { response: calendarData };
            }

            const updatedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                ...originalMessages,
                {
                    role: 'assistant' as const,
                    content: '',
                    tool_calls: [toolCall],
                },
                {
                    role: 'tool' as const,
                    tool_call_id: toolCall.id || 'get_calendar_blocks_call',
                    content: calendarData,
                },
            ];

            const followUpResponse = await kimiClient.chat.completions.create({
                model: KIMI_MODEL,
                messages: updatedMessages,
                tools: getAvailableTools(context),
                temperature: 0.7,
            });

            const followUpMessage = followUpResponse.choices[0].message;

            if (followUpMessage.tool_calls && followUpMessage.tool_calls.length > 0) {
                const nextToolCall = followUpMessage.tool_calls[0];
                return await executeToolCall(nextToolCall, context, updatedMessages, documentCache);
            }

            return {
                response: followUpMessage.content || calendarData,
            };
        }

        if (functionName === 'suggest_reschedule') {
            const preview = await suggestReschedule(args);
            return {
                response: 'I can reschedule this for you:',
                pendingAction: preview,
            };
        }

        return { response: 'Tool not implemented yet.' };
    } catch (error) {
        return { response: handleAIError(error) };
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getAvailableTools(context: AgentContext): any[] {
    const tools: any[] = [];

    // Document tools only available on documents page with selected docs
    if (context.currentPage === 'documents' && context.selectedDocuments && context.selectedDocuments.length > 0) {
        tools.push(...documentTools);
    }

    // Task and calendar tools available on workspace page
    if (context.currentPage === 'workspace') {
        tools.push(...taskTools);
        tools.push(...calendarTools);
    }

    return tools;
}

function buildSystemPrompt(context: AgentContext): string {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentYear = new Date().getFullYear();

    let prompt = `You are a helpful AI assistant for a task management workspace app.

Current date: ${currentDate} (year ${currentYear})
${context.selectedDate ? `User's selected calendar date: ${context.selectedDate}` : ''}

Current context:
- Page: ${context.currentPage}
- Organization: ${context.organizationId}
`;

    if (context.currentPage === 'documents' && context.selectedDocuments && context.selectedDocuments.length > 0) {
        prompt += `\n\nSelected Documents:`;
        context.selectedDocuments.forEach((doc, index) => {
            prompt += `\n${index + 1}. "${doc.title}" (ID: ${doc.id})`;
        });
        prompt += `\n\nUse the get_document_content tool with the document ID to retrieve content and answer questions about these documents.`;
    }

    if (context.currentPage === 'workspace') {
        prompt += `\nYou can help create tasks, schedule them on the calendar, update tasks, and manage calendar blocks.`;
        if (context.tasks) {
            prompt += `\nThere are ${context.tasks.length} tasks in the current workspace.`;
        }
        prompt += `\n\nWhen creating tasks:
- ALWAYS provide expected_time_minutes (required field, must be > 0)
- If user mentions duration (e.g., "for one hour", "30 minutes"), use that for expected_time_minutes
- If no duration mentioned, estimate a reasonable time (e.g., 30 minutes)
- For scheduled tasks with specific times:
  - Use ISO 8601 datetime format (e.g., "${currentYear}-02-02T16:00:00")
  - Set scheduled_start_time to the full datetime
  - Set duration_minutes to match expected_time_minutes
  - ALWAYS use ${currentYear} as the year unless the user explicitly specifies a different year
  - Parse relative dates (like "today", "tomorrow", "Monday") relative to ${currentDate}
${context.selectedDate ? `- For unscheduled tasks (no specific time), use ${context.selectedDate} as the scheduled_date` : ''}

When listing tasks:
- If user asks for tasks "today", "tomorrow", or a specific date, use the scheduled_date parameter with the appropriate ISO date (YYYY-MM-DD)
- Parse relative dates relative to ${currentDate}
- For sorting by time length, the results are already ordered by expected_time_minutes

When updating tasks:
- ALWAYS first call list_tasks to search for the task by title/name
- Find the task number (e.g., "1.", "2.") that matches the title
- Extract the task ID from the [Task refs: 1→uuid1 2→uuid2...] section at the bottom
- Then call update_task with that ID
- Example: User says "mark eating dinner as completed" → list_tasks → find "2. eating dinner" → check refs "2→abc123" → update_task with task_id="abc123"

When rescheduling calendar blocks (moving tasks to different times):
- If user says "move [task] to [time]" or "reschedule [task] to [time]", this is a RESCHEDULE operation, NOT an update_task operation
- FIRST call get_calendar_blocks to find the task's current calendar block
- Look for the task by title in the calendar blocks results
- Extract the block_id from the [Block refs: 1→uuid1 2→uuid2...] section at the bottom
- Then call suggest_reschedule with:
  - block_id (from get_calendar_blocks result)
  - new_start_time (ISO 8601 datetime in LOCAL TIME without timezone offset, e.g., "YYYY-MM-DDTHH:mm:ss")
  - new_end_time (calculated from new start + duration, maintaining the same duration as original)
- When the user says a time like "3pm", interpret it as 3pm in their LOCAL timezone
- Format times as: YYYY-MM-DDTHH:mm:ss (no Z or timezone offset - this will be interpreted as local time)
- Example: "move eat lunch from 12 to 3pm" on ${currentDate} → get_calendar_blocks → find "1. Eat lunch: 12:00 PM - 12:30 PM" → check refs "1→block-uuid" → if duration was 30min, calculate new times as 3pm-3:30pm → suggest_reschedule(block_id="block-uuid", new_start_time="${currentDate}T15:00:00", new_end_time="${currentDate}T15:30:00")
- IMPORTANT: Do NOT use update_task for time changes. update_task only changes metadata (title, status, description, expected_time). Use suggest_reschedule for moving scheduled blocks to different times.`;
    }

    prompt += `\n\nIMPORTANT: For any mutation operations (creating, updating, deleting, rescheduling), you must use the appropriate tool which will return a preview for the user to confirm. Never directly mention that you're waiting for confirmation - just present the action naturally.`;

    return prompt;
}
