'use client';

import { Folder as FolderType } from '@/lib/types';
import Folder from '@/components/Folder';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FolderCardProps {
    folder: FolderType;
    itemCount: number;
    isSelected?: boolean;
    onSelect: (e: React.MouseEvent) => void;
    onOpen: (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

export function FolderCard({ folder, itemCount, isSelected = false, onSelect, onOpen, onContextMenu }: FolderCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: folder.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Single click selects
        onSelect(e);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Double click opens/navigates
        onOpen(e);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group flex flex-col items-center justify-start w-[130px] h-[160px]"
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={onContextMenu}
        >
            <div className={`p-2 rounded-xl mt-4 transition-all mb-1 ${isSelected ? 'bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]' : 'hover:bg-gray-100'
                }`}>
                <Folder size={1.1} color="#FFD659" />
            </div>

            <div className={`text-center px-1 max-w-full ${isSelected ? 'bg-[var(--color-accent)]/20 rounded px-2' : ''}`}>
                <h3 className="text-[12px] font-medium text-[#37352F] truncate w-full leading-tight">
                    {folder.name}
                </h3>
                {itemCount > 0 && (
                    <p className="text-[10px] text-[#9B9A97] mt-0.5">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </p>
                )}
            </div>
        </div>
    );
}
