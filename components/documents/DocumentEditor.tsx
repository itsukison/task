'use client';

import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { X, ChevronRight, Download, FileIcon, File } from 'lucide-react';
import { Document as DocumentType } from '@/lib/types';
import { EditorToolbar } from './EditorToolbar';
import { formatFileSize, getFileCategory } from '@/lib/utils/file-upload';
import { useLanguage } from '@/lib/i18n';

interface DocumentEditorProps {
    document: DocumentType;
    onClose: () => void;
    onUpdate: (id: string, updates: { title?: string; content?: any }) => Promise<void>;
    folderPath?: string[];
}

export function DocumentEditor({ document, onClose, onUpdate, folderPath = [] }: DocumentEditorProps) {
    const { t } = useLanguage();
    const [title, setTitle] = useState(document.title);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Determine render mode based on document type
    const isEditable = document.type === 'document';
    const isUploadedFile = document.type === 'uploaded_file';

    // Initialize Tiptap editor (always call hook, but disable for uploaded files)
    const editor = useEditor({
        immediatelyRender: false, // Fix SSR hydration issues in Next.js
        editable: isEditable, // Only allow editing for document type
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-[#2383E2] underline cursor-pointer hover:text-[#1a6cbf]',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg',
                },
            }),
            Placeholder.configure({
                placeholder: t('documents.placeholder'),
            }),
        ],
        content: isEditable ? (document.content || {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                },
            ],
        }) : null, // Don't load content for uploaded files
        editorProps: {
            attributes: {
                class: 'prose prose-sm prose-tight max-w-none focus:outline-none min-h-[500px] text-[#37352F] [&_p]:my-1 [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5',
            },
        },
    });

    const lastSavedContent = useRef<any>(null);

    // Auto-save logic with debouncing (only for editable documents)
    useEffect(() => {
        if (!isEditable || !editor) return;

        let timeoutId: NodeJS.Timeout;

        const handleUpdate = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                setIsSaving(true);
                try {
                    const content = editor.getJSON();
                    await onUpdate(document.id, {
                        title,
                        content,
                    });
                    // Store the content we just saved so we can ignore it when it comes back via realtime
                    lastSavedContent.current = content;
                    setLastSaved(new Date());
                } catch (error) {
                    console.error('Failed to save document:', error);
                } finally {
                    setIsSaving(false);
                }
            }, 500);
        };

        editor.on('update', handleUpdate);

        return () => {
            clearTimeout(timeoutId);
            editor.off('update', handleUpdate);
        };
    }, [isEditable, editor, document.id, title, onUpdate]);

    // Save title changes
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (title !== document.title) {
                setIsSaving(true);
                try {
                    await onUpdate(document.id, { title });
                    setLastSaved(new Date());
                } catch (error) {
                    console.error('Failed to save title:', error);
                } finally {
                    setIsSaving(false);
                }
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [title, document.title, document.id, onUpdate]);

    // Real-time subscription for external document updates (e.g., from AI)
    useEffect(() => {
        if (!isEditable || !editor || !document.id) return;

        const { createClient } = require('@/lib/supabase/client');
        const supabase = createClient();

        const channel = supabase
            .channel(`document-${document.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'documents',
                    filter: `id=eq.${document.id}`,
                },
                (payload: any) => {
                    // Update editor content if it changed externally
                    if (payload.new && payload.new.content) {
                        const newContent = payload.new.content;

                        // Check if this update matches what we last saved
                        // If it does, it's likely an "echo" of our own save, so we ignore it
                        // to prevent overwriting any changes made since the save started relative to the debounce
                        if (lastSavedContent.current && JSON.stringify(lastSavedContent.current) === JSON.stringify(newContent)) {
                            return;
                        }

                        // Only update if content is different to avoid overwriting user's current edits
                        const currentContent = editor.getJSON();

                        // Simple check: compare stringified versions
                        if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
                            // Store current selection/cursor position
                            const { from, to } = editor.state.selection;

                            editor.commands.setContent(newContent);

                            // Restore selection if possible (best effort)
                            try {
                                editor.commands.setTextSelection({ from, to });
                            } catch (e) {
                                // Ignore selection errors if content structure changed significantly
                            }

                            setLastSaved(new Date());
                            // Update our ref so we don't think the next echo is ours if we just set it
                            lastSavedContent.current = newContent;
                        }
                    }

                    // Update title if it changed
                    if (payload.new && payload.new.title && payload.new.title !== title) {
                        setTitle(payload.new.title);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isEditable, editor, document.id, title]);

    const formatLastSaved = () => {
        if (!lastSaved) return '';
        const now = new Date();
        const diff = now.getTime() - lastSaved.getTime();
        const seconds = Math.floor(diff / 1000);

        if (seconds < 10) return t('documents.saved_just_now');
        if (seconds < 60) return t('documents.saved_seconds_ago', { seconds });

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return t('documents.saved_minutes_ago', { minutes });

        return t('documents.saved_at', { time: lastSaved.toLocaleTimeString() });
    };

    // Render file viewer for uploaded files
    const renderFileViewer = () => {
        if (!isUploadedFile || !document.fileUrl) return null;

        const fileExt = document.fileType?.toLowerCase() || '';
        const category = getFileCategory(document.fileName || '');

        // Handle different file types
        if (category === 'images') {
            return (
                <div className="flex items-center justify-center p-8">
                    <img
                        src={document.fileUrl}
                        alt={document.fileName || 'Uploaded image'}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    />
                </div>
            );
        }

        if (fileExt === 'pdf' || category === 'documents') {
            return (
                <iframe
                    src={document.fileUrl}
                    className="w-full h-full border-0"
                    title={document.fileName || 'Uploaded file'}
                />
            );
        }

        // Fallback for other file types
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <File className="w-16 h-16 text-gray-400" />
                <div className="text-center">
                    <p className="font-medium text-gray-700">{document.fileName}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(document.fileSize || 0)}</p>
                </div>
                <a
                    href={document.fileUrl}
                    download={document.fileName || undefined}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {t('common.download')}
                </a>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center backdrop-blur-[2px]" onClick={onClose}>
            <div
                className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Top Actions */}
                <div className="absolute top-3 right-3 flex items-center gap-4 z-10">
                    {/* Save status - only show for editable docs */}
                    {isEditable && (
                        <span className="text-xs text-[#9B9A97]">
                            {isSaving ? t('documents.saving') : formatLastSaved()}
                        </span>
                    )}

                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">

                    {/* Conditional rendering based on document type */}
                    {isEditable ? (
                        <>
                            {/* Title input only for editable documents */}
                            <div className="px-12 pt-12 pb-4">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={t('documents.untitled')}
                                    className="w-full text-4xl font-bold text-[#37352F] bg-transparent border-none outline-none placeholder-gray-300"
                                />
                            </div>

                            {/* Toolbar */}
                            {editor && (
                                <div className="px-12 pb-4">
                                    <EditorToolbar editor={editor} />
                                </div>
                            )}

                            {/* Editor content */}
                            <div className="px-12 pb-12">
                                <EditorContent editor={editor} />
                            </div>
                        </>
                    ) : isUploadedFile ? (
                        <>
                            {/* File Metadata Bar */}
                            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0 pr-10">
                                <div className="flex items-center gap-3">
                                    <FileIcon className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{document.title || document.fileName}</p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(document.fileSize || 0)} • {document.fileType}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={document.fileUrl || '#'}
                                    download={document.fileName || undefined}
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors px-3 py-1.5 hover:bg-blue-50 rounded-md"
                                >
                                    <Download className="w-4 h-4" />
                                    {t('common.download')}
                                </a>
                            </div>

                            {/* File Viewer */}
                            <div className="flex-1 bg-gray-100/50 flex flex-col">
                                {renderFileViewer()}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
