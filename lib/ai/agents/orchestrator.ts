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
    editDocumentContent,
    organizeDocuments,
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
    scheduleTask,
    autoScheduleTasks,
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
            console.log('🤖 AI Orchestrator: Tool calls received', JSON.stringify(assistantMessage.tool_calls, null, 2));
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
        console.log(`🔧 Executing tool: ${functionName}`, args);
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

            // Multi-turn support: allow AI to call follow-up tools (e.g., edit_document_content)
            if (!originalMessages || originalMessages.length === 0) {
                return { response: content, updatedCache };
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
                    tool_call_id: toolCall.id || 'get_document_content_call',
                    content: content,
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

            // If Kimi wants to call another tool (e.g., edit_document_content)
            if (followUpMessage.tool_calls && followUpMessage.tool_calls.length > 0) {
                const nextToolCall = followUpMessage.tool_calls[0];
                // Recursively execute the next tool call
                return await executeToolCall(nextToolCall, context, updatedMessages, updatedCache);
            }

            // Otherwise, return the response to user (e.g., Q&A answer)
            return {
                response: followUpMessage.content || content,
                updatedCache,
            };
        }

        if (functionName === 'search_in_documents') {
            const result = await searchInDocuments(args.query, args.document_ids);
            return { response: result };
        }

        if (functionName === 'edit_document_content') {
            const preview = await editDocumentContent(
                args.document_id,
                args.edit_type,
                args.new_content,
                args.target_text,
                context
            );
            return {
                response: 'I can make these edits to the document:',
                pendingAction: preview,
            };
        }

        if (functionName === 'organize_documents') {
            const preview = await organizeDocuments(
                args.document_ids,
                args.folder_structure,
                context
            );
            return {
                response: 'I can organize these documents into folders:',
                pendingAction: preview,
            };
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

        if (functionName === 'schedule_task') {
            const preview = await scheduleTask(
                args.task_id,
                args.preferred_date,
                args.preferred_start_time,
                args.search_days || 7,
                context
            );
            return {
                response: 'I found an available time slot for this task:',
                pendingAction: preview,
            };
        }

        if (functionName === 'auto_schedule_tasks') {
            const preview = await autoScheduleTasks(
                args.task_ids,
                args.date,
                args.start_time,
                context
            );
            return {
                response: `I've prepared a schedule for these ${args.task_ids.length} tasks:`,
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
        prompt += `\n\nYou can:
- Use get_document_content to retrieve document content (for reading or before editing)
- Use edit_document_content to modify documents (rewrite, append, prepend, or replace sections)
- Use organize_documents to categorize files into folders based on their titles and content

When editing documents:
- If the user wants to refine/tweak existing content, FIRST use get_document_content to see what's there, then use edit_document_content with the appropriate edit_type:
  - For targeted changes: use edit_type="replace_section" and copy the exact text to replace as target_text
  - For major rewrites: use edit_type="rewrite" to replace all content
  - For additions: use edit_type="append" or "prepend"
- If the document is likely empty (new document) and the user is writing from scratch, you can call edit_document_content directly with edit_type="rewrite" (no need to read empty content first)
- When answering questions about documents, use get_document_content to retrieve the content and then provide your answer based on what you see`;
    }

    if (context.currentPage === 'workspace') {
        prompt += `\nYou can help create tasks, schedule them on the calendar, update tasks, and manage calendar blocks.`;
        if (context.tasks) {
            prompt += `\nThere are ${context.tasks.length} tasks in the current workspace.`;
        }
        prompt += `\n\nTool Planning and Reasoning:
Before calling any tools, think through your approach:

1. **What data do I need?**
   - User wants to modify a task → I need task_id
   - User wants to reschedule a block → I need block_id
   - User wants to create something new → I can call directly

2. **Which tool provides that data?**
   - task_id comes from: list_tasks (search existing) OR create_task (new task)
   - block_id comes from: get_calendar_blocks (search calendar)
   - document content comes from: get_document_content

3. **What order should I call them?**
   - If I need data from one tool for another → Call in sequence (multi-turn)
   - If tools are independent → Can reason about them separately
   - Example: "Move task X" → list_tasks first to get task_id, then use result

4. **Check tool descriptions for dependencies:**
   - Each tool documents what inputs it REQUIRES
   - Each tool documents what data it RETURNS
   - Read carefully before calling

Example reasoning:
- User: "Move watch kill bill to when I'm free tonight"
- Think: Need to schedule existing task → Call list_tasks to get task_id → Call schedule_task with task_id
- schedule_task will automatically find first available slot tonight and return preview for confirmation
- Never ask user to choose - automatically suggest the first available slot

- User: "Schedule all my tasks for today"
- Think: Need to schedule multiple tasks → Call list_tasks to get all task IDs → Call auto_schedule_tasks with list of IDs
- auto_schedule_tasks returns a single batch confirmation for all tasks

- User: "Add task read chipwar for 30 min from 9"
- Think: specific time "from 9" → calculate today at 9am with timezone → create_task(title="read chipwar", scheduled_start_time="2026-02-07T09:00:00+09:00", expected_time_minutes=30)`;

        prompt += `\n\nGeneral Tool Usage:
- All tools document their dependencies and return values in descriptions
- Use multi-turn workflows when one tool's output feeds into another
- Mutation tools (create, update, delete, reschedule) return previews requiring user confirmation
- Read operations (list, get, search) return data you can use immediately

Response Guidelines:
- Be proactive: When tools return data, use it immediately to complete the user's request
- Never expose UUIDs in conversational responses - only use human-readable names (task titles, etc.)
- For scheduling: Automatically suggest the first available slot, don't ask user to choose
- Example: "I've scheduled 'watch Kill Bill' for tonight at 7:00 PM" (with preview), not "When would you like to schedule it?"

Data Format Guidelines:
- expected_time_minutes: Always provide for tasks (required, must be > 0). Estimate if user doesn't specify.
- ISO 8601 datetime: MUST include timezone offset, format: "${currentYear}-02-07T09:00:00+09:00" for scheduled_start_time (REQUIRED for "from [time]" requests). User timezone is UTC+9 (Japan).
- ISO date: "YYYY-MM-DD" format for dates (e.g., scheduled_date parameter)
- Current year: ${currentYear} - use unless user explicitly specifies different year
- Parse relative dates ("today", "tomorrow") relative to ${currentDate}
${context.selectedDate ? `- Selected date: ${context.selectedDate}` : ''}

Tool Result References (INTERNAL USE ONLY - never show UUIDs to user):
- list_tasks returns: [Task refs: 1→uuid1 2→uuid2...] - extract uuid and use internally
- get_calendar_blocks returns: [Block refs: 1→uuid1 2→uuid2...] - extract uuid and use internally
- In your conversational responses, refer to tasks/blocks by their human-readable names only`;
    }

    prompt += `\n\nIMPORTANT: For any mutation operations (creating, updating, deleting, rescheduling), you must use the appropriate tool which will return a preview for the user to confirm. Never directly mention that you're waiting for confirmation - just present the action naturally.`;

    return prompt;
}
