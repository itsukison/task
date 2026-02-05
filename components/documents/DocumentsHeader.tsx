'use client';

import React, { useState } from 'react';
import { Plus, FilePlus, FolderPlus, Upload, Link as LinkIcon, LayoutGrid, ArrowDownAZ, Calendar, ChevronDown } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { Folder } from '@/lib/types';

export type SortOption = 'name' | 'created' | 'modified';

interface DocumentsHeaderProps {
    folderPath: Folder[];
    onNavigate: (folderId: string | null) => void;
    onNewDocument: () => void;
    onNewFolder: () => void;
    onUploadFile: () => void;
    onAddLink: () => void;
    onOrganize: () => void;
    onSort: (sortBy: SortOption) => void;
}

export function DocumentsHeader({
    folderPath,
    onNavigate,
    onNewDocument,
    onNewFolder,
    onUploadFile,
    onAddLink,
    onOrganize,
    onSort,
}: DocumentsHeaderProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    return (
        <div className="pt-12 px-8 pb-4 flex-shrink-0 ml-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#37352F] mb-1 tracking-tight">Documents</h1>
                    <Breadcrumb folderPath={folderPath} onNavigate={onNavigate} />
                </div>

                <div className="flex items-center gap-2">
                    {/* Organize button */}
                    <button
                        onClick={onOrganize}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#787774] bg-white border border-[#E9E9E7] rounded-lg hover:bg-[#F7F7F5] hover:text-[#37352F] transition-colors"
                        title="Organize items in a grid"
                    >
                        <LayoutGrid size={16} />
                        <span>Organize</span>
                    </button>

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
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowSortMenu(false)}
                                />
                                <div className="absolute top-full right-0 mt-2 w-44 bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 z-20">
                                    <button
                                        onClick={() => {
                                            onSort('name');
                                            setShowSortMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <ArrowDownAZ size={16} className="text-[#9B9A97]" />
                                        <span>Name (A → Z)</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onSort('created');
                                            setShowSortMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <Calendar size={16} className="text-[#9B9A97]" />
                                        <span>Date Created</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onSort('modified');
                                            setShowSortMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <Calendar size={16} className="text-[#9B9A97]" />
                                        <span>Date Modified</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Quick actions */}
                    <button
                        onClick={onNewDocument}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#37352F] bg-white border border-[#E9E9E7] rounded-lg hover:bg-[#F7F7F5] transition-colors"
                    >
                        <FilePlus size={16} />
                        <span>New Document</span>
                    </button>

                    <button
                        onClick={onNewFolder}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#37352F] bg-white border border-[#E9E9E7] rounded-lg hover:bg-[#F7F7F5] transition-colors"
                    >
                        <FolderPlus size={16} />
                        <span>New Folder</span>
                    </button>

                    {/* More actions dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#FF5500] rounded-lg hover:bg-[#FF7F3D] transition-colors"
                        >
                            <Plus size={16} />
                            <span>Add</span>
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 z-20">
                                    <button
                                        onClick={() => {
                                            onUploadFile();
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <Upload size={16} className="text-[#9B9A97]" />
                                        <span>Upload File</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onAddLink();
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <LinkIcon size={16} className="text-[#9B9A97]" />
                                        <span>Add Link</span>
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
