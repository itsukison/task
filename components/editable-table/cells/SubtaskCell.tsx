'use client';

import React, { useState } from 'react';
import { Plus, X, ListTodo } from 'lucide-react';
import { CellProps } from '../types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSubtasks, useAvailableSubtasks } from '@/lib/hooks/use-subtasks';

/**
 * SubtaskCell component - displays and manages linked subtasks
 * Click to open dropdown with create/link options
 * Uses orange Notion-style minimalist design
 */
export function SubtaskCell({ value, rowId, onChange, onCreateSubtask }: CellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Use React Query hooks
    const { subtasks, linkSubtask, unlinkSubtask } = useSubtasks(rowId);

    // Pass rowId explicitly for available tasks query
    const { data: availableTasks = [] } = useAvailableSubtasks(rowId, isOpen);

    const handleCreateSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;
        setIsCreating(true);

        // Use the callback to create task through main table flow
        if (onCreateSubtask) {
            onCreateSubtask(rowId, newSubtaskTitle.trim());
            setNewSubtaskTitle('');
            setIsOpen(false);
        }

        setIsCreating(false);
    };

    const handleLinkTask = async (taskId: string) => {
        linkSubtask.mutate(taskId);
    };

    const handleUnlinkTask = async (taskId: string) => {
        unlinkSubtask.mutate(taskId);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1.5 h-full w-full cursor-pointer hover:bg-[#EFEFED] transition-colors duration-200 min-h-[32px]">
                    {subtasks.length === 0 ? (
                        <span className="text-xs text-[#9B9A97]"></span>
                    ) : (
                        <div className="flex items-center gap-1 flex-wrap">
                            {subtasks.map((sub) => (
                                <span
                                    key={sub.id}
                                    className="px-2 py-0.5 text-xs bg-orange-50 text-[#37352F] rounded hover:bg-orange-100 cursor-pointer transition-colors duration-200 flex items-center gap-1 border border-orange-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {sub.title}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnlinkTask(sub.id);
                                        }}
                                        className="hover:text-[#FF5500] transition-colors"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="p-0 w-64 border-[#E9E9E7]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Create new subtask section */}
                <div className="p-3 border-b border-[#E9E9E7]">
                    <div className="flex items-center gap-2 mb-2">
                        <ListTodo size={14} className="text-[#FF5500]" />
                        <span className="text-xs font-medium text-[#37352F]">New subtask</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            placeholder="Subtask name..."
                            className="flex-1 px-2 py-1.5 text-sm border border-[#E9E9E7] rounded focus:outline-none focus:border-[#FF5500] transition-colors"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateSubtask();
                            }}
                        />
                        <button
                            onClick={handleCreateSubtask}
                            disabled={isCreating || !newSubtaskTitle.trim()}
                            className="p-1.5 bg-[#FF5500] text-white rounded hover:bg-[#FF7F3D] disabled:opacity-50 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                {/* Link existing task section */}
                {availableTasks.length > 0 && (
                    <div className="p-3">
                        <div className="text-xs text-[#9B9A97] mb-2">Link existing task</div>
                        <div className="max-h-40 overflow-y-auto space-y-0.5">
                            {availableTasks.map((task) => (
                                <button
                                    key={task.id}
                                    onClick={() => handleLinkTask(task.id)}
                                    className="w-full text-left px-2 py-1.5 text-sm text-[#5F5E5B] hover:bg-[#EFEFED] hover:text-[#37352F] rounded transition-colors duration-200 truncate"
                                >
                                    {task.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
