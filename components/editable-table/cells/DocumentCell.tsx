'use client';

import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { CellProps } from '../types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTaskDocuments, useAvailableDocuments } from '@/lib/hooks/use-task-documents';

/**
 * DocumentCell component - displays and manages linked documents
 * Click to open dropdown with link options
 * Uses orange Notion-style minimalist design
 */
export function DocumentCell({ value, rowId, onChange }: CellProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Use React Query hooks
    const { linkedDocs, linkDocument, unlinkDocument } = useTaskDocuments(rowId);

    // Pass linkedDocs to filter available ones
    const { data: availableDocs = [] } = useAvailableDocuments(isOpen, linkedDocs);

    const handleLinkDocument = async (docId: string, docTitle: string) => {
        linkDocument.mutate({ docId, docTitle });
    };

    const handleUnlinkDocument = async (linkId: string, docId: string) => {
        unlinkDocument.mutate(linkId);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1.5 h-full w-full cursor-pointer hover:bg-[#EFEFED] transition-colors duration-200 min-h-[32px]">
                    {linkedDocs.length === 0 ? (
                        <span className="text-xs text-[#9B9A97]"></span>
                    ) : (
                        <div className="flex items-center gap-1 flex-wrap">
                            {linkedDocs.map((doc) => (
                                <span
                                    key={doc.id}
                                    className="px-2 py-0.5 text-xs bg-orange-50 text-[#37352F] rounded hover:bg-orange-100 cursor-pointer transition-colors duration-200 flex items-center gap-1 border border-orange-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {doc.title}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnlinkDocument(doc.id, doc.document_id);
                                        }}
                                        className="hover:text-[#FF5500] transition-colors"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="p-0 w-64 border-[#E9E9E7]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText size={14} className="text-[#FF5500]" />
                        <span className="text-xs font-medium text-[#37352F]">Link document</span>
                    </div>
                    {availableDocs.length === 0 ? (
                        <div className="text-sm text-[#9B9A97] py-2 text-center">
                            No documents available
                        </div>
                    ) : (
                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                            {availableDocs.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => handleLinkDocument(doc.id, doc.title)}
                                    className="w-full text-left px-2 py-1.5 text-sm text-[#5F5E5B] hover:bg-[#EFEFED] hover:text-[#37352F] rounded transition-colors duration-200 truncate"
                                >
                                    {doc.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
