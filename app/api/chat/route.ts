import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeWorkflowAgent } from '@/lib/executeWorkflowAgent';
import { extractPlainText } from '@/lib/tiptap';
import { kimiClient, KIMI_MODEL } from '@/lib/ai/kimi-client';

// A system prompt to extract variables based on a workflow definition
const EXTRACT_VARIABLES_PROMPT = `
You are an AI tasked with extracting structured data from a user's natural language command.
The user wants to execute a specific workflow. You will be given the workflow's instructions which contain variable placeholders like {variable_name}.
Your goal is to read the user's command and extract the values for those variables.

Respond strictly with a JSON object containing key-value pairs where the key is the exact variable name (without brackets) and the value is the extracted information.

Example Input Command: "Schedule a meeting with alice@example.com for 3pm tomorrow regarding Q1 Planning"
Example Workflow Instructions: "Go to zoom\\nSet topic to {topic}\\nSet time to {time}\\nInvite {attendees}"
Expected Output: {"topic": "Q1 Planning", "time": "3pm tomorrow", "attendees": "alice@example.com"}
`;

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, workflowId, sessionId: clientSessionId } = await req.json();

        if (!message || !workflowId) {
            return NextResponse.json({ error: 'Message and Workflow ID are required' }, { status: 400 });
        }

        let sessionId = clientSessionId;

        // If no session ID was provided, create one for this chat
        if (!sessionId) {
            const { data: newSession } = await supabase
                .from('chat_sessions')
                .insert({
                    organization_id: user.user_metadata?.current_organization_id || user.id, // Fallback for testing
                    user_id: user.id,
                    title: `Workflow: ${message.substring(0, 30)}...`
                })
                .select('id')
                .single();

            if (newSession) {
                sessionId = newSession.id;
            }
        }

        // Log the user's message
        if (sessionId) {
            await supabase.from('chat_messages').insert({
                session_id: sessionId,
                role: 'user',
                content: message
            });
        }

        // 1. Fetch Workflow to understand what variables to extract
        const { data: workflow } = await supabase
            .from('workflows')
            .select('*')
            .eq('id', workflowId)
            .single();

        if (!workflow) {
            return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        // Prepare instructions description for AI context
        const stepsDesc = extractPlainText(workflow.content);

        // 2. Call Kimi AI cleanly to parse variables out of the raw message
        const response = await kimiClient.chat.completions.create({
            model: KIMI_MODEL,
            messages: [
                { role: 'system', content: EXTRACT_VARIABLES_PROMPT },
                { role: 'user', content: `Workflow Steps:\n${stepsDesc}\n\nUser Command: ${message}` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0,
        });

        const output = response.choices[0].message.content;
        let variables = {};
        if (output) {
            variables = JSON.parse(output);
        }

        console.log('[API Chat] Extracted Variables:', variables);

        // 3. Trigger the workflow agent asynchronously (don't await — keep response snappy)
        if (sessionId) {
            executeWorkflowAgent(workflowId, variables, user.id, sessionId).catch(err => {
                console.error('Async workflow execution failed:', err);
            });
        } else {
            console.error('Skipping workflow execution due to missing session ID');
        }

        // 4. Return quick response to UI
        return NextResponse.json({
            success: true,
            message: `Executing ${workflow.name}...`,
            variables,
            sessionId // Return the session ID so the client can subscribe
        });

    } catch (error: any) {
        console.error('API Chat Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process chat command' },
            { status: 500 }
        );
    }
}
