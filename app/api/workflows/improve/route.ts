import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { kimiClient, KIMI_MODEL } from '@/lib/ai/kimi-client';

const IMPROVE_PROMPT = `
You are an expert browser automation engineer. 
A user attempted to execute a workflow step with an AI agent (like Stagehand), but it failed or struggled.
The user will provide the Original Instruction and their Feedback on what went wrong or how to fix it.

Your job is to rewrite the instruction to be clearer, more robust, or more specific for the AI agent to execute.
Reply strictly with a JSON object containing a single key "improved_instruction" mapping to the new instruction string.
`;

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { stepId, feedback } = await req.json();

        if (!stepId || !feedback) {
            return NextResponse.json({ error: 'Step ID and feedback are required' }, { status: 400 });
        }

        // Fetch the original step
        const { data: step, error: stepError } = await supabase
            .from('workflow_steps')
            .select('*')
            .eq('id', stepId)
            .single();

        if (stepError || !step) {
            return NextResponse.json({ error: 'Workflow step not found' }, { status: 404 });
        }

        const response = await kimiClient.chat.completions.create({
            model: KIMI_MODEL,
            messages: [
                { role: 'system', content: IMPROVE_PROMPT },
                {
                    role: 'user',
                    content: `Original Instruction: "${step.instruction}"\nFeedback: "${feedback}"`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2, // Keep it deterministic but allow slightly creative fixes
        });

        const output = response.choices[0].message.content;
        if (!output) {
            throw new Error("Failed to generate improved instruction");
        }

        const { improved_instruction } = JSON.parse(output);

        // Update step with new instruction and clear the broken cached selector
        const { error: updateError } = await supabase
            .from('workflow_steps')
            .update({
                instruction: improved_instruction,
                cached_selector: null // Wipe the bad cache payload
            })
            .eq('id', stepId);

        if (updateError) {
            throw new Error("Failed to update step in database");
        }

        return NextResponse.json({
            success: true,
            improved_instruction
        });

    } catch (error: any) {
        console.error('Workflow Improve API Error:', error);
        return NextResponse.json(
            { error: 'Failed to improve workflow step' },
            { status: 500 }
        );
    }
}
