'use client';

import { useAI } from '@/lib/ai/AIContextProvider';

export function NewConversationPrompt() {
    const { shouldShowNewConvoPrompt, startNewConversation, dismissNewConvoPrompt } = useAI();

    if (!shouldShowNewConvoPrompt) return null;

    return (
        <div className="fixed bottom-20 right-4 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
            <h3 className="font-semibold text-sm text-gray-900 mb-2">
                Long conversation detected
            </h3>
            <p className="text-xs text-gray-600 mb-3">
                Your conversation has grown large. Starting a new one can improve AI response quality and speed.
            </p>
            <div className="flex gap-2">
                <button
                    onClick={startNewConversation}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                    Start New
                </button>
                <button
                    onClick={dismissNewConvoPrompt}
                    className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                >
                    Keep Going
                </button>
            </div>
        </div>
    );
}
