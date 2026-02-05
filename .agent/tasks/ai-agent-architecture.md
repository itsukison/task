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
| **Workspace** | `create_task`<br>`update_task`<br>`list_tasks`<br>`get_calendar_blocks` | Management of tasks and calendar. |
| **Documents** | `get_document_content`<br>`search_in_documents` | RAG (Retrieval-Augmented Generation) capabilities. |

### Logic (`orchestrator.ts`)
1.  **Context Analysis**: Checks `context.currentPage`.
2.  **Tool Loading**: 
    - If `currentPage === 'workspace'`, load task & calendar tools.
    - If `currentPage === 'documents'` AND user has selected docs, load document tools.
3.  **Schema Generation**: Converts TS definitions to OpenAI JSON schemas.

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
*Examples: Creating tasks, rescheduling meetings.*
1.  **User**: "Schedule a meeting with Natsuki at 4pm."
2.  **Orchestrator**: Sends prompt + tools to Kimi.
3.  **Kimi**: Returns `tool_call: create_task(...)` with structured data (title, time).
4.  **Orchestrator**: **STOPS**. Does *not* execute. Returns a `PendingAction` object to the client.
5.  **Client UI**: Renders a "Pending Action Preview" (e.g., a card showing the Task Title and Time).
6.  **User**: Clicks "Confirm".
7.  **Client (`AIContextProvider`)**: Executes the actual database write (via Supabase Client).
    - *Note*: This ensures the AI never mutates data without explicit user approval.

## 4. Key Files
- `lib/ai/agents/orchestrator.ts`: The "Brain". Handles prompting, tool filtering, and the read/write loop.
- `lib/ai/kimi-client.ts`: Connection settings for Moonshot API.
- `lib/ai/tools/*.ts`: Tool definitions and server-side read implementations.
- `components/ai/PendingActionPreview.tsx`: UI for human-in-the-loop verification.
- `app/api/ai/chat/route.ts`: API Endpoint securing the conversation.
