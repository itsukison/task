'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AcceptRejectButtonsProps {
    onAccept: () => void;
    onReject: () => void;
    disabled?: boolean;
}

export function AcceptRejectButtons({ onAccept, onReject, disabled }: AcceptRejectButtonsProps) {
    return (
        <div className="flex items-center gap-2 px-2">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAccept();
                }}
                disabled={disabled}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200",
                    "bg-green-50 text-green-700 hover:bg-green-100 border border-green-100/50 hover:border-green-200",
                    "text-xs font-medium",
                    "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                title="Accept assignment"
            >
                <Check size={12} strokeWidth={2.5} />
                <span>Accept</span>
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onReject();
                }}
                disabled={disabled}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200",
                    "bg-red-50 text-red-700 hover:bg-red-100 border border-red-100/50 hover:border-red-200",
                    "text-xs font-medium",
                    "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                title="Decline assignment"
            >
                <X size={12} strokeWidth={2.5} />
                <span>Decline</span>
            </button>
        </div>
    );
}
