import { Stagehand } from "@browserbasehq/stagehand";
import { createClient } from '@/lib/supabase/server';

const AUTH_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/** Detect if the current page is an auth wall via URL-first, DOM-fallback */
export async function detectAuthWall(page: any): Promise<boolean> {
    const url: string = page.url();

    // URL-first: reliable for JS-heavy flows (Google, Microsoft, etc.)
    if (
        url.includes('accounts.google.com') ||
        url.includes('login.microsoftonline.com') ||
        /[/?=](login|signin|auth)(\b|$)/i.test(url)
    ) {
        return true;
    }

    // DOM fallback: password field visible (for services that don't redirect)
    const hasPasswordInput = await page.evaluate(() =>
        !!document.querySelector('input[type="password"]')
    );
    return hasPasswordInput;
}

/** @deprecated Use executeWorkflowAgent instead */
export async function executeWorkflow(
    workflowId: string,
    variables: Record<string, string>,
    userId: string,
    sessionId: string,
    options?: {
        resumeFromStep?: number;
        existingSessionId?: string;
    }
) {
    const AUTH_TIMEOUT_MS = 10 * 60 * 1000;
    let stagehand: Stagehand | null = null;
    let authTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

    try {
        const supabase = await createClient();

        const logToChat = async (message: string) => {
            console.log(`[Workflow]: ${message}`);
            await supabase.from('chat_messages').insert({
                session_id: sessionId,
                role: 'assistant',
                content: `🤖 ${message}`
            });
        };

        await logToChat("Starting workflow execution...");

        // 1. Fetch workflow and steps
        const { data: workflow, error: workflowError } = await supabase
            .from('workflows')
            .select(`*, workflow_steps (*)`)
            .eq('id', workflowId)
            .single();

        if (workflowError || !workflow) throw new Error("Workflow not found");

        const allSteps = workflow.workflow_steps.sort((a: any, b: any) => a.order_index - b.order_index);
        const startStep = options?.resumeFromStep ?? 0;
        const steps = allSteps.slice(startStep);

        console.log(`[Workflow] ${steps.length} steps to execute (starting at step ${startStep})`);

        // 2. Get Browserbase Context for this site (for auth persistence)
        const { data: contextRecord } = await supabase
            .from('user_service_contexts')
            .select('context_id')
            .eq('user_id', userId)
            .eq('service', workflow.site)
            .single();

        const contextId = contextRecord?.context_id;

        await logToChat(`Initializing connection to ${workflow.site}...`);

        // 3. Init Stagehand — reconnect to existing session if resuming
        stagehand = new Stagehand({
            env: "BROWSERBASE",
            apiKey: process.env.BROWSERBASE_API_KEY,
            projectId: process.env.BROWSERBASE_PROJECT_ID,
            ...(options?.existingSessionId
                ? { browserbaseSessionID: options.existingSessionId }
                : {
                    browserbaseSessionCreateParams: contextId ? {
                        browserSettings: { context: { id: contextId, persist: true } },
                    } : undefined,
                }),
            model: {
                modelName: "openai/gpt-4o",
                apiKey: process.env.OPENAI_API_KEY!,
            } as any,
        });

        await stagehand.init();

        // 4. Get page reference
        const pages = stagehand.context.pages();
        const page = pages.length > 0 ? pages[0] : await stagehand.context.newPage();
        if (!page) throw new Error("Failed to initialize browser page");

        // Log live session URL
        const bbSessionId = (stagehand as any).browserbaseSessionID ?? options?.existingSessionId;
        if (bbSessionId) {
            const liveUrl = `https://www.browserbase.com/sessions/${bbSessionId}`;
            console.log(`[Workflow] 📹 Browserbase session: ${liveUrl}`);
            await logToChat(`📹 Watch live: [Open Browserbase Session](${liveUrl})`);
        }

        // 5. Execution Loop
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const absoluteStepIndex = startStep + i;

            // Interpolate variables
            let instruction = step.instruction;
            for (const [key, value] of Object.entries(variables)) {
                instruction = instruction.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
            }

            await logToChat(`Step ${absoluteStepIndex + 1}/${allSteps.length}: ${instruction}`);

            // A. Cached Selector fast path
            if (step.cached_selector) {
                await logToChat(`⚡ Using cached selector: ${step.cached_selector}`);
                try {
                    await page.locator(step.cached_selector).click({ timeout: 5000 } as any);
                    await page.waitForLoadState('networkidle');
                    await logToChat(`✅ Step successful (cached)`);
                    continue;
                } catch (e) {
                    console.warn(`[Workflow] Cached selector failed for step ${absoluteStepIndex + 1}:`, e);
                    await logToChat(`⚠️ Cached selector failed, falling back to AI...`);
                }
            }

            // B. Navigation step — act() cannot navigate, use goto() directly
            const navMatch = instruction.match(/^(?:go to|navigate to|open|visit)\s+(https?:\/\/\S+)/i);
            if (navMatch) {
                const url = navMatch[1];
                console.log(`[Workflow] Navigation step — going to: ${url}`);
                await page.goto(url);
                await page.waitForLoadState('networkidle');

                // ── Auth wall detection ──
                const authWall = await detectAuthWall(page);
                if (authWall) {
                    console.log(`[Workflow] Auth wall detected at ${page.url()}`);
                    await logToChat(`🔐 Auth wall detected — pausing for login.`);

                    // Get the connectUrl for this live session
                    const connectUrl = (stagehand as any)._browserbase?.connectUrl ??
                        `https://www.browserbase.com/sessions/${bbSessionId}`;

                    const expiresAt = new Date(Date.now() + AUTH_TIMEOUT_MS).toISOString();

                    const { data: execution } = await supabase
                        .from('workflow_executions')
                        .insert({
                            workflow_id: workflowId,
                            user_id: userId,
                            browserbase_session_id: bbSessionId,
                            chat_session_id: sessionId,
                            paused_at_step: absoluteStepIndex,
                            variables,
                            status: 'paused',
                            context_id: contextId ?? null,
                            connect_url: connectUrl,
                            expires_at: expiresAt,
                        })
                        .select('id')
                        .single();

                    // Send structured AUTH_REQUIRED message to chat
                    await supabase.from('chat_messages').insert({
                        session_id: sessionId,
                        role: 'assistant',
                        content: JSON.stringify({
                            type: 'AUTH_REQUIRED',
                            service: new URL(page.url()).hostname,
                            connectUrl,
                            executionId: execution?.id,
                            expiresAt,
                        }),
                    });

                    // Schedule session close after timeout
                    authTimeoutHandle = setTimeout(async () => {
                        console.log(`[Workflow] Auth timeout — closing session ${bbSessionId}`);
                        if (stagehand) {
                            await stagehand.close().catch(() => { });
                            stagehand = null;
                        }
                        if (execution?.id) {
                            const supabaseInner = await createClient();
                            await supabaseInner.from('workflow_executions')
                                .update({ status: 'expired' })
                                .eq('id', execution.id);

                            await supabaseInner.from('chat_messages').insert({
                                session_id: sessionId,
                                role: 'assistant',
                                content: '⏰ Login window expired. Please run the workflow again to retry.',
                            });
                        }
                    }, AUTH_TIMEOUT_MS);

                    // Return without closing — session stays alive for login
                    return { success: false, paused: true, reason: 'AUTH_REQUIRED', executionId: execution?.id };
                }

                await logToChat(`✅ Navigated to ${url}`);
                continue;
            }

            // C. Extraction step
            if (/^(extract|get|find|read|capture)\b/i.test(instruction)) {
                await logToChat(`🔍 Extracting: ${instruction}`);
                try {
                    console.log(`[Workflow] stagehand.extract for step ${absoluteStepIndex + 1}`);
                    const result = await stagehand.extract(instruction);
                    console.log(`[Workflow] Extraction result:`, result);
                    await logToChat(`✅ Extracted:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``);
                    continue;
                } catch (extractError: any) {
                    console.error(`[Workflow] Extraction failed for step ${absoluteStepIndex + 1}:`, extractError);
                    throw new Error(`Extraction failed: ${extractError.message || extractError}`);
                }
            }

            // D. Standard DOM interaction
            try {
                console.log(`[Workflow] stagehand.act for step ${absoluteStepIndex + 1}: ${instruction}`);
                const result = await stagehand.act(instruction);
                console.log(`[Workflow] stagehand.act result:`, result);
                await logToChat(`✅ Step done: ${result.actionDescription || 'Action completed'}`);

                // Cache selector for future runs
                if ((result as any).actions?.[0]?.selector) {
                    const selector = (result as any).actions[0].selector;
                    console.log(`[Workflow] Caching selector: ${selector}`);
                    await supabase
                        .from('workflow_steps')
                        .update({ cached_selector: selector })
                        .eq('id', step.id);
                }
            } catch (actError: any) {
                console.error(`[Workflow] AI execution failed for step ${absoluteStepIndex + 1}:`, actError);
                throw new Error(`Step failed: ${actError.message || actError}`);
            }
        }

        await logToChat("✨ Workflow completed successfully.");
        if (authTimeoutHandle) clearTimeout(authTimeoutHandle);
        await stagehand.close();
        return { success: true };

    } catch (error: any) {
        console.error('Workflow Execution Failed:', error);

        const supabase = await createClient();
        await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: `❌ Workflow failed: ${error.message}`
        });

        if (authTimeoutHandle) clearTimeout(authTimeoutHandle);
        if (stagehand) await stagehand.close().catch(() => { });
        return { success: false, error: error.message };
    }
}
