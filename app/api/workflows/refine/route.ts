import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { kimiClient, KIMI_MODEL } from '@/lib/ai/kimi-client';

const REFINE_PROMPT = `You are a browser automation expert. The user has written some notes or rough instructions describing what they want to automate in a browser.

Rewrite their input as a clear, well-structured set of browser automation instructions. Format it as a numbered list of steps. Each step should be a single, clear action written in plain English. Use {variable_name} syntax for any dynamic values the user would need to fill in at runtime.

Rules:
- Keep language natural and readable — these are instructions for an AI agent, not code
- Start with navigation to a URL if applicable
- Use {variable_name} for dynamic values (e.g., {email}, {meeting_title}, {date})
- Each step = one atomic action
- Do not add markdown headers or extra formatting — just numbered steps

Respond with a JSON object: { "steps": ["step 1", "step 2", ...] }`;

function tiptapDocFromSteps(steps: string[]): any {
    return {
        type: 'doc',
        content: [
            {
                type: 'orderedList',
                content: steps.map((step) => ({
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: step }],
                        },
                    ],
                })),
            },
        ],
    };
}

function extractPlainText(tiptapContent: any): string {
    if (!tiptapContent || !tiptapContent.content) return '';

    const extractText = (node: any): string => {
        if (node.type === 'text') return node.text || '';
        if (node.content) return node.content.map(extractText).join(' ');
        return '';
    };

    return tiptapContent.content.map(extractText).join('\n').trim();
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workflowId, content } = await req.json();

        if (!workflowId || !content) {
            return NextResponse.json({ error: 'workflowId and content are required' }, { status: 400 });
        }

        const plainText = extractPlainText(content);

        if (!plainText.trim()) {
            return NextResponse.json({ error: 'No content to refine' }, { status: 400 });
        }

        const response = await kimiClient.chat.completions.create({
            model: KIMI_MODEL,
            messages: [
                { role: 'system', content: REFINE_PROMPT },
                { role: 'user', content: plainText },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
        });

        const output = response.choices[0].message.content;
        if (!output) throw new Error('No output from AI');

        const { steps } = JSON.parse(output);
        if (!Array.isArray(steps) || steps.length === 0) {
            throw new Error('Invalid steps output from AI');
        }

        const newContent = tiptapDocFromSteps(steps);

        const { error: updateError } = await supabase
            .from('workflows')
            .update({ content: newContent })
            .eq('id', workflowId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, content: newContent });
    } catch (error: any) {
        console.error('Workflow refine error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to refine workflow' },
            { status: 500 }
        );
    }
}
