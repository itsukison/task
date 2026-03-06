import { NextResponse } from 'next/server';
import Browserbase from '@browserbasehq/sdk';
import { createClient } from '@/lib/supabase/server';

const bb = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY,
});

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { service } = await req.json();

        if (!service) {
            return NextResponse.json({ error: 'Service domain required' }, { status: 400 });
        }

        // 1. Check if user already has a context for this service
        const { data: existingContext, error: dbQueryError } = await supabase
            .from('user_service_contexts')
            .select('context_id')
            .eq('user_id', user.id)
            .eq('service', service)
            .single();

        let contextId = existingContext?.context_id;

        // 2. If no context exists, create one in Browserbase and save it to DB
        if (!contextId) {
            const context = await bb.contexts.create({
                projectId: process.env.BROWSERBASE_PROJECT_ID!,
            });
            contextId = context.id;

            const { error: insertError } = await supabase
                .from('user_service_contexts')
                .insert({
                    user_id: user.id,
                    service: service,
                    context_id: contextId
                });

            if (insertError) {
                throw new Error('Failed to save context to database');
            }
        }

        // 3. Create a live session using this robust persistent context
        const session = await bb.sessions.create({
            projectId: process.env.BROWSERBASE_PROJECT_ID!,
            browserSettings: {
                context: { id: contextId, persist: true },
            },
        });

        // 4. Return the connectUrl for the frontend iframe
        return NextResponse.json({
            connectUrl: session.connectUrl,
            sessionId: session.id
        });

    } catch (error: any) {
        console.error('Browserbase connection error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to initialize connection' },
            { status: 500 }
        );
    }
}
