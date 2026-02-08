'use client';

import React, { useState } from 'react';
import { Plus, FilePlus, FolderPlus, Upload, Link as LinkIcon, LayoutGrid, ArrowDownAZ, Calendar, ChevronDown } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { Folder } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

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
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showNewMenu, setShowNewMenu] = useState(false);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const { t } = useLanguage();

    return (
        <div className="pt-12 px-8 pb-4 flex-shrink-0 ml-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#37352F] mb-1 tracking-tight">{t('documents.title')}</h1>
                    <Breadcrumb folderPath={folderPath} onNavigate={onNavigate} />
                </div>

                <div className="flex items-center gap-2">
                    {/* Sort dropdown (merged Organize) */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#787774] bg-white border border-[#E9E9E7] rounded-lg hover:bg-[#F7F7F5] hover:text-[#37352F] transition-colors"
                        >
                            <ArrowDownAZ size={16} />
                            <span>{t('common.sort')}</span>
                            <ChevronDown size={14} />
                        </button>

                        {showSortMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowSortMenu(false)}
                                />
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 z-20">
                                    <button
                                        onClick={() => {
                                            onOrganize();
                                            setShowSortMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <LayoutGrid size={16} className="text-[#9B9A97]" />
                                        <span>{t('documents.sort_as_is')}</span>
                                    </button>
                                    <div className="h-px bg-[#E9E9E7] my-1 mx-2" />
                                    <button
                                        onClick={() => {
                                            onSort('name');
                                            setShowSortMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <ArrowDownAZ size={16} className="text-[#9B9A97]" />
                                        <span>{t('documents.sort_name')}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onSort('created');
                                            setShowSortMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <Calendar size={16} className="text-[#9B9A97]" />
                                        <span>{t('documents.sort_date_created')}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onSort('modified');
                                            setShowSortMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <Calendar size={16} className="text-[#9B9A97]" />
                                        <span>{t('documents.sort_date_modified')}</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* New dropdown (merged Folder/Document) */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNewMenu(!showNewMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#37352F] bg-white border border-[#E9E9E7] rounded-lg hover:bg-[#F7F7F5] transition-colors"
                        >
                            <Plus size={16} />
                            <span>{t('documents.new_document')}</span>
                            <ChevronDown size={14} className="text-[#9B9A97]" />
                        </button>

                        {showNewMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowNewMenu(false)}
                                />
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 z-20">
                                    <button
                                        onClick={() => {
                                            onNewFolder();
                                            setShowNewMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <FolderPlus size={16} className="text-[#9B9A97]" />
                                        <span>{t('documents.folder')}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onNewDocument();
                                            setShowNewMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <FilePlus size={16} className="text-[#9B9A97]" />
                                        <span>{t('documents.document')}</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Upload dropdown (renamed from Add) */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUploadMenu(!showUploadMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#FF5500] rounded-lg hover:bg-[#FF7F3D] transition-colors"
                        >
                            <Upload size={16} />
                            <span>{t('documents.upload')}</span>
                            <ChevronDown size={14} className="text-white/80" />
                        </button>

                        {showUploadMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowUploadMenu(false)}
                                />
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 z-20">
                                    <button
                                        onClick={() => {
                                            onUploadFile();
                                            setShowUploadMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <Upload size={16} className="text-[#9B9A97]" />
                                        <span>{t('documents.file')}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onAddLink();
                                            setShowUploadMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                                    >
                                        <LinkIcon size={16} className="text-[#9B9A97]" />
                                        <span>{t('documents.link')}</span>
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
