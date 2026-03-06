'use client';

import { Workflow } from '@/lib/types';
import { Bot, ExternalLink } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WorkflowCardProps {
    workflow: Workflow;
    isSelected?: boolean;
    onSelect: (e: React.MouseEvent) => void;
    onOpen: (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

function renderContent(content: any): React.ReactNode[] {
    if (!content?.content) return [];
    const elements: React.ReactNode[] = [];
    let count = 0;

    for (const node of content.content) {
        if (count >= 5) break;

        if (node.type === 'orderedList' || node.type === 'bulletList') {
            for (const item of node.content || []) {
                if (count >= 5) break;
                const text = item.content?.[0]?.content
                    ?.filter((n: any) => n.type === 'text')
                    .map((n: any) => n.text)
                    .join('') || '';
                if (text) {
                    elements.push(
                        <p key={count} className="text-[7px] text-[#37352F] leading-normal mb-0.5 truncate">
                            {count + 1}. {text}
                        </p>
                    );
                    count++;
                }
            }
        } else if (node.type === 'paragraph') {
            const text = node.content
                ?.filter((n: any) => n.type === 'text')
                .map((n: any) => n.text)
                .join('') || '';
            if (text) {
                elements.push(
                    <p key={count} className="text-[7px] text-[#37352F] leading-normal mb-0.5">
                        {text}
                    </p>
                );
                count++;
            }
        }
    }

    return elements;
}

export function WorkflowCard({ workflow, isSelected = false, onSelect, onOpen, onContextMenu }: WorkflowCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: workflow.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const contentElements = renderContent(workflow.content);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group flex flex-col items-center w-[130px] h-[190px]"
            onClick={(e) => { e.stopPropagation(); onSelect(e); }}
            onDoubleClick={(e) => { e.stopPropagation(); onOpen(e); }}
            onContextMenu={onContextMenu}
        >
            <div
                className={`relative w-[120px] h-[155px] bg-white rounded-lg shadow-sm border transition-all mb-2 overflow-hidden flex flex-col ${
                    isSelected
                        ? 'ring-2 ring-[var(--color-accent)] border-[var(--color-accent)]'
                        : 'border-[#E6E6E6] hover:shadow-md'
                }`}
            >
                {/* Preview */}
                <div className="flex-1 w-full overflow-hidden bg-white py-3 px-3 flex flex-col gap-0">
                    {/* Bot icon header */}
                    <div className="flex items-center gap-1 mb-1.5">
                        <Bot size={10} className="text-[#d76c33] shrink-0" />
                        {workflow.site && (
                            <span className="text-[7px] text-[#9B9A97] truncate">{workflow.site}</span>
                        )}
                    </div>

                    {contentElements.length > 0 ? (
                        <div className="flex flex-col opacity-70">{contentElements}</div>
                    ) : (
                        <div className="space-y-1.5 mt-1">
                            <div className="h-1 bg-gray-100 rounded w-3/4" />
                            <div className="h-1 bg-gray-100 rounded w-full" />
                            <div className="h-1 bg-gray-100 rounded w-5/6" />
                            <div className="h-1 bg-gray-100 rounded w-2/3" />
                        </div>
                    )}
                </div>

                {/* Badge footer */}
                <div className="h-6 w-full border-t border-gray-100 bg-white/50 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-[#5F5E5B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d76c33]" />
                        WORKFLOW
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className={`text-center px-1 max-w-full ${isSelected ? 'bg-[var(--color-accent)]/20 rounded px-2' : ''}`}>
                <h3 className="text-[11px] font-medium text-[#37352F] truncate w-full leading-tight">
                    {workflow.name}
                </h3>
            </div>
        </div>
    );
}
