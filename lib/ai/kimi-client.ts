import OpenAI from 'openai';

// Validate environment variable
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;

if (!MOONSHOT_API_KEY) {
    console.warn(
        'MOONSHOT_API_KEY is not set. AI features will be unavailable. ' +
        'Add this to .env.local to enable the AI assistant.'
    );
}

// OpenAI-compatible client for Kimi K2.5
export const kimiClient = new OpenAI({
    apiKey: MOONSHOT_API_KEY || 'dummy-key-for-build',
    baseURL: 'https://api.moonshot.ai/v1',
});

export const KIMI_MODEL = 'moonshot-v1-128k'; // Using 128k context window model
