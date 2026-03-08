import { NextRequest, NextResponse } from 'next/server';
import { runOrchestrator } from '@/lib/ai/agents/orchestrator';
import { ChatRequest, ChatResponse } from '@/lib/ai/types';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // Check if AI service is configured
        if (!process.env.MOONSHOT_API_KEY) {
            return NextResponse.json(
                { error: 'AI service is not configured. Please contact support.' } as ChatResponse,
                { status: 503 }
            );
        }

        const body: ChatRequest = await request.json();
        const { message, context, history, documentCache, sessionId } = body;

        // Verify auth
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' } as ChatResponse,
                { status: 401 }
            );
        }

        // Verify organization access
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('organization_id', context.organizationId)
            .single();

        if (!membership) {
            return NextResponse.json(
                { error: 'Access denied' } as ChatResponse,
                { status: 403 }
            );
        }

        // ── @mention text-scan fallback ──────────────────────────────────────
        // If the client didn't pass a structured mentionedWorkflow (e.g. user
        // typed "@WorkflowName" without clicking the popup), scan the message
        // text for @words and resolve the workflow from the DB.
        let resolvedWorkflow = context.mentionedWorkflow;

        if (!resolvedWorkflow) {
            // Match @Word or @Multi Word patterns (up to 6 words)
            const atMatches = message.match(/@([\w][\w\s]{0,60}?)(?=[,\n]|$|\s{2}|\.)/g);
            if (atMatches && atMatches.length > 0) {
                const workflowName = atMatches[0].substring(1).trim(); // strip the @

                const { data: foundWorkflow } = await supabase
                    .from('workflows')
                    .select('id, name')
                    .eq('organization_id', context.organizationId)
                    .ilike('name', `%${workflowName}%`)
                    .limit(1)
                    .single();

                if (foundWorkflow) {
                    resolvedWorkflow = { id: foundWorkflow.id, name: foundWorkflow.name };
                }
            }
        }

        // Fetch user language preference
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('language')
            .eq('id', user.id)
            .single();

        // Build final context
        const contextWithLanguage = {
            ...context,
            language: (profile?.language as 'en' | 'ja') || 'en',
            mentionedWorkflow: resolvedWorkflow,
        };

        // Run AI orchestrator
        const result = await runOrchestrator(message, contextWithLanguage, history, documentCache, sessionId);

        const response: ChatResponse = {
            message: result.response,
            pendingAction: result.pendingAction,
            updatedCache: result.updatedCache,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('❌ [/api/ai/chat] Error:', error);
        return NextResponse.json(
            { error: 'AI service unavailable' } as ChatResponse,
            { status: 500 }
        );
    }
}
