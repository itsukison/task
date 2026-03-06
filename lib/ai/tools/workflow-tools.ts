// ============================================================================
// Workflow Execution Tool for the AI Orchestrator
// ============================================================================

export const workflowTools = [
    {
        type: "function" as const,
        function: {
            name: "execute_workflow",
            description: `Execute a user's saved browser automation workflow using AI-powered browser control (Stagehand). 
Use this tool when:
- The user mentions a @workflow by name
- The user asks to run, start, or trigger an automation
- The user wants to perform an action on an external website (Zoom, Notion, Gmail, etc.)

Do NOT use task creation tools (create_task) as a substitute for running a workflow.
The workflow will run in the background and stream progress updates to the chat.`,
            parameters: {
                type: "object",
                properties: {
                    workflow_id: {
                        type: "string",
                        description: "The ID of the workflow to execute. This is provided in the context when a workflow is mentioned."
                    },
                    variables: {
                        type: "object",
                        description: "Key-value pairs extracted from the user's message that fill in workflow step placeholders like {topic}, {date}, {attendees}. Extract these from the user's message.",
                        additionalProperties: { type: "string" }
                    }
                },
                required: ["workflow_id"]
            }
        }
    }
];
