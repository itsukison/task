# AI Agent Architecture & Kimi Integration

## Overview
The AI Assistant is a context-aware agent integrated into the workspace. It uses the **Moonshot Kimi 2.5 model** (`moonshot-v1-128k`) via an OpenAI-compatible interface to understand user intent, analyze documents, and manage tasks.

## 1. Model & Integration
We use the **Moonshot API** (Kimi) for its strong reasoning capabilities and long context window (128k), which is essential for processing large documents.

- **Client**: Standard `openai` Node.js library.
- **Endpoint**: `https://api.moonshot.ai/v1` (International endpoint).
- **Authentication**: Bearer token via `MOONSHOT_API_KEY`.
- **Context Injection**: The `orchestrator.ts` injects critical context into the system prompt:
    - Current Page (Workspace vs Documents)
    - Current Date & Year (for accurate scheduling)
    - User & Organization IDs
    - Active Document Selection

## 2. Dynamic Tool System
Tools are explicitly defined functions that the AI can "call". The system dynamically enables tools based on the user's current context to reduce noise and improve accuracy.

### Tool Registry
| Scope | Tools | Description |
|-------|-------|-------------|
| **Global** | *None* | (Future generic chat tools) |
| **Workspace** | `create_task`<br>`update_task`<br>`list_tasks`<br>`get_calendar_blocks`<br>`suggest_reschedule`<br>`schedule_task` | Management of tasks and calendar. Intelligent scheduling with conflict detection. |
| **Documents** | `get_document_content`<br>`search_in_documents`<br>`edit_document_content`<br>`organize_documents` | RAG (Retrieval-Augmented Generation) capabilities, document editing, and automated organization. |

### Logic (`orchestrator.ts`)
1.  **Context Analysis**: Checks `context.currentPage`.
2.  **Tool Loading**:
    - If `currentPage === 'workspace'`, load task & calendar tools (6 tools total).
    - If `currentPage === 'documents'` AND user has selected docs, load document tools (4 tools total).
3.  **Schema Generation**: Converts TS definitions to OpenAI JSON schemas.
4.  **Document Processing**: When `get_document_content` is called:
    - **Text documents**: Extracts text from Tiptap JSON format
    - **PDFs**: On-demand extraction using `unpdf` library (supports text-based PDFs, not scanned images)
    - **Links**: On-demand web scraping using `cheerio` (extracts main content, removes scripts/styles)
    - All content is validated against `MAX_DOCUMENT_CHARS` limit before returning

## 3. Execution Flow (The "Think-Plan-Act" Loop)

The architecture distinguishes between **Safe (Read)** and **Unsafe (Write)** operations.

### Read Operations (Server-Side Execution)
*Examples: Searching documents, listing tasks, checking calendar.*
1.  **User**: "Find the marketing plan in these docs."
2.  **Orchestrator**: Sends prompt + tools to Kimi.
3.  **Kimi**: Returns `tool_call: search_in_documents("marketing plan")`.
4.  **Orchestrator**: 
    - Executed immediately on the server.
    - Queries Supabase Vector/Database.
    - Feeds result back to Kimi as a new `tool` message.
5.  **Kimi**: Generates final natural language response based on data.
6.  **User**: Sees the answer.

### Write Operations (Client-Side Confirmation)
*Examples: Creating tasks, rescheduling meetings, editing documents, organizing files.*
1.  **User**: "Schedule a meeting with Natsuki at 4pm."
2.  **Orchestrator**: Sends prompt + tools to Kimi.
3.  **Kimi**: Returns `tool_call: create_task(...)` with structured data (title, time).
4.  **Orchestrator**: **STOPS**. Does *not* execute. Returns a `PendingAction` object to the client.
5.  **Client UI**: Renders a "Pending Action Preview" (e.g., a card showing the Task Title and Time).
6.  **User**: Clicks "Confirm".
7.  **Client (`AIContextProvider`)**: Executes the actual database write (via Supabase Client).
    - *Note*: This ensures the AI never mutates data without explicit user approval.

**Pending Action Types:**
- `PendingTaskAction`: Task creation or updates
- `PendingCalendarAction`: Calendar block rescheduling (with before/after preview)
- `PendingScheduleAction`: Smart scheduling (shows proposed time slot)
- `PendingDocumentEditAction`: Document content edits (with before/after preview)
- `PendingOrganizeAction`: Folder organization (shows folder structure and move operations)

## 4. New Tool Features

### Workspace Tools

**`schedule_task`** (Smart Scheduling)
- Intelligently finds the next available time slot for a task
- Respects work hours (9am-5pm by default)
- Avoids conflicts with existing calendar blocks
- Uses task's `expected_time_minutes` to find correctly-sized slots
- Supports preferred date and time preferences
- Can search multiple days ahead if preferred date is full
- Returns a `PendingScheduleAction` for user confirmation

**`suggest_reschedule`** (Calendar Block Rescheduling)
- Moves an existing calendar block to a new time
- Requires first calling `get_calendar_blocks` to find the block ID
- Maintains the original duration while changing the time
- Returns a `PendingCalendarAction` showing before/after comparison

### Document Tools

**`edit_document_content`** (Document Editing)
- Edits text documents with four modes:
  - **rewrite**: Replace entire document content
  - **append**: Add content to the end
  - **prepend**: Add content to the beginning
  - **replace_section**: Find and replace specific text (requires exact `target_text`)
- Only works on native text documents (not uploaded files or links)
- Returns a `PendingDocumentEditAction` with before/after preview
- Requires calling `get_document_content` first to see current state

**`organize_documents`** (Automated Organization)
- Analyzes document titles and content to suggest folder structure
- Creates new folders or uses existing ones
- Moves multiple documents into categorized folders
- Can organize all documents in current folder or a specific selection
- Returns a `PendingOrganizeAction` showing folder structure and move operations
- AI determines logical groupings based on document metadata

### Multi-Turn Conversation Support
Several tools now support multi-turn conversations, allowing the AI to chain tool calls:
- `list_tasks` → `update_task` (e.g., "mark dinner as completed")
- `get_calendar_blocks` → `suggest_reschedule` (e.g., "move my meeting to 3pm")
- `get_document_content` → AI analysis/summarization

The orchestrator handles this by feeding tool results back to Kimi, allowing it to decide the next action.

## 5. Key Files
- `lib/ai/agents/orchestrator.ts`: The "Brain". Handles prompting, tool filtering, and the read/write loop.
- `lib/ai/kimi-client.ts`: Connection settings for Moonshot API.
- `lib/ai/tools/*.ts`: Tool definitions and server-side read implementations.
  - `lib/ai/tools/task-tools.ts`: Task creation, updates, and listing
  - `lib/ai/tools/calendar-tools.ts`: Calendar blocks, rescheduling, smart scheduling
  - `lib/ai/tools/document-tools.ts`: Document retrieval, search, editing, and organization
- `components/ai/PendingActionPreview.tsx`: UI for human-in-the-loop verification.
- `app/api/ai/chat/route.ts`: API Endpoint securing the conversation.
- `lib/hooks/use-subtasks.ts`: Client-side hook for subtask management (UI only, no AI tool yet)
- `lib/hooks/use-task-documents.ts`: Client-side hook for linking documents to tasks (UI only, no AI tool yet)
