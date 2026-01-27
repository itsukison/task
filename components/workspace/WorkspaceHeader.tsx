'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

interface WorkspaceHeaderProps {
    viewDate: Date;
    onAddTask: () => void;
    stats: {
        totalTasks: number;
        tasksLeft: number;
        estimatedHours: number;
        actualHours: number;
    };
}

export function WorkspaceHeader({
    viewDate,
    onAddTask,
    stats,
}: WorkspaceHeaderProps) {
    return (
        <div className="pt-12 px-8 pb-4 flex-shrink-0 ml-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#37352F] mb-1 tracking-tight">Workspace</h1>
                    <p className="text-[#787774] text-sm">
                        For <span className="font-semibold text-accent">{format(viewDate, 'EEEE, MMMM d, yyyy')}</span>
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-[#37352F]">
                        <div className="flex items-center gap-1">
                            <span className="text-[#787774]">Tasks:</span>
                            <span className="font-medium">{stats.totalTasks}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[#787774]">Left:</span>
                            <span className="font-medium">{stats.tasksLeft}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[#787774]">Est:</span>
                            <span className="font-medium">{stats.estimatedHours}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[#787774]">Used:</span>
                            <span className="font-medium">{stats.actualHours}h</span>
                        </div>
                    </div>

                    <div className="h-4 w-px bg-gray-200"></div>

                    {/* Add Task Button */}
                    <button
                        onClick={onAddTask}
                        className="flex items-center gap-1 bg-accent hover:bg-accent-dark text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    >
                        <Plus size={14} /> New Task
                    </button>
                </div>
            </div>
        </div>
    );
}
