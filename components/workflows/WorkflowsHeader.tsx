'use client';

import React, { useState } from 'react';
import { Plus, FilePlus, FolderPlus, LayoutGrid, ArrowDownAZ, Calendar, ChevronDown } from 'lucide-react';
import { WorkflowFolder } from '@/lib/types';
import { ChevronRight } from 'lucide-react';

export type SortOption = 'name' | 'created' | 'modified';

interface WorkflowsHeaderProps {
    folderPath: WorkflowFolder[];
    onNavigate: (folderId: string | null) => void;
    onNewWorkflow: () => void;
    onNewFolder: () => void;
    onOrganize: () => void;
    onSort: (sortBy: SortOption) => void;
}

function WorkflowBreadcrumb({
    folderPath,
    onNavigate,
}: {
    folderPath: WorkflowFolder[];
    onNavigate: (folderId: string | null) => void;
}) {
    return (
        <div className="flex items-center gap-1 text-sm text-[#787774]">
            <button onClick={() => onNavigate(null)} className="hover:text-[#37352F] transition-colors">
                Workflows
            </button>
            {folderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-1">
                    <ChevronRight size={16} className="text-[#9B9A97]" />
                    <button
                        onClick={() => onNavigate(folder.id)}
                        className={`hover:text-[#37352F] transition-colors ${
                            index === folderPath.length - 1 ? 'font-medium text-[#37352F]' : ''
                        }`}
                    >
                        {folder.name}
                    </button>
                </div>
            ))}
        </div>
    );
}

export function WorkflowsHeader({
    folderPath,
    onNavigate,
    onNewWorkflow,
    onNewFolder,
    onOrganize,
    onSort,
}: WorkflowsHeaderProps) {
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showNewMenu, setShowNewMenu] = useState(false);

    return (
        <div className="pt-12 px-8 pb-4 flex-shrink-0 ml-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#37352F] mb-1 tracking-tight">Workflows</h1>
                    <WorkflowBreadcrumb folderPath={folderPath} onNavigate={onNavigate} />
                </div>

                <div className="flex items-center gap-2">
                    {/* Sort dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#787774] bg-white border border-[#E9E9E7] rounded-lg hover:bg-[#F7F7F5] hover:text-[#37352F] transition-colors"
                        >
                            <ArrowDownAZ size={16} />
                            <span>Sort</span>
                            <ChevronDown size={14} />
                        </button>

                        {showSortMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 z-20">
                                    <button
                                        onClick={() => { onOrganize(); setShowSortMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <LayoutGrid size={16} className="text-[#9B9A97]" />
                                        <span>Organize</span>
                                    </button>
                                    <div className="h-px bg-[#E9E9E7] my-1 mx-2" />
                                    <button
                                        onClick={() => { onSort('name'); setShowSortMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <ArrowDownAZ size={16} className="text-[#9B9A97]" />
                                        <span>By name</span>
                                    </button>
                                    <button
                                        onClick={() => { onSort('created'); setShowSortMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <Calendar size={16} className="text-[#9B9A97]" />
                                        <span>Date created</span>
                                    </button>
                                    <button
                                        onClick={() => { onSort('modified'); setShowSortMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <Calendar size={16} className="text-[#9B9A97]" />
                                        <span>Date modified</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* New dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNewMenu(!showNewMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#d76c33] rounded-lg hover:bg-[#c4612c] transition-colors"
                        >
                            <Plus size={16} />
                            <span>New</span>
                            <ChevronDown size={14} className="text-white/80" />
                        </button>

                        {showNewMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowNewMenu(false)} />
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 z-20">
                                    <button
                                        onClick={() => { onNewFolder(); setShowNewMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <FolderPlus size={16} className="text-[#9B9A97]" />
                                        <span>Folder</span>
                                    </button>
                                    <button
                                        onClick={() => { onNewWorkflow(); setShowNewMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <FilePlus size={16} className="text-[#9B9A97]" />
                                        <span>Workflow</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
