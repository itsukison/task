'use client';

import { useEffect, useRef } from 'react';
import { useAI } from './AIContextProvider';
import { taskTools } from './tools/schemas/task-schema';
import { calendarTools } from './tools/schemas/calendar-schema';
import { PendingAction } from './types';

// WebMCP TypeScript Definitions
declare global {
    interface Navigator {
        modelContext?: {
            registerTool(tool: WebMCPTool): void;
        };
    }
}

interface WebMCPTool {
    name: string;
    description: string;
    schema: any;
    execute: (args: any) => Promise<any> | any;
}

export function useWebMCPRegistration(
    organizationId: string | undefined,
    userId: string | undefined,
    setPendingAction: (action: PendingAction | null) => void,
    setIsOpen: (isOpen: boolean) => void
) {
    // Prevent double registration in StrictMode
    const hasRegistered = useRef(false);

    useEffect(() => {
        // Only run on client, when we have auth, and if the browser supports it
        if (!organizationId || !userId || typeof window === 'undefined' || !navigator.modelContext) {
            return;
        }

        if (hasRegistered.current) return;
        hasRegistered.current = true;

        console.log('🌐 WebMCP: Registering internal tools for external agents...');

        const executeViaGateway = async (tool_name: string, args: any, expectsPreview: boolean = false) => {
            try {
                const res = await fetch('/api/agent/tools', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tool_name,
                        arguments: args,
                        // Provide context for tools that might need it (e.g., schedule_task)
                        context: {
                            organizationId,
                            userId,
                            currentPage: 'workspace',
                            language: 'en'
                        }
                    })
                });

                const data = await res.json();

                if (data.error) {
                    return { error: data.error };
                }

                if (expectsPreview) {
                    setPendingAction(data.preview);
                    setIsOpen(true);
                    return { message: "Action requires user confirmation in the Chrono UI." };
                }

                return data.result;
            } catch (err: any) {
                console.error(`Error executing ${tool_name}:`, err);
                return { error: `Execution failed: ${err.message}` };
            }
        };

        const register = async () => {
            // ----------------------------------------------------------------
            // WRITE OPERATIONS (Route to internal PendingAction UI)
            // ----------------------------------------------------------------

            const writeTools = ['create_task', 'update_task', 'schedule_task', 'suggest_reschedule'];

            for (const toolName of writeTools) {
                const toolDef = [...taskTools, ...calendarTools].find(t => t.function.name === toolName)?.function;
                if (toolDef) {
                    navigator.modelContext!.registerTool({
                        name: toolDef.name,
                        description: toolDef.description,
                        schema: toolDef.parameters,
                        execute: async (args: any) => {
                            console.log(`🤖 WebMCP Executing ${toolName}:`, args);
                            return executeViaGateway(toolName, args, true);
                        }
                    });
                }
            }

            // ----------------------------------------------------------------
            // READ OPERATIONS (Proxy directly and get result string)
            // ----------------------------------------------------------------

            const readTools = ['list_tasks', 'get_calendar_blocks'];

            for (const toolName of readTools) {
                const toolDef = [...taskTools, ...calendarTools].find(t => t.function.name === toolName)?.function;
                if (toolDef) {
                    navigator.modelContext!.registerTool({
                        name: toolDef.name,
                        description: toolDef.description,
                        schema: toolDef.parameters,
                        execute: async (args: any) => {
                            console.log(`🤖 WebMCP Executing ${toolName} via Gateway:`, args);
                            return executeViaGateway(toolName, args, false);
                        }
                    });
                }
            }
        };

        register();

    }, [organizationId, userId, setPendingAction, setIsOpen]);
}
