import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, site, description, workspaceId, steps } = await req.json();

        if (!name || !site || !workspaceId || !steps || !Array.isArray(steps)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Insert the Workflow
        const { data: workflow, error: workflowError } = await supabase
            .from('workflows')
            .insert({
                workspace_id: workspaceId,
                name,
                description,
                site
            })
            .select()
            .single();

        if (workflowError) throw workflowError;

        // 2. Insert the Steps
        const stepsData = steps.map((step: any, index: number) => ({
            workflow_id: workflow.id,
            order_index: index,
            instruction: step.instruction
        }));

        const { error: stepsError } = await supabase
            .from('workflow_steps')
            .insert(stepsData);

        if (stepsError) throw stepsError;

        return NextResponse.json({ success: true, workflow });
    } catch (error: any) {
        console.error('Error saving workflow:', error);
        return NextResponse.json(
            { error: 'Failed to save workflow' },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get('workspaceId');

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!workspaceId) {
            return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
        }

        const { data: workflows, error: fetchError } = await supabase
            .from('workflows')
            .select(`
        *,
        workflow_steps (*)
      `)
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        return NextResponse.json(workflows);
    } catch (error: any) {
        console.error('Error fetching workflows:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workflows' },
            { status: 500 }
        );
    }
}
