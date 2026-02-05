'use client';

import { Document as DocumentType } from '@/lib/types';
import { FileText, Image as ImageIcon, Link as LinkIcon, File, ExternalLink, Play } from 'lucide-react';
import { getFileIcon, getFileCategory } from '@/lib/utils/file-upload';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFThumbnail } from './PDFThumbnail';

interface DocumentCardProps {
    document: DocumentType;
    isSelected?: boolean;
    onSelect: (e: React.MouseEvent) => void;
    onOpen: (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

export function DocumentCard({ document, isSelected = false, onSelect, onOpen, onContextMenu }: DocumentCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: document.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Helper to render Tiptap content as React elements with formatting
    const renderContent = (content: any, maxItems: number = 5): React.ReactNode[] => {
        if (!content || !content.content) return [];

        const elements: React.ReactNode[] = [];
        let itemCount = 0;

        const renderMarks = (text: string, marks?: any[]): React.ReactNode => {
            if (!marks || marks.length === 0) return text;

            let result: React.ReactNode = text;
            for (const mark of marks) {
                if (mark.type === 'bold') {
                    result = <strong key={`bold-${text}`}>{result}</strong>;
                } else if (mark.type === 'italic') {
                    result = <em key={`italic-${text}`}>{result}</em>;
                } else if (mark.type === 'strike') {
                    result = <s key={`strike-${text}`}>{result}</s>;
                } else if (mark.type === 'code') {
                    result = <code key={`code-${text}`} className="bg-gray-100 px-0.5 rounded text-[10px]">{result}</code>;
                }
            }
            return result;
        };

        const renderInlineContent = (node: any): React.ReactNode[] => {
            if (!node.content) return [];
            return node.content.map((child: any, i: number) => {
                if (child.type === 'text') {
                    return <span key={i}>{renderMarks(child.text, child.marks)}</span>;
                }
                return null;
            }).filter(Boolean);
        };

        for (const node of content.content) {
            if (itemCount >= maxItems) break;

            if (node.type === 'heading') {
                const level = node.attrs?.level || 1;
                const text = renderInlineContent(node);
                if (level === 1) {
                    elements.push(
                        <h1 key={itemCount} className="text-[10px] font-bold text-[#37352F] leading-tight mb-1">
                            {text}
                        </h1>
                    );
                } else {
                    elements.push(
                        <h3 key={itemCount} className="text-[8px] font-semibold text-[#37352F] leading-tight mb-0.5">
                            {text}
                        </h3>
                    );
                }
                itemCount++;
            } else if (node.type === 'paragraph') {
                const text = renderInlineContent(node);
                if (text.length > 0) {
                    elements.push(
                        <p key={itemCount} className="text-[7px] text-[#37352F] leading-normal mb-0.5">
                            {text}
                        </p>
                    );
                    itemCount++;
                }
            }
        }

        return elements;
    };

    const getTypeBadge = () => {
        if (document.type === 'link') {
            return (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-[#5F5E5B]">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    LINK
                </div>
            );
        }
        if (document.type === 'uploaded_file') {
            if (document.fileType?.startsWith('image/')) {
                return (
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-[#5F5E5B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        IMG
                    </div>
                );
            }
            if (document.fileType === 'application/pdf') {
                return (
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-[#5F5E5B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        PDF
                    </div>
                );
            }
            if (getFileCategory(document.fileName || '') === 'spreadsheets') {
                return (
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-[#5F5E5B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        SHEET
                    </div>
                );
            }
            if (getFileCategory(document.fileName || '') === 'presentations') {
                return (
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-[#5F5E5B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        SLIDE
                    </div>
                );
            }
        }

        // Default MD type
        return (
            <div className="flex items-center gap-1 text-[9px] font-semibold text-[#5F5E5B]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                MD
            </div>
        );
    };

    // Get preview content
    const getPreview = () => {
        // For images, show the image - maintaining aspect ratio
        if (document.type === 'uploaded_file' && document.fileUrl && document.fileType?.startsWith('image/')) {
            return (
                <div className="w-full h-full bg-white relative">
                    <img
                        src={document.fileUrl}
                        alt={document.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            );
        }

        // For PDF files, show PDF thumbnail
        if (
            document.type === 'uploaded_file' &&
            document.fileUrl &&
            (document.fileType === 'application/pdf' || getFileCategory(document.fileName || '') === 'documents')
        ) {
            return (
                <PDFThumbnail
                    url={document.fileUrl}
                    className="absolute inset-0"
                />
            );
        }

        // For Office documents
        if (
            document.type === 'uploaded_file' &&
            document.fileUrl &&
            ['spreadsheets', 'presentations'].includes(getFileCategory(document.fileName || ''))
        ) {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                    <File className="w-10 h-10 text-gray-400 mb-2" />
                </div>
            );
        }

        // For links with preview image
        if (document.type === 'link' && document.previewImageUrl) {
            return (
                <div className="w-full h-full bg-white relative">
                    <img
                        src={document.previewImageUrl}
                        alt={document.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 p-0.5 bg-white/90 rounded shadow-sm">
                        <ExternalLink size={10} className="text-[#787774]" />
                    </div>
                </div>
            );
        }

        // For text documents: Show formatted content
        const contentElements = renderContent(document.content);

        return (
            <div className="w-full h-full bg-white py-4 px-3 flex flex-col gap-0 overflow-hidden relative">
                {/* Document Title in Preview */}
                <h1 className="text-[10px] font-bold text-[#37352F] mb-1 leading-tight truncate">
                    {document.title}
                </h1>

                {contentElements.length > 0 ? (
                    <div className="flex flex-col opacity-60 scale-[0.8] origin-top-left w-[125%]">{contentElements}</div>
                ) : (
                    <div className="space-y-1.5 mt-1">
                        <div className="h-1 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-1 bg-gray-100 rounded w-full"></div>
                        <div className="h-1 bg-gray-100 rounded w-5/6"></div>
                    </div>
                )}
            </div>
        );
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(e);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpen(e);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group flex flex-col items-center w-[130px] h-[190px]"
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={onContextMenu}
        >
            {/* Card Area - Increased height, reduced rounding */}
            <div className={`relative w-[120px] h-[155px] bg-white rounded-lg shadow-sm border transition-all mb-2 overflow-hidden flex flex-col justify-between ${isSelected
                ? 'ring-2 ring-[var(--color-accent)] border-[var(--color-accent)]'
                : 'border-[#E6E6E6] hover:shadow-md'
                }`}>
                {/* Preview Content */}
                <div className="flex-1 w-full overflow-hidden relative bg-white">
                    {getPreview()}
                </div>

                {/* Type Badge Footer */}
                <div className="h-6 w-full border-t border-gray-100 bg-white/50 backdrop-blur-sm flex items-center justify-center shrink-0 z-10">
                    {getTypeBadge()}
                </div>
            </div>

            {/* Title Below */}
            <div className={`text-center px-1 max-w-full ${isSelected ? 'bg-[var(--color-accent)]/20 rounded px-2' : ''}`}>
                <h3 className="text-[11px] font-medium text-[#37352F] truncate w-full leading-tight">
                    {document.title}
                </h3>
            </div>
        </div>
    );
}
