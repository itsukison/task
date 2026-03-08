import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Calendar, ArrowRight } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { useLanguage, dateLocales } from '@/lib/i18n';

interface CalendarQuickAddPopoverProps {
    initialDate: Date;
    initialTime?: number; // duration in minutes
    onClose: () => void;
    onCreate: (data: { title: string; scheduledDate: Date; expectedTime: number }) => void;
    position: { x: number; y: number };
}

export const CalendarQuickAddPopover = ({
    initialDate,
    initialTime = 30,
    onClose,
    onCreate,
    position
}: CalendarQuickAddPopoverProps) => {
    const { t, language } = useLanguage();
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(initialTime);
    const inputRef = useRef<HTMLInputElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setDuration(initialTime);
    }, [initialTime]);

    useEffect(() => {
        // Focus input on mount
        if (inputRef.current) {
            inputRef.current.focus();
        }

        // Handle clicks outside
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            // Ignore clicks on the popover itself or the quick-add preview block
            if (popoverRef.current?.contains(target as Node) || target.closest('.quick-add-target')) {
                return;
            }
            onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!title.trim()) return;

        onCreate({
            title: title.trim(),
            scheduledDate: initialDate,
            expectedTime: duration
        });
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    // Adjust position to keep within viewport
    // For simplicity, we just use fixed positioning based on click unique to this layout
    // In a robust implementation, we'd use a positioning library or boundary checks
    const style = {
        top: `${position.y}px`,
        left: `${position.x}px`,
    };

    const endTime = addMinutes(initialDate, duration);

    // Use Portal to render outside the calendar container (works around overflow-hidden and z-index issues)
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    // Use createPortal from react-dom
    const { createPortal } = require('react-dom');

    return createPortal(
        <div
            ref={popoverRef}
            style={style}
            className="fixed z-[100] w-[320px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
            <div className="p-3 flex flex-col gap-3">
                {/* Title Input */}
                <div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('tasks.title')}
                        className="w-full bg-transparent text-[#37352F] placeholder-gray-400 outline-none text-base font-medium"
                    />
                </div>

                {/* Time Info */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={12} className="text-gray-400" />
                    <span>{format(initialDate, language === 'ja' ? 'PPP' : 'yyyy/MM/dd', { locale: dateLocales[language] })}</span>
                    <span className="text-gray-300">|</span>
                    <Clock size={12} className="text-gray-400" />
                    <span>{format(initialDate, 'HH:mm', { locale: dateLocales[language] })} - {format(endTime, 'HH:mm', { locale: dateLocales[language] })}</span>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!title.trim()}
                        className="text-xs bg-accent text-white font-medium px-3 py-1.5 rounded flex items-center gap-1 hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add <ArrowRight size={12} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
