import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, site, description, steps } = await req.json();

        if (!name || !site || !steps || !Array.isArray(steps)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify ownership and update the Workflow
        // (Assuming if it exists and fetchable by user via RLS or workspace access, we can update)
        const { data: workflow, error: workflowError } = await supabase
            .from('workflows')
            .update({
                name,
                description,
                site,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (workflowError || !workflow) {
            throw workflowError || new Error('Workflow not found or un-editable');
        }

        // 2. Clear old steps
        const { error: deleteError } = await supabase
            .from('workflow_steps')
            .delete()
            .eq('workflow_id', workflow.id);

        if (deleteError) throw deleteError;

        // 3. Insert new steps
        const stepsData = steps.map((step: any, index: number) => ({
            workflow_id: workflow.id,
            order_index: index,
            instruction: step.instruction
        }));

        const { error: stepsError } = await supabase
            .from('workflow_steps')
            .insert(stepsData);

        if (stepsError) throw stepsError;

        // 4. Fetch the final workflow object with steps to return
        const { data: finalWorkflow, error: fetchError } = await supabase
            .from('workflows')
            .select(`
                *,
                workflow_steps (*)
            `)
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        return NextResponse.json({ success: true, workflow: finalWorkflow });
    } catch (error: any) {
        console.error('Error updating workflow:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update workflow' },
            { status: 500 }
        );
    }
}
