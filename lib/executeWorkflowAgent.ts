import { Stagehand } from "@browserbasehq/stagehand";
import Browserbase from "@browserbasehq/sdk";
import { createClient } from '@/lib/supabase/server';
import { extractPlainText } from './tiptap';
import { detectAuthWall } from './executeWorkflow';

const AUTH_TIMEOUT_MS = 10 * 60 * 1000;

function formatToolCallMessage(toolCall: any): string | null {
    const name: string = toolCall.toolName ?? toolCall.name ?? '';
    let args: any = toolCall.args ?? toolCall.arguments ?? {};

    // args may be a plain string (e.g. goto passes the URL directly as a string)
    if (typeof args === 'string') {
        try { args = JSON.parse(args); } catch {
            // Keep as string — goto and similar pass the value directly
        }
    }

    const url = typeof args === 'string' ? args : (args.url ?? args.href);
    const instruction = typeof args === 'string' ? args : args.instruction;

    switch (name) {
        case 'goto': return `🌐 Navigating to ${url ?? '...'}`;
        case 'act': return instruction ? `🖱️ ${instruction}` : `🖱️ Interacting...`;
        case 'fillForm': return `📝 Filling form...`;
        case 'extract': return instruction ? `🔍 Reading: ${instruction}` : `🔍 Extracting data...`;
        case 'wait': return `⏳ Waiting...`;
        case 'scroll': return `↕️ Scrolling page...`;
        case 'keys': return `⌨️ Pressing ${args.keys ?? args}`;
        case 'navback': return `↩ Going back...`;
        case 'search': return `🔍 Searching: ${args.query ?? args}`;
        case 'think':
        case 'ariaTree':
        case 'screenshot':
            return null;
        default:
            return null;
    }
}

interface HandleAuthPauseParams {
    stagehand: Stagehand;
    bbSessionId: string;
    workflowId: string;
    userId: string;
    chatSessionId: string;
    supabase: any;
    variables: Record<string, string>;
    contextId: string | null;
    connectUrl: string;
    pageUrl: string;
}

async function handleAuthPause({
    stagehand,
    bbSessionId,
    workflowId,
    userId,
    chatSessionId,
    supabase,
    variables,
    contextId,
    connectUrl,
    pageUrl,
}: HandleAuthPauseParams): Promise<void> {
    const expiresAt = new Date(Date.now() + AUTH_TIMEOUT_MS).toISOString();

    const { data: execution } = await supabase
        .from('workflow_executions')
        .insert({
            workflow_id: workflowId,
            user_id: userId,
            browserbase_session_id: bbSessionId,
            chat_session_id: chatSessionId,
            paused_at_step: 0,
            variables,
            status: 'paused',
            context_id: contextId ?? null,
            connect_url: connectUrl,
            expires_at: expiresAt,
        })
        .select('id')
        .single();

    let service = pageUrl;
    try { service = new URL(pageUrl).hostname; } catch { }

    await supabase.from('chat_messages').insert({
        session_id: chatSessionId,
        role: 'assistant',
        content: JSON.stringify({
            type: 'AUTH_REQUIRED',
            service,
            connectUrl,
            executionId: execution?.id,
            expiresAt,
        }),
    });

    // Schedule session close after timeout
    setTimeout(async () => {
        console.log(`[WorkflowAgent] Auth timeout — closing session ${bbSessionId}`);
        await stagehand.close().catch(() => { });
        if (execution?.id) {
            const supabaseInner = await createClient();
            await supabaseInner.from('workflow_executions')
                .update({ status: 'expired' })
                .eq('id', execution.id);
            await supabaseInner.from('chat_messages').insert({
                session_id: chatSessionId,
                role: 'assistant',
                content: '⏰ Login window expired. Please run the workflow again to retry.',
            });
        }
    }, AUTH_TIMEOUT_MS);
}

export async function executeWorkflowAgent(
    workflowId: string,
    variables: Record<string, string>,
    userId: string,
    chatSessionId: string,
) {
    const supabase = await createClient();
    let stagehand: Stagehand | null = null;
    let isAborting = false;

    const logToChat = async (message: string) => {
        console.log(`[WorkflowAgent]: ${message}`);
        await supabase.from('chat_messages').insert({
            session_id: chatSessionId,
            role: 'assistant',
            content: message,
        });
    };

    try {
        // 1. Fetch workflow — no workflow_steps join needed
        const { data: workflow, error: workflowError } = await supabase
            .from('workflows')
            .select('*')
            .eq('id', workflowId)
            .single();

        if (workflowError || !workflow) throw new Error('Workflow not found');

        // 2. Extract plain text from Tiptap content
        const rawInstruction = extractPlainText(workflow.content);
        if (!rawInstruction.trim()) throw new Error('Workflow has no content to execute');

        // 3. Interpolate variables
        let resolvedInstruction = rawInstruction;
        for (const [key, value] of Object.entries(variables)) {
            resolvedInstruction = resolvedInstruction.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }

        // 4. Look up (or create) Browserbase context for cookie persistence.
        // Use workflow.site as the service key; fall back to workflow ID so that
        // null/empty site values still get a stable key (avoids SQL `= null` never matching).
        const serviceKey = workflow.site || `workflow:${workflowId}`;

        const { data: contextRecord } = await supabase
            .from('user_service_contexts')
            .select('context_id')
            .eq('user_id', userId)
            .eq('service', serviceKey)
            .single();

        let contextId: string | null = contextRecord?.context_id ?? null;

        // If no context exists yet, create one now so cookies from any login are
        // persisted to this context with persist:true and survive session boundaries.
        if (!contextId) {
            const bbCtx = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
            const newCtx = await bbCtx.contexts.create({
                projectId: process.env.BROWSERBASE_PROJECT_ID!,
            });
            contextId = newCtx.id;
            await supabase.from('user_service_contexts').insert({
                user_id: userId,
                service: serviceKey,
                context_id: contextId,
            });
            console.log(`[WorkflowAgent] Created context ${contextId} for service "${serviceKey}"`);
        }

        // 5. Init Stagehand with experimental: true (required for onStepFinish + signal)
        stagehand = new Stagehand({
            env: 'BROWSERBASE',
            experimental: true,
            apiKey: process.env.BROWSERBASE_API_KEY,
            projectId: process.env.BROWSERBASE_PROJECT_ID,
            browserbaseSessionCreateParams: {
                browserSettings: { context: { id: contextId, persist: true } },
            },
            model: {
                modelName: 'openai/gpt-4o',
                apiKey: process.env.OPENAI_API_KEY!,
            } as any,
        } as any);

        await stagehand.init();

        // 6. Get Browserbase session ID — fail loudly if not exposed
        const bbSessionId: string = (stagehand as any).browserbaseSessionID;
        if (!bbSessionId) throw new Error('Stagehand did not expose browserbaseSessionID — check SDK version');

        // 7. Get embeddable live viewer URLs via the debug endpoint.
        // sessions.retrieve() only returns a wss:// CDP URL which cannot be used in an iframe.
        // sessions.debug() returns debuggerUrl / debuggerFullscreenUrl which ARE HTTPS and embeddable.
        // Stagehand already calls sessions.debug() internally and stores the result as browserbaseDebugUrl.
        const bb = new Browserbase({
            apiKey: process.env.BROWSERBASE_API_KEY!,
        });
        const debugInfo = await bb.sessions.debug(bbSessionId);
        // debuggerFullscreenUrl: full-page view, best for inline preview iframe
        // debuggerUrl: Chrome DevTools view, interactive — best for "open browser" auth flow
        const connectUrl: string =
            debugInfo.debuggerFullscreenUrl ||
            debugInfo.debuggerUrl ||
            `https://www.browserbase.com/sessions/${bbSessionId}`;
        const interactiveUrl: string =
            debugInfo.debuggerUrl ||
            debugInfo.debuggerFullscreenUrl ||
            connectUrl;

        // 8. Insert BROWSER_LIVE message so the chat renders the live iframe
        await supabase.from('chat_messages').insert({
            session_id: chatSessionId,
            role: 'assistant',
            content: JSON.stringify({
                type: 'BROWSER_LIVE',
                connectUrl,         // debuggerFullscreenUrl — for inline preview iframe
                interactiveUrl,     // debuggerUrl — for interactive modal / open-in-tab
                sessionId: bbSessionId,
            }),
        });

        // 9. Create AbortController
        const abortController = new AbortController();

        // 10. Get page reference
        const pages = stagehand.context.pages();
        const page = pages.length > 0 ? pages[0] : await stagehand.context.newPage();

        // 11. Create and execute agent in hybrid mode
        // hybrid = DOM tools (act/fillForm/extract) + coordinate tools (click/type/dragAndDrop)
        // Callbacks and AbortSignal work in hybrid (non-CUA only features).
        const agent = (stagehand as any).agent({
            mode: 'hybrid',
            model: 'openai/gpt-4o',
            systemPrompt: `You are an autonomous browser agent executing a workflow called "${workflow.name}".
Target site: ${workflow.site || 'not specified'}.

━━━ TOOL USAGE — READ CAREFULLY ━━━

INTERACTING WITH ELEMENTS:
  Primary:  act("click the Submit button")     ← use this for almost everything
  Keyboard: keys(["Escape"]) or keys(["Tab","Enter"])  ← for shortcuts and key combos
  Last resort only: screenshot() → then click({x, y}) ← ONLY if act and keys both fail
  NEVER call click() with a text description — click() requires numeric {x, y} coordinates.

READING THE PAGE:
  Use extract() or ariaTree() to read content.
  Use screenshot() only when you need to see visual layout or locate coordinates for click().

DISMISSING INTERRUPTIONS — follow this exact sequence:
  Step 1: try act("click [button label]") with the label you see (e.g. "Not now", "Dismiss", "Later", "Got it", "Close", "Block", "Decline")
  Step 2: if act fails or times out → keys(["Escape"])
  Step 3: if Escape has no effect → screenshot(), identify the button's coordinates, then click({x, y})
  Step 4: after dismissing, immediately continue the workflow from where you left off
  Step 5: if the same interruption reappears, repeat steps 1-3 once more then continue regardless

INTERRUPTION TYPES TO AUTO-DISMISS (do NOT let these block the workflow):
  - Notification permission prompts ("Allow" / "Block" / "Not now") → decline/not now
  - Cookie / privacy consent banners → accept or close
  - App update dialogs ("Update" / "Later" / "Got it") → later or got it
  - Incoming call / meeting alerts → dismiss or decline
  - Marketing / subscription upsell dialogs → close or not now
  - Onboarding tour overlays → skip or close
  - "Sign in to sync" or account prompts (if not the target site login) → close/no thanks

━━━ STOP CONDITIONS ━━━

ONLY stop and report failure if you encounter:
  - A LOGIN or SIGN-IN page for the target site requiring credentials you don't have
  - An explicit error page (404, 500, account suspended) that blocks the workflow goal
  - The workflow goal is genuinely complete

Do NOT stop for interruptions, popups, or unexpected UI — dismiss and continue.`,
        });

        const result = await agent.execute({
            instruction: resolvedInstruction,
            maxSteps: 50,
            page,
            signal: abortController.signal,
            callbacks: {
                onStepFinish: async (event: any) => {
                    if (isAborting) return;

                    for (const toolCall of event.toolCalls ?? []) {
                        const msg = formatToolCallMessage(toolCall);
                        if (msg) await logToChat(msg);
                    }

                    // Auth wall check after EVERY step
                    const currentPage = stagehand?.context.pages()[0];
                    if (!isAborting && currentPage) {
                        const authWall = await detectAuthWall(currentPage).catch(() => false);
                        if (authWall) {
                            isAborting = true;
                            const currentUrl = currentPage.url();
                            await handleAuthPause({
                                stagehand: stagehand!,
                                bbSessionId,
                                workflowId,
                                userId,
                                chatSessionId,
                                supabase,
                                variables,
                                contextId,
                                connectUrl: interactiveUrl, // use interactive URL for auth flow
                                pageUrl: currentUrl,
                            });
                            abortController.abort('AUTH_REQUIRED');
                        }
                    }
                },
            },
        });

        if (isAborting) {
            return { success: false, paused: true };
        }

        await logToChat(`✨ ${result?.message || 'Workflow completed successfully.'}`);
        await stagehand.close();
        return { success: true };

    } catch (error: any) {
        if (isAborting) {
            // Auth wall triggered graceful abort — already handled
            return { success: false, paused: true };
        }

        console.error('[WorkflowAgent] Execution failed:', error);
        await supabase.from('chat_messages').insert({
            session_id: chatSessionId,
            role: 'assistant',
            content: `❌ Workflow failed: ${error.message}`,
        });

        if (stagehand) await stagehand.close().catch(() => { });
        return { success: false, error: error.message };
    }
}
