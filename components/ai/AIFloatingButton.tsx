'use client';

import Image from 'next/image';

import { Sparkles } from 'lucide-react';
import { useAI } from '@/lib/ai/AIContextProvider';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function AIFloatingButton() {
    const { setIsOpen, currentPage, selectedDocuments } = useAI();

    // Determine if AI should be active based on page and context
    const { isActive, tooltipMessage } = getAIStatus(currentPage, selectedDocuments.length);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => isActive && setIsOpen(true)}
                        disabled={!isActive}
                        className={`fixed bottom-6 right-6 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ease-in-out border z-40
                            ${isActive
                                ? 'h-12 w-12 bg-white border-[#E9E9E7] text-[#FF5500] hover:scale-110 hover:shadow-xl cursor-pointer'
                                : 'h-12 w-12 bg-[#F7F7F5] border-[#E9E9E7] text-[#9B9A97] opacity-60 cursor-not-allowed'
                            }
                        `}
                    >
                        <div className="relative h-6 w-6">
                            <Image
                                src="/logo.png"
                                alt="AI"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>{tooltipMessage}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function getAIStatus(
    page: 'documents' | 'workspace' | 'progress' | 'settings',
    selectedDocsCount: number
): { isActive: boolean; tooltipMessage: string } {
    if (page === 'documents') {
        if (selectedDocsCount === 0) {
            return {
                isActive: false,
                tooltipMessage: 'Select 1-5 documents to ask questions',
            };
        }
        if (selectedDocsCount > 5) {
            return {
                isActive: false,
                tooltipMessage: 'Too many documents selected (max 5)',
            };
        }
        return {
            isActive: true,
            tooltipMessage: 'Ask AI about selected documents',
        };
    }

    if (page === 'workspace') {
        return {
            isActive: true,
            tooltipMessage: 'Ask AI to help with tasks and calendar',
        };
    }

    // Progress and settings are muted
    return {
        isActive: false,
        tooltipMessage: 'AI not available on this page',
    };
}
