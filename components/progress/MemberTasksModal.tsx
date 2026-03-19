'use client';

import React from 'react';
import { X, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Task, TaskStatus, PeopleOption } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';
import { dateLocales } from '@/lib/i18n/date';

interface MemberTasksModalProps {
    member: PeopleOption;
    tasks: Task[];
    selectedDate: Date;
    onClose: () => void;
}

// Get initials from display name
function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

// Format minutes to hours display
function formatTime(minutes: number): string {
    if (minutes === 0) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
}

// Get status badge color
function getStatusColor(status: TaskStatus): string {
    switch (status) {
        case 'planned': return 'bg-gray-100 text-gray-600';
        case 'in_progress': return 'bg-orange-100 text-orange-700';
        case 'overrun': return 'bg-red-100 text-red-700';
        case 'completed': return 'bg-green-100 text-green-700';
        default: return 'bg-gray-100 text-gray-600';
    }
}

// Format status label
function formatStatus(status: TaskStatus): string {
    switch (status) {
        case 'planned': return 'Planned';
        case 'in_progress': return 'In Progress';
        case 'overrun': return 'Overrun';
        case 'completed': return 'Completed';
        default: return status;
    }
}

export function MemberTasksModal({
    member,
    tasks,
    selectedDate,
    onClose,
}: MemberTasksModalProps) {
    const { t, language } = useLanguage();

    // Calculate totals
    const totalEstimated = tasks.reduce((sum, t) => sum + t.expectedTime, 0);
    const completedCount = tasks.filter(t => t.status === 'completed').length;

    // Localized date format
    const dateFormat = language === 'ja' ? 'M月d日 EEEE' : 'EEEE, MMMM d';
    const formattedDate = format(selectedDate, dateFormat, { locale: dateLocales[language] });

    return (
        <div
            className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center backdrop-blur-[2px] transition-all duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-2xl max-h-[80vh] rounded-xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors z-10"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-[#E9E9E7]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center text-lg font-medium">
                            {getInitials(member.displayName)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#37352F]">{member.displayName}</h2>
                            <p className="text-sm text-[#787774]">
                                {t('member_tasks.tasks_for_date', { date: formattedDate })}
                            </p>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-[#787774]" />
                            <span className="text-[#787774]">{t('member_tasks.completed_label')}</span>
                            <span className="font-medium text-[#37352F]">{completedCount}/{tasks.length}</span>
                        </div>
                        <div className="h-3 w-px bg-[#E9E9E7]" />
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-[#787774]" />
                            <span className="text-[#787774]">{t('member_tasks.est_label')}</span>
                            <span className="font-medium text-[#37352F]">{formatTime(totalEstimated)}</span>
                        </div>
                        <div className="h-3 w-px bg-[#E9E9E7]" />
                    </div>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {tasks.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-[#787774] text-sm">{t('member_tasks.no_tasks')}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#E9E9E7]">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="px-6 py-4 hover:bg-[#F7F7F5] transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-[#37352F] truncate">
                                                {task.title}
                                            </h3>
                                            {task.description && (
                                                <p className="text-sm text-[#787774] mt-0.5 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {/* Status Badge */}
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                                {t(`member_tasks.status_${task.status}`)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Time Info */}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-[#9B9A97]">
                                        <div className="flex items-center gap-1">
                                            <span>{t('member_tasks.est_label')}</span>
                                            <span className="font-medium text-[#787774]">{formatTime(task.expectedTime)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
