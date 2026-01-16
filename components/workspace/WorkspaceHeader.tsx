'use client';

import React from 'react';
import { Search, Filter, List, ArrowUpDown, ArrowUp, ArrowDown, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '../ui/primitives';
import { TaskStatus } from '@/lib/types';
import { SortConfig } from '../editable-table';

const SORT_FIELDS = [
    { id: 'title', label: 'Task Name' },
    { id: 'status', label: 'Status' },
    { id: 'expectedTime', label: 'Est. Time' },
    { id: 'owner', label: 'Owner' },
];

interface WorkspaceHeaderProps {
    viewDate: Date;
    selectedDate: Date;
    calendarView: 'week' | 'day';
    searchQuery: string;
    filterStatus: TaskStatus | 'ALL';
    sortConfig: SortConfig | null;
    showSortMenu: boolean;
    hiddenColumns: string[];
    onSearchChange: (query: string) => void;
    onFilterChange: (status: TaskStatus | 'ALL') => void;
    onSortMenuToggle: () => void;
    onSortChange: (sort: SortConfig | null) => void;
    onToggleSortDirection: () => void;
    onClearSort: () => void;
    onClearHiddenColumns: () => void;
    onCalendarViewChange: (view: 'week' | 'day') => void;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    onAddTask: () => void;
}

export function WorkspaceHeader({
    viewDate,
    selectedDate,
    calendarView,
    searchQuery,
    filterStatus,
    sortConfig,
    showSortMenu,
    hiddenColumns,
    onSearchChange,
    onFilterChange,
    onSortMenuToggle,
    onSortChange,
    onToggleSortDirection,
    onClearSort,
    onClearHiddenColumns,
    onCalendarViewChange,
    onPrev,
    onNext,
    onToday,
    onAddTask,
}: WorkspaceHeaderProps) {
    return (
        <div className="pt-12 px-8 pb-4 flex-shrink-0 ml-2">
            <div className="flex items-start gap-3 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#37352F] mb-1 tracking-tight">Workspace</h1>
                    <p className="text-[#787774] text-sm">
                        Task list and calendar overview for <span className="font-semibold text-accent">{format(viewDate, 'MMMM yyyy')}</span>.
                    </p>
                </div>
            </div>

            {/* Unified Toolbar */}
            <div className="flex items-center justify-between border-b border-[#E9E9E7] pb-2">

                {/* Left: List Controls */}
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EFEFED] rounded text-sm font-medium text-[#37352F]">
                        <List size={16} />
                        {format(selectedDate, 'MMM d')} List
                    </div>
                    <div className="h-4 w-px bg-gray-200 mx-2"></div>

                    {/* Search */}
                    <div className="relative group">
                        <button className="p-1 hover:bg-[#EFEFED] rounded text-[#787774] transition-colors"><Search size={16} /></button>
                        <div className="absolute top-0 left-8 hidden group-hover:block hover:block z-20">
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Search tasks..."
                                className="w-48 bg-white"
                            />
                        </div>
                    </div>

                    {/* Filter */}
                    <button
                        onClick={() => onFilterChange(filterStatus === 'ALL' ? 'in_progress' : 'ALL')}
                        className={`p-1 hover:bg-[#EFEFED] rounded transition-colors ${filterStatus !== 'ALL' ? 'text-accent bg-orange-50' : 'text-[#787774]'}`}
                        title="Filter by Status"
                    >
                        <Filter size={16} />
                    </button>

                    {/* Sort Control */}
                    <div className="relative">
                        <button
                            onClick={onSortMenuToggle}
                            className={`p-1 hover:bg-[#EFEFED] rounded transition-colors flex items-center gap-0.5 ${sortConfig ? 'text-accent bg-orange-50' : 'text-[#787774]'}`}
                            title="Sort"
                        >
                            <ArrowUpDown size={16} />
                        </button>

                        {/* Sort Menu */}
                        {showSortMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={onSortMenuToggle} />
                                <div className="absolute top-full left-0 mt-1 z-50 bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-[180px]">
                                    <div className="px-3 py-1.5 text-xs font-semibold text-[#9e9e9e] uppercase">Sort by</div>
                                    {SORT_FIELDS.map(field => (
                                        <button
                                            key={field.id}
                                            className={`w-full px-3 py-1.5 flex items-center gap-2 text-sm hover:bg-gray-50 transition-colors ${sortConfig?.columnId === field.id ? 'text-accent bg-orange-50' : 'text-[#37352F]'}`}
                                            onClick={() => onSortChange({ columnId: field.id, direction: 'asc' })}
                                        >
                                            {field.label}
                                            {sortConfig?.columnId === field.id && (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                            )}
                                        </button>
                                    ))}
                                    {sortConfig && (
                                        <>
                                            <div className="border-t border-gray-100 my-1" />
                                            <button
                                                className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                                onClick={onClearSort}
                                            >
                                                <X size={14} />
                                                Clear sort
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Active Sort Indicator */}
                    {sortConfig && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded text-xs text-accent border border-orange-200">
                            <span className="font-medium">
                                {SORT_FIELDS.find(f => f.id === sortConfig.columnId)?.label}
                            </span>
                            <button
                                onClick={onToggleSortDirection}
                                className="hover:bg-orange-100 rounded p-0.5"
                            >
                                {sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            </button>
                            <button
                                onClick={onClearSort}
                                className="hover:bg-orange-100 rounded p-0.5"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {/* Hidden Columns Indicator */}
                    {hiddenColumns.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-[#787774]">
                            <span>{hiddenColumns.length} hidden</span>
                            <button
                                onClick={onClearHiddenColumns}
                                className="hover:bg-gray-200 rounded p-0.5"
                                title="Show all columns"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Calendar Controls & Global Actions */}
                <div className="flex items-center gap-2">
                    <div className="flex bg-[#EFEFED] p-0.5 rounded-md mr-1">
                        <button
                            onClick={() => onCalendarViewChange('week')}
                            className={`px-2 py-0.5 text-xs font-medium rounded-sm transition-all shadow-sm ${calendarView === 'week' ? 'bg-white text-[#37352F]' : 'bg-transparent text-[#787774] hover:text-[#37352F]'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => onCalendarViewChange('day')}
                            className={`px-2 py-0.5 text-xs font-medium rounded-sm transition-all shadow-sm ${calendarView === 'day' ? 'bg-white text-[#37352F]' : 'bg-transparent text-[#787774] hover:text-[#37352F]'}`}
                        >
                            Day
                        </button>
                    </div>

                    <div className="flex items-center bg-white border border-[#E9E9E7] rounded-md shadow-sm">
                        <button onClick={onPrev} className="p-1 hover:bg-[#EFEFED] text-[#787774] border-r border-[#E9E9E7]"><ChevronLeft size={14} /></button>
                        <button onClick={onToday} className="px-2 py-1 text-xs font-medium hover:bg-[#EFEFED] text-[#37352F]">Today</button>
                        <button onClick={onNext} className="p-1 hover:bg-[#EFEFED] text-[#787774] border-l border-[#E9E9E7]"><ChevronRight size={14} /></button>
                    </div>

                    <div className="h-4 w-px bg-gray-200 mx-1"></div>

                    <button
                        onClick={onAddTask}
                        className="flex items-center gap-1 bg-accent hover:bg-accent-dark text-white px-2 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                        <Plus size={14} /> New
                    </button>
                </div>
            </div>
        </div>
    );
}
