'use client';

import { ChevronRight } from 'lucide-react';
import { Folder } from '@/lib/types';

interface BreadcrumbProps {
    folderPath: Folder[];
    onNavigate: (folderId: string | null) => void;
}

export function Breadcrumb({ folderPath, onNavigate }: BreadcrumbProps) {
    return (
        <div className="flex items-center gap-1 text-sm text-[#787774]">
            {/* Root "Documents" */}
            <button
                onClick={() => onNavigate(null)}
                className="hover:text-[#37352F] transition-colors"
            >
                Documents
            </button>

            {/* Folder path */}
            {folderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-1">
                    <ChevronRight size={16} className="text-[#9B9A97]" />
                    <button
                        onClick={() => onNavigate(folder.id)}
                        className={`hover:text-[#37352F] transition-colors ${index === folderPath.length - 1 ? 'font-medium text-[#37352F]' : ''
                            }`}
                    >
                        {folder.name}
                    </button>
                </div>
            ))}
        </div>
    );
}
