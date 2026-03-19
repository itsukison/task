'use client';

import React, { useMemo } from 'react';
import { Task, OwnerProfile } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

interface TasksReportTableProps {
    tasks: Task[];
    loading?: boolean;
    onTaskClick?: (taskId: string) => void;
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

// Format minutes to hours display (e.g., "2.5h" or "45m")
function formatTime(minutes: number): string {
    if (minutes === 0) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
}

// Owner avatars display component
function OwnerAvatars({ owners }: { owners: OwnerProfile[] }) {
    const MAX_VISIBLE = 3;
    const visibleOwners = owners.slice(0, MAX_VISIBLE);
    const extraCount = owners.length - MAX_VISIBLE;

    if (owners.length === 0) {
        return <span className="text-[#9B9A97] text-sm">—</span>;
    }

    return (
        <div className="flex items-center -space-x-2">
            {visibleOwners.map((owner) => (
                <div
                    key={owner.id}
                    className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-medium border-2 border-white"
                    title={owner.display_name}
                >
                    {getInitials(owner.display_name)}
                </div>
            ))}
            {extraCount > 0 && (
                <div className="w-7 h-7 rounded-full bg-[#E9E9E7] text-[#37352F] flex items-center justify-center text-[10px] font-medium border-2 border-white">
                    +{extraCount}
                </div>
            )}
        </div>
    );
}

export function TasksReportTable({
    tasks,
    loading = false,
    onTaskClick,
}: TasksReportTableProps) {
    const { t } = useLanguage();

    // Sort tasks: not-completed first, completed last; secondary sort by owner count (descending)
    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
            const aCompleted = a.status === 'completed' ? 1 : 0;
            const bCompleted = b.status === 'completed' ? 1 : 0;
            if (aCompleted !== bCompleted) return aCompleted - bCompleted;
            return b.owners.length - a.owners.length;
        });
    }, [tasks]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-sm text-[#787774]">{t('common.loading_tasks')}</div>
            </div>
        );
    }

    if (sortedTasks.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="text-4xl mb-2">📋</div>
                    <h3 className="text-lg font-medium text-[#37352F] mb-1">{t('kanban.no_tasks')}</h3>
                    <p className="text-sm text-[#787774]">
                        {t('common.no_tasks_description')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-[#E9E9E7] overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-[#F7F7F5] border-b border-[#E9E9E7] text-xs text-[#787774] font-medium">
                    <tr>
                        <th className="px-6 py-3">{t('headers.task')}</th>
                        <th className="px-6 py-3 text-center">{t('headers.status')}</th>
                        <th className="px-6 py-3">{t('headers.owners')}</th>
                        <th className="px-6 py-3 text-right">{t('headers.est_time')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E9E7]">
                    {sortedTasks.map((task) => {
                        const isCompleted = task.status === 'completed';

                        return (
                            <tr
                                key={task.id}
                                onClick={() => onTaskClick?.(task.id)}
                                className={`hover:bg-[#F7F7F5] transition-colors ${onTaskClick ? 'cursor-pointer' : ''
                                    }`}
                            >
                                <td className="px-6 py-4">
                                    <div className="font-medium text-[#37352F] truncate max-w-[300px]">
                                        {task.title}
                                    </div>
                                    {task.scheduledDate && (
                                        <div className="text-xs text-[#9B9A97] mt-0.5">
                                            {task.scheduledDate}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isCompleted ? 'bg-[#edf3ec] text-[#448361]' : 'bg-[#f1f1ef] text-[#787774]'}`}
                                    >
                                        {isCompleted ? t('tasks.status.completed') : t('tasks.status.not_completed')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <OwnerAvatars owners={task.owners} />
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-sm text-[#37352F]">
                                    {task.expectedTime > 0 ? formatTime(task.expectedTime) : '—'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
