'use client';

import { useEffect, useRef } from 'react';

export function useLoginWebMCPRegistration(
    signIn: (email: string, pass: string) => Promise<any>
) {
    const hasRegistered = useRef(false);

    useEffect(() => {
        // Only run on client, if the browser supports WebMCP
        if (typeof window === 'undefined' || !navigator.modelContext) {
            return;
        }

        if (hasRegistered.current) return;
        hasRegistered.current = true;

        console.log('🌐 WebMCP: Registering login tool for external agents...');

        navigator.modelContext.registerTool({
            name: 'login',
            description: 'Log into the Chrono application using credentials. Use this if you are not currently authenticated but need to access the user workspace. RETURNS: A success message, and the browser will automatically navigate you to the workspace.',
            schema: {
                type: 'object',
                properties: {
                    email: {
                        type: 'string',
                        description: 'User email address',
                    },
                    password: {
                        type: 'string',
                        description: 'User password',
                    },
                },
                required: ['email', 'password'],
            },
            execute: async (args: any) => {
                console.log('🤖 WebMCP Executing login:', args);
                try {
                    await signIn(args.email, args.password);
                    return { message: "Successfully logged in. The router is now redirecting to /workspace. Please wait for the page to navigate before issuing further commands." };
                } catch (err: any) {
                    return { error: `Login failed: ${err.message}` };
                }
            }
        });

    }, [signIn]);
}
