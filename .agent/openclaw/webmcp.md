Implementation Plan: WebMCP Integration
This plan outlines how we will expose the existing AI tools (currently used by Kimi) to external browser agents via the Chrome WebMCP Imperative API.

Proposed Changes
1. WebMCP Hook and Types
Create new client-side infrastructure to register tools with the browser's Model Context Protocol.

[NEW] 
lib/ai/use-webmcp.ts
Create a 
useWebMCPRegistration
 React hook.
Define TypeScript interfaces for navigator.modelContext.registerTool.
Iterate through existing tool schemas (taskTools, calendarTools) specifically imported from pure client-safe schema files (lib/ai/tools/schemas/) to prevent next/headers server context leaks in the client bundle.
Write Operations: Map actions to call the Gateway API (/api/agent/tools) and extract the returned preview object. Dispatch that 
PendingAction
 directly into the 
AIContext
 so the user gets the standard confirmation UI.
Read Operations: Map actions like list_tasks to fetch data via the Gateway API and return the resulting markdown string.
2. Provider Integration
Integrate the WebMCP registration into the existing context provider so it runs when the user is logged in.

[MODIFY] 
lib/ai/AIContextProvider.tsx
Export setPendingAction and setIsOpen from the context value (if not already fully accessible) to allow the WebMCP hook to trigger the exact same UI as the internal Kimi agent.
Call the 
useWebMCPRegistration
 hook, passing the current user context (Organization ID, User ID, and dispatchers).
3. Gateway for Read Operations
Since external browser agents will execute tools client-side, but our existing read operations (
listTasks
, 
getCalendarBlocks
) are server-side functions using server Supabase clients, we need an endpoint.

[NEW] 
app/api/agent/tools/route.ts
Create a secure execution endpoint to handle client-side proxy requests from WebMCP.
Authenticate the user via standard Supabase session.
Extract tool_name and arguments from the body.
Switch on tool_name to execute the existing server functions (e.g., 
listTasks()
, searchInDocuments()) and return the resulting markdown string.
This fulfills the "Gateway" pattern described in 
context.dj
.
4. OpenClaw Skill Definition
To help the OpenClaw agent better utilize these tools, we will define a 
SKILL.md
 inside a new skill directory.

[NEW] .agents/skills/webmcp-integration/SKILL.md
Provide explicit instructions to the OpenClaw agent on how to use navigator.modelContext to find the Chrome-exposed tools.
Inform the agent that whenever it needs to schedule a task or retrieve the user's workspace, it should implicitly trust the WebMCP tool returns.
Provide instructions for the agent to navigate to the website and look for the tools first before attempting to scrape the DOM.
5. WebMCP Login Registration
To provide a seamless experience where the AI can log inside the app directly without relying on DOM manipulation.

[NEW] 
lib/ai/use-login-webmcp.ts
Create a 
useLoginWebMCPRegistration
 React hook.
This hook takes the signIn function.
It registers a login tool containing email and password properties.
It executes signIn when the agent invokes the tool.
[MODIFY] app/(auth)/login/page.tsx
Call the 
useLoginWebMCPRegistration
 hook.
Pass the context's signIn method down.
6. Settings Page AI Integration Section
To make the skill easily discoverable by humans, we will add a download button in the app's settings page.

[MODIFY] app/(dashboard)/settings/page.tsx
Add an "AI Integration" section to the settings page.
Explain that downloading and providing this skill file to an AI agent allows the agent to control the website securely.
Add a button that triggers a download of the 
SKILL.md
 content (served either as a blob or via a new simple API endpoint).
Verification Plan
Automated/Code Verification
Ensure tsc (TypeScript compiler) passes with the new 
Navigator
 interface augmentations.
Ensure the API route properly restricts access to authenticated sessions.
Manual Verification
Open the application in Chrome. Wait for the workspace to load.
Open Chrome Developer Tools -> Console.
Verify that navigator.modelContext exists (if using a supported Chrome version) or ensure the code degrades gracefully without throwing errors if the feature is unavailable.
Using an agent extension (like OpenClaw) or manually testing the WebMCP callback:
Invoke create_task. Verify that the "Pending Action Preview" UI pops up identically to when Kimi suggests a task.
Invoke list_tasks. Verify that it calls /api/agent/tools, successfully fetches the data, and returns the formatted markdown.
Go to /login unauthenticated and manually execute the login WebMCP tool, verifying that the router correctly redirects to /workspace.
Go to the Settings page and verify the "AI Integration" section exists and the download button correctly downloads the 
SKILL.md file.