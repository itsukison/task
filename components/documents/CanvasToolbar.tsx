'use client';

import { Plus, FilePlus, FolderPlus, Upload, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';

interface CanvasToolbarProps {
    onNewDocument: () => void;
    onNewFolder: () => void;
    onUploadFile: () => void;
    onAddLink: () => void;
}

export function CanvasToolbar({ onNewDocument, onNewFolder, onUploadFile, onAddLink }: CanvasToolbarProps) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#E9E9E7]">
            <h1 className="text-2xl font-semibold text-[#37352F]">Documents</h1>

            <div className="flex items-center gap-2">
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
    );
}
