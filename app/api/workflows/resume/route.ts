import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeWorkflowAgent } from '@/lib/executeWorkflowAgent';
import Browserbase from '@browserbasehq/sdk';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { executionId } = await req.json();
        if (!executionId) {
            return NextResponse.json({ error: 'executionId is required' }, { status: 400 });
        }

        // Fetch the paused execution
        const { data: execution, error: fetchError } = await supabase
            .from('workflow_executions')
            .select('*')
            .eq('id', executionId)
            .eq('user_id', user.id) // Security: users can only resume their own executions
            .single();

        if (fetchError || !execution) {
            return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
        }

        // Check status
        if (execution.status === 'expired') {
            return NextResponse.json({
                error: 'Auth window expired. Please run the workflow again.',
                code: 'EXPIRED',
            }, { status: 410 });
        }

        if (execution.status !== 'paused') {
            return NextResponse.json({
                error: `Execution is not in a paused state (current: ${execution.status})`,
                code: 'NOT_PAUSED',
            }, { status: 409 });
        }

        // Check expiry
        if (new Date(execution.expires_at) < new Date()) {
            await supabase
                .from('workflow_executions')
                .update({ status: 'expired' })
                .eq('id', executionId);

            return NextResponse.json({
                error: 'Auth window expired. Please run the workflow again.',
                code: 'EXPIRED',
            }, { status: 410 });
        }

        // Close the old Browserbase session before starting a new one.
        // This frees the concurrent session slot AND flushes the context so that
        // cookies the user just entered (during auth) are persisted to the context.
        if (execution.browserbase_session_id) {
            try {
                const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
                await bb.sessions.update(execution.browserbase_session_id, {
                    status: 'REQUEST_RELEASE',
                } as any);
                console.log(`[Resume] Released old session: ${execution.browserbase_session_id}`);
            } catch (e) {
                // Non-fatal — session may have already expired or timed out
                console.warn('[Resume] Could not release old session:', e);
            }
        }

        // Mark as running
        await supabase
            .from('workflow_executions')
            .update({ status: 'running' })
            .eq('id', executionId);

        // Resume execution in background (don't await — respond immediately)
        // Agent restarts from scratch; login cookies now persist via the saved Browserbase context
        (async () => {
            const result = await executeWorkflowAgent(
                execution.workflow_id,
                (execution.variables as Record<string, string>) ?? {},
                user.id,
                execution.chat_session_id,
            );

            const finalStatus = result.success ? 'done' : (result.paused ? 'paused' : 'failed');
            const supabaseInner = await createClient();
            await supabaseInner
                .from('workflow_executions')
                .update({ status: finalStatus })
                .eq('id', executionId);

            // If successful and we have a context, save it for future runs
            if (result.success && execution.context_id) {
                const { data: workflow } = await supabaseInner
                    .from('workflows')
                    .select('site')
                    .eq('id', execution.workflow_id)
                    .single();

                if (workflow?.site) {
                    await supabaseInner
                        .from('user_service_contexts')
                        .upsert({
                            user_id: user.id,
                            service: workflow.site,
                            context_id: execution.context_id,
                        }, { onConflict: 'user_id, service' });
                }
            }
        })();

        return NextResponse.json({ ok: true, message: 'Resuming workflow...' });

    } catch (error: any) {
        console.error('Resume error:', error);
        return NextResponse.json(
            { error: error.message || 'Resume failed' },
            { status: 500 }
        );
    }
}
