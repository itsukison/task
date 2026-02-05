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
        const { message, context, history } = body;

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

        // Run AI orchestrator
        const result = await runOrchestrator(message, context, history);

        const response: ChatResponse = {
            message: result.response,
            pendingAction: result.pendingAction,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('AI Chat API error:', error);
        return NextResponse.json(
            { error: 'AI service unavailable' } as ChatResponse,
            { status: 500 }
        );
    }
}
