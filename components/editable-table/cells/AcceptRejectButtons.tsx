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
        <div className="flex items-center gap-1 px-2">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAccept();
                }}
                disabled={disabled}
                className={cn(
                    "p-1.5 rounded transition-colors",
                    "hover:bg-green-100 text-green-600",
                    "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                title="Accept assignment"
            >
                <Check size={16} />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onReject();
                }}
                disabled={disabled}
                className={cn(
                    "p-1.5 rounded transition-colors",
                    "hover:bg-red-100 text-red-600",
                    "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                title="Reject assignment"
            >
                <X size={16} />
            </button>
        </div>
    );
}
