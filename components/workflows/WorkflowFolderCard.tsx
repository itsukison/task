'use client';

import { WorkflowFolder } from '@/lib/types';
import Folder from '@/components/Folder';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WorkflowFolderCardProps {
    folder: WorkflowFolder;
    itemCount: number;
    isSelected?: boolean;
    onSelect: (e: React.MouseEvent) => void;
    onOpen: (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

export function WorkflowFolderCard({
    folder,
    itemCount,
    isSelected = false,
    onSelect,
    onOpen,
    onContextMenu,
}: WorkflowFolderCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: folder.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group flex flex-col items-center justify-start w-[130px] h-[160px]"
            onClick={(e) => { e.stopPropagation(); onSelect(e); }}
            onDoubleClick={(e) => { e.stopPropagation(); onOpen(e); }}
            onContextMenu={onContextMenu}
        >
            <div
                className={`p-2 rounded-xl mt-4 transition-all mb-1 ${
                    isSelected ? 'bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]' : 'hover:bg-gray-100'
                }`}
            >
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
