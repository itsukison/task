---
name: webmcp-integration
description: Instructions for checking and using Chrome WebMCP tools exposed by the application instead of relying on DOM scraping.
---

# WebMCP Integration Skill

The Taskle application has been upgraded to support the **Browser Model Context Protocol (WebMCP)** via the Imperative API (`navigator.modelContext.registerTool`).

As an AI Agent, when you are tasked with operating within the Taskle application workspace, you should **always prioritize using WebMCP tools** over brittle DOM scraping and interaction.

## Available WebMCP Tools

The following tools are exposed directly by the Taskle application via WebMCP. **Do not attempt to perform these tasks via DOM manipulation if you are on the corresponding page.**

**On the `/login` page:**
*   `login`: Authenticates the user and navigates to the workspace. Requirements: `email`, `password`.

**On the `/workspace` page:**
*   `list_tasks`: Retrieves a markdown-formatted list of tasks. Allows filtering by `status` or `scheduled_date`.
*   `create_task`: Drafts a new task. Requires `title`. Triggers user confirmation.
*   `update_task`: Edits an existing task. Requires `task_id`. Triggers user confirmation.
*   `schedule_task`: Finds available time slots for a task and drafts a calendar schedule. Requires `task_id`. Triggers user confirmation.
*   `suggest_reschedule`: Finds alternative time slots for a currently scheduled task. Requires `task_id` and `reason`. Triggers user confirmation.
*   `get_calendar_blocks`: Retrieves a markdown-formatted list of calendar events/blocks for the user. Allows filtering by date range.

*Note: The Taskle application ONLY supports the actions listed above via WebMCP. If tasked with an operation NOT listed here (e.g., changing user settings, creating documents from scratch, or organizing the sidebar), you must inform the user that the action is not currently supported by the application's AI integration.*

## How to use WebMCP in Taskle

1. **Authentication:**
   - The application is hosted at: `https://chrono-zeta-seven.vercel.app/`
   - If you need to log in to the application, navigate to `https://chrono-zeta-seven.vercel.app/login`.
   - Before attempting to fill out the form using DOM selectors, check for the `login` tool exposed via WebMCP.
   - Invoke the `login` tool with the provided `email` and `password`. The application will handle the authentication and redirection automatically.

2. **Operating the Workspace:**
   - Once logged in and on the `/workspace` page, the application will automatically register its internal tools (e.g., `list_tasks`, `create_task`, `schedule_task`).
   - Use these tools to perform actions directly.
   - **Important:** Write operations (like `create_task`) will trigger a "Pending Action Preview" UI for the human user to confirm. Once you invoke the tool, you will receive a message stating that confirmation is required. Do not attempt to click "Confirm" yourself; simply notify the user and wait for their input.

3. **Trusting Outputs:**
   - The outputs from read tools (like `list_tasks`) are specifically formatted in concise Markdown designed for AI consumption. Trust these outputs as the source of truth for the workspace state.

## Best Practices

- Always check `navigator.modelContext` (if your automation framework supports it) upon navigating to a new page within Taskle.
- Do not attempt to use DOM manipulation or key presses to trigger actions. If an action is not exposed via WebMCP, it is not currently supported.
