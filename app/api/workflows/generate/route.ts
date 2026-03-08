import { NextResponse } from 'next/server';
import { kimiClient, KIMI_MODEL } from '@/lib/ai/kimi-client';

const SYSTEM_PROMPT = `
You are an expert browser automation planner. 
The user will provide a goal, often containing a URL and a task they want to accomplish.
Your job is to break this goal down into a linear sequence of deterministic browser steps that an AI agent (Stagehand) can execute.

Rules:
1. Each step MUST be a single, clear, atomic action (e.g., "Go to URL", "Click button", "Type text", "Extract info").
2. If the user's goal implies variable data (e.g., scheduling a meeting relies on knowing the date, time, and attendees), insert variables using the exact format: {variable_name}.
   Example: "Type {meeting_topic} into the topic field."
   Example: "Go to {target_url}."
3. You must extract a concise 'name' and 'description' for the workflow.
4. You must extract the base domain or primary 'site' this workflow targets (e.g., 'zoom.us', 'github.com').
5. The very first step SHOULD almost always be navigating to a starting URL (e.g., "Go to https://zoom.us/meeting/schedule").

Respond ONLY with a valid JSON strictly matching the following schema:
{
  "name": "Short Name (e.g., Create Zoom Meeting)",
  "description": "Brief description of what this workflow accomplishes.",
  "site": "base_domain.com",
  "steps": [
    {
      "order": 0,
      "instruction": "The clear English instruction"
    }
  ]
}
`;

export async function POST(req: Request) {
    try {
        const { goal } = await req.json();

        if (!goal) {
            return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
        }

        const response = await kimiClient.chat.completions.create({
            model: KIMI_MODEL, // Or the optimal Kimi model
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Goal: ${goal}` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1, // Keep it deterministic
        });

        const output = response.choices[0].message.content;

        if (!output) {
            throw new Error('No output from AI');
        }

        const plan = JSON.parse(output);

        return NextResponse.json(plan);
    } catch (error: any) {
        console.error('Error generating workflow plan:', error);
        return NextResponse.json(
            { error: 'Failed to generate plan' },
            { status: 500 }
        );
    }
}
