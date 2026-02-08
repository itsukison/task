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
import { translateAI } from '../translation-helper';

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
            response: assistantMessage.content || translateAI(context.language, 'ai.error_generic'),
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
            response: translateAI(context.language, 'ai.error_parse'),
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
                response: translateAI(context.language, 'ai.preview_edit_document'),
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
                response: translateAI(context.language, 'ai.preview_organize'),
                pendingAction: preview,
            };
        }

        // Task tools (return pending actions)
        if (functionName === 'create_task') {
            const preview = await createTaskPreview(args);
            return {
                response: translateAI(context.language, 'ai.preview_create_task'),
                pendingAction: preview,
            };
        }

        if (functionName === 'update_task') {
            const preview = await updateTaskPreview(args);
            return {
                response: translateAI(context.language, 'ai.preview_update_task'),
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
                response: translateAI(context.language, 'ai.preview_reschedule'),
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
                response: translateAI(context.language, 'ai.preview_schedule'),
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
                response: translateAI(context.language, 'ai.preview_batch_schedule', { count: args.task_ids.length }),
                pendingAction: preview,
            };
        }

        return { response: translateAI(context.language, 'ai.error_tool_not_implemented') };
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
    if (context.language === 'ja') {
        return buildJapaneseSystemPrompt(context);
    }
    return buildEnglishSystemPrompt(context);
}

function buildEnglishSystemPrompt(context: AgentContext): string {
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

function buildJapaneseSystemPrompt(context: AgentContext): string {
    const currentDate = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    let prompt = `あなたは「Chrono」（タスク管理ワークスペースアプリ）の親切なAIアシスタントです。
ユーザーの使用言語は日本語です。日本語で自然に応対してください。

現在の日時: ${currentDate} (${currentYear}年)
${context.selectedDate ? `ユーザーが選択中のカレンダー日付: ${context.selectedDate}` : ''}

現在のコンテキスト:
- ページ: ${context.currentPage}
- 組織ID: ${context.organizationId}
`;

    if (context.currentPage === 'documents' && context.selectedDocuments && context.selectedDocuments.length > 0) {
        prompt += `\n\n選択されたドキュメント:`;
        context.selectedDocuments.forEach((doc, index) => {
            prompt += `\n${index + 1}. "${doc.title}" (ID: ${doc.id})`;
        });
        prompt += `\n\n以下の操作が可能です:
- get_document_content: ドキュメントの内容を取得します（読み取り用、または編集前に内容を確認するため）
- edit_document_content: ドキュメントを修正します（書き換え、追記、冒頭への追加、指定セクションの置換）
- organize_documents: タイトルや内容に基づいてファイルをフォルダに整理します

ドキュメント編集時の注意:
- 既存の内容を微修正・推敲する場合は、まず get_document_content で内容を確認し、適切な edit_type を使用してください:
  - 部分的な変更: edit_type="replace_section" を使用し、置換対象のテキストを正確に target_text にコピーしてください
  - 大幅な書き換え: edit_type="rewrite" で全体を置き換えます
  - 追加: edit_type="append" または "prepend" を使用します
- ドキュメントが空（新規作成）で、ゼロから書き始める場合は、直接 edit_type="rewrite" で edit_document_content を呼び出せます
- ドキュメントに関する質問に答える際は、まず get_document_content で内容を取得し、それに基づいて回答してください`;
    }

    if (context.currentPage === 'workspace') {
        prompt += `\nタスクの作成、カレンダーへのスケジュール、タスクの更新、カレンダーブロックの管理ができます。`;
        if (context.tasks) {
            prompt += `\n現在のワークスペースには ${context.tasks.length} 個のタスクがあります。`;
        }
        prompt += `\n\nツール計画と推論プロセス:
ツールを呼び出す前に、以下のように手順を考えてください:

1. **どんなデータが必要か？**
   - タスクを変更したい → task_id が必要
   - ブロックを再スケジュールしたい → block_id が必要
   - 何か新規作成したい → 直接作成ツールを呼べる

2. **どのツールがそのデータを提供するか？**
   - task_id の入手元: list_tasks (既存タスク検索) または create_task (新規タスク作成)
   - block_id の入手元: get_calendar_blocks (カレンダー検索)
   - ドキュメント内容の入手元: get_document_content

3. **どの順序で呼び出すか？**
   - あるツールのデータが別のツールで必要な場合 → 順番に呼び出す（マルチターン）
   - ツールが独立している場合 → 個別に推論可能
   - 例: "タスクXを動かして" → まず list_tasks で task_id を取得し、その結果を使う

4. **ツールの依存関係をチェック:**
   - 各ツールの説明にある必須入力（REQUIRES）を確認
   - 各ツールの戻り値を確認
   - 呼び出す前によく読むこと

推論の例:
- ユーザー: "あしたの夜、暇なときに映画を見るタスクを入れて"
- 思考: 新規タスク作成とスケジューリングが必要 → create_task でタスク作成 → schedule_task で空き時間を探す
- schedule_task は自動的に空きスロットを見つけ、確認用のプレビューを返します
- ユーザーに時間を尋ねるのではなく、空いている時間を提案してください

- ユーザー: "今日のタスクを全部スケジュールして"
- 思考: 複数のタスクをスケジュールする必要がある → list_tasks で今日のタスクIDを全て取得 → auto_schedule_tasks にIDリストを渡す

- ユーザー: "9時から30分間、読書のタスクを追加して"
- 思考: 時間指定あり "9時から" → 本日の9時を計算 (${currentYear}-02-07T09:00:00+09:00) → create_task(title="読書", scheduled_start_time="...", expected_time_minutes=30)`;

        prompt += `\n\n一般的なツールの使用法:
- 全ツールの依存関係と戻り値は説明文に記載されています
- あるツールの出力が別のツールに入力される場合は、マルチターンワークフローを使用します
- 変更操作（作成、更新、削除、再スケジュール）は、ユーザー確認が必要なプレビューを返します
- 参照操作（一覧、取得、検索）は、すぐに使用可能なデータを返します

応答のガイドライン:
- プロアクティブに: ツールからデータが返ってきたら、即座にそれを使ってリクエストを完了させてください
- UUIDを会話に出さないでください - 人間が読める名前（タスク名など）だけを使用してください
- スケジューリング時: 自動的に最初の空きスロットを提案し、ユーザーにいちいち尋ねないでください
- 例: "今夜7時に予定を入れました"（プレビュー表示）、×"いつにしますか？"

データフォーマットのガイドライン:
- expected_time_minutes: タスクには必須（> 0）。指定がなければ推定してください。
- ISO 8601 日時: タイムゾーンオフセットを必ず含めてください。フォーマット: "${currentYear}-02-07T09:00:00+09:00" (例)。ユーザーのタイムゾーンは UTC+9 (日本) です。
- ISO 日付: 日付のみの場合は "YYYY-MM-DD" フォーマット
- 現在の年: ${currentYear} - 明示的な指定がない限りこの年を使用
- 相対日付 ("今日", "明日") は ${currentDate} を基準に計算
${context.selectedDate ? `- 選択された日付: ${context.selectedDate}` : ''}

ツール結果の参照（内部使用のみ - UUIDはユーザーに見せない）:
- list_tasks の戻り値: [Task refs: 1→uuid1 2→uuid2...] - uuidを抽出して内部で使用
- get_calendar_blocks の戻り値: [Block refs: 1→uuid1 2→uuid2...] - uuidを抽出して内部で使用
- 会話での応答では、タスクやブロックの名称のみを使用してください`;
    }

    prompt += `\n\n重要: 変更操作（作成、更新、削除、再スケジュール）を行う場合は、必ず適切なツールを使用してください。ツールは確認用のプレビューを返します。「確認待ちです」と直接言うのではなく、自然にアクション（プレビュー）を提示してください。`;

    return prompt;
}
