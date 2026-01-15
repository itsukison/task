'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, User, CheckCircle2, Sparkles, Play, Pause, MoreHorizontal, Calendar, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { Task, TaskStatus, TaskModalProps } from '@/lib/types';

export default function TaskModal({ task, onClose, onUpdate }: TaskModalProps) {
    const [editedTask, setEditedTask] = useState<Task | null>(task);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
        setEditedTask(task);
    }, [task]);

    if (!editedTask) return null;

    const toggleTimer = () => {
        if (isTimerRunning) {
            setIsTimerRunning(false);
            onUpdate(editedTask);
        } else {
            setIsTimerRunning(true);
            const newTask = { ...editedTask, status: 'in_progress' as TaskStatus };
            setEditedTask(newTask);
            onUpdate(newTask);
        }
    };

    const handleChange = (field: keyof Task, value: any) => {
        const newTask = { ...editedTask, [field]: value };
        setEditedTask(newTask);
        onUpdate(newTask);
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'planned': return 'bg-gray-100 text-gray-600';
            case 'in_progress': return 'bg-orange-100 text-orange-700';
            case 'overrun': return 'bg-red-100 text-red-700';
            case 'completed': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const statusOptions: TaskStatus[] = ['planned', 'in_progress', 'overrun', 'completed'];

    return (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center backdrop-blur-[2px] transition-all duration-300" onClick={onClose}>
            <div
                className="bg-white w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                onClick={e => e.stopPropagation()}
            >
                {/* Top Actions */}
                <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                        <ArrowUpRight size={18} />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                        <MoreHorizontal size={18} />
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Breadcrumb */}
                <div className="px-12 pt-10 pb-2 text-xs text-[#9B9A97] flex items-center gap-1.5">
                    <span>TaskOS Workspace</span>
                    <span className="text-gray-300">/</span>
                    <span>Task Tracker</span>
                    <span className="text-gray-300">/</span>
                    <span>{editedTask.id.substring(0, 4)}...</span>
                </div>

                <div className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar">

                    {/* Header Icon & Title */}
                    <div className="mt-4 mb-8">
                        <div className="text-6xl mb-6">🎯</div>
                        <input
                            type="text"
                            value={editedTask.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="text-4xl font-bold text-[#37352F] w-full outline-none placeholder-gray-300 bg-transparent"
                            placeholder="Task Title"
                        />
                    </div>

                    {/* Properties Grid */}
                    <div className="flex flex-col gap-3 mb-8 max-w-2xl">

                        {/* Status */}
                        <div className="flex items-center h-8">
                            <div className="w-36 flex items-center gap-2 text-[#787774] text-sm">
                                <CheckCircle2 size={16} /> Status
                            </div>
                            <div className="flex-1">
                                <select
                                    value={editedTask.status}
                                    onChange={(e) => handleChange('status', e.target.value as TaskStatus)}
                                    className={`appearance-none px-2 py-1 rounded text-sm cursor-pointer outline-none border-none hover:bg-opacity-80 transition-colors ${getStatusColor(editedTask.status)}`}
                                >
                                    {statusOptions.map(s => (
                                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Owner */}
                        <div className="flex items-center h-8">
                            <div className="w-36 flex items-center gap-2 text-[#787774] text-sm">
                                <User size={16} /> Owner
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px]">JS</div>
                                <span className="text-sm text-[#37352F]">{editedTask.owner}</span>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center h-8">
                            <div className="w-36 flex items-center gap-2 text-[#787774] text-sm">
                                <Calendar size={16} /> Due Date
                            </div>
                            <div className="flex-1 text-sm text-[#37352F]">
                                <span className="text-gray-300">Empty</span>
                            </div>
                        </div>

                        {/* Timer / Est */}
                        <div className="flex items-center h-8">
                            <div className="w-36 flex items-center gap-2 text-[#787774] text-sm">
                                <Clock size={16} /> Track Time
                            </div>
                            <div className="flex-1 flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#37352F] font-medium">{editedTask.actualTime}m</span>
                                    <span className="text-[#9B9A97]">/</span>
                                    <span className="text-[#787774]">{editedTask.expectedTime}m estimated</span>
                                </div>
                                <button
                                    onClick={toggleTimer}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-colors border ${isTimerRunning
                                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {isTimerRunning ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Start Timer</>}
                                </button>
                            </div>
                        </div>

                    </div>

                    <div className="h-px bg-[#E9E9E7] w-full mb-8"></div>

                    {/* Content Area */}
                    <div className="relative group min-h-[200px]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-[#37352F]">Description</h3>
                            <button
                                onClick={() => { }}
                                disabled={isEnhancing}
                                className="flex items-center gap-1 text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                            >
                                <Sparkles size={14} />
                                {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
                            </button>
                        </div>
                        <textarea
                            value={editedTask.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="w-full h-full min-h-[200px] resize-none outline-none text-[#37352F] leading-relaxed placeholder-gray-300 bg-transparent text-base"
                            placeholder="Press space for AI, or type '/' for commands..."
                        />
                    </div>

                    <div className="mt-12 pt-8 border-t border-[#E9E9E7]">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs mt-1">JS</div>
                            <div className="flex-1">
                                <div className="border border-[#E9E9E7] rounded-md p-3 shadow-sm bg-white">
                                    <input type="text" placeholder="Add a comment..." className="w-full outline-none text-sm placeholder-gray-400" />
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="text-xs text-gray-400">Pro tip: type @ to notify someone</div>
                                        <button className="p-1 rounded hover:bg-orange-50 text-accent"><ArrowUpRight size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
