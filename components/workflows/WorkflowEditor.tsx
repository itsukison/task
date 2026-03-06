'use client';

import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { X, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { Workflow } from '@/lib/types';
import { EditorToolbar } from '@/components/documents/EditorToolbar';

interface WorkflowEditorProps {
    workflow: Workflow;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<{ name: string; description: string; site: string; content: any }>) => Promise<void>;
}

export function WorkflowEditor({ workflow, onClose, onUpdate }: WorkflowEditorProps) {
    const [name, setName] = useState(workflow.name);
    const [site, setSite] = useState(workflow.site || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const lastSavedContent = useRef<any>(null);

    const editor = useEditor({
        immediatelyRender: false,
        editable: true,
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-[#2383E2] underline cursor-pointer hover:text-[#1a6cbf]' },
            }),
            Placeholder.configure({
                placeholder: 'Write your workflow steps here...\n\nE.g.:\n- Go to zoom.us\n- Click "Schedule a Meeting"\n- Set the title to {meeting_title}\n- Invite {attendees}\n- Click Save\n\nThen hit AI Refine to clean up your steps.',
            }),
        ],
        content: workflow.content || {
            type: 'doc',
            content: [{ type: 'paragraph' }],
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm prose-tight max-w-none focus:outline-none min-h-[500px] text-[#37352F] [&_p]:my-1 [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5',
            },
        },
    });

    // Auto-save content
    useEffect(() => {
        if (!editor) return;

        let timeoutId: NodeJS.Timeout;

        const handleUpdate = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                setIsSaving(true);
                try {
                    const content = editor.getJSON();
                    await onUpdate(workflow.id, { name, site, content });
                    lastSavedContent.current = content;
                    setLastSaved(new Date());
                } catch (err) {
                    console.error('Failed to save workflow:', err);
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
    }, [editor, workflow.id, name, site, onUpdate]);

    // Auto-save name
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (name !== workflow.name) {
                setIsSaving(true);
                try {
                    await onUpdate(workflow.id, { name });
                    setLastSaved(new Date());
                } catch (err) {
                    console.error('Failed to save name:', err);
                } finally {
                    setIsSaving(false);
                }
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [name, workflow.name, workflow.id, onUpdate]);

    // Auto-save site
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (site !== (workflow.site || '')) {
                setIsSaving(true);
                try {
                    await onUpdate(workflow.id, { site });
                    setLastSaved(new Date());
                } catch (err) {
                    console.error('Failed to save site:', err);
                } finally {
                    setIsSaving(false);
                }
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [site, workflow.site, workflow.id, onUpdate]);

    const handleAIRefine = async () => {
        if (!editor || isRefining) return;

        const content = editor.getJSON();
        setIsRefining(true);

        try {
            const res = await fetch('/api/workflows/refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workflowId: workflow.id, content }),
            });

            if (!res.ok) throw new Error('Refine failed');

            const { content: refined } = await res.json();

            // Replace editor content with refined version
            editor.commands.setContent(refined);
            lastSavedContent.current = refined;
            setLastSaved(new Date());
        } catch (err) {
            console.error('AI Refine failed:', err);
        } finally {
            setIsRefining(false);
        }
    };

    const formatLastSaved = () => {
        if (!lastSaved) return '';
        const diff = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
        if (diff < 10) return 'Saved just now';
        if (diff < 60) return `Saved ${diff}s ago`;
        return `Saved ${Math.floor(diff / 60)}m ago`;
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Actions */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    <span className="text-xs text-[#9B9A97]">
                        {isSaving ? 'Saving...' : formatLastSaved()}
                    </span>

                    {/* AI Refine button */}
                    <button
                        onClick={handleAIRefine}
                        disabled={isRefining}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#d76c33] bg-[#d76c33]/10 hover:bg-[#d76c33]/20 border border-[#d76c33]/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isRefining ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Refining...
                            </>
                        ) : (
                            <>
                                <Sparkles size={14} />
                                AI Refine
                            </>
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    {/* Title */}
                    <div className="px-12 pt-12 pb-2">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Untitled Workflow"
                            className="w-full text-4xl font-bold text-[#37352F] bg-transparent border-none outline-none placeholder-gray-300"
                        />
                    </div>

                    {/* Target site property row */}
                    <div className="px-12 pb-4 flex items-center gap-2">
                        <ExternalLink size={14} className="text-[#9B9A97] shrink-0" />
                        <input
                            type="text"
                            value={site}
                            onChange={(e) => setSite(e.target.value)}
                            placeholder="Target site (e.g. zoom.us)"
                            className="text-sm text-[#787774] bg-transparent border-none outline-none placeholder-[#C7C7C5] hover:text-[#37352F] transition-colors w-64"
                        />
                    </div>

                    {/* Toolbar */}
                    {editor && (
                        <div className="px-12 pb-2">
                            <EditorToolbar editor={editor} />
                        </div>
                    )}

                    {/* Editor */}
                    <div className="px-12 pb-12">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>
        </div>
    );
}
