'use client';

import { Editor } from '@tiptap/react';
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
} from 'lucide-react';
import { useState } from 'react';

interface EditorToolbarProps {
    editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const addLink = () => {
        if (linkUrl) {
            editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: linkUrl })
                .run();
        }
        setShowLinkInput(false);
        setLinkUrl('');
    };

    const removeLink = () => {
        editor.chain().focus().unsetLink().run();
        setShowLinkInput(false);
        setLinkUrl('');
    };

    const toolbarButtonClass = (isActive = false) =>
        `p-1.5 hover:bg-[#EFEFED] rounded transition-colors ${
            isActive ? 'bg-[#EFEFED] text-[#37352F]' : 'text-[#787774]'
        }`;

    return (
        <div className="sticky top-0 bg-white border-b border-[#E9E9E7] px-8 py-2 flex items-center gap-1 z-10">
            {/* Text formatting */}
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={toolbarButtonClass(editor.isActive('bold'))}
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={toolbarButtonClass(editor.isActive('italic'))}
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={toolbarButtonClass(editor.isActive('strike'))}
                title="Strikethrough"
            >
                <Strikethrough size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={toolbarButtonClass(editor.isActive('code'))}
                title="Code"
            >
                <Code size={16} />
            </button>

            <div className="w-px h-6 bg-[#E9E9E7] mx-2" />

            {/* Headings */}
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={toolbarButtonClass(editor.isActive('heading', { level: 1 }))}
                title="Heading 1"
            >
                <Heading1 size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={toolbarButtonClass(editor.isActive('heading', { level: 2 }))}
                title="Heading 2"
            >
                <Heading2 size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={toolbarButtonClass(editor.isActive('heading', { level: 3 }))}
                title="Heading 3"
            >
                <Heading3 size={16} />
            </button>

            <div className="w-px h-6 bg-[#E9E9E7] mx-2" />

            {/* Lists */}
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={toolbarButtonClass(editor.isActive('bulletList'))}
                title="Bullet List"
            >
                <List size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={toolbarButtonClass(editor.isActive('orderedList'))}
                title="Numbered List"
            >
                <ListOrdered size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={toolbarButtonClass(editor.isActive('blockquote'))}
                title="Quote"
            >
                <Quote size={16} />
            </button>

            <div className="w-px h-6 bg-[#E9E9E7] mx-2" />

            {/* Link */}
            <div className="relative">
                <button
                    onClick={() => {
                        if (editor.isActive('link')) {
                            removeLink();
                        } else {
                            setShowLinkInput(true);
                        }
                    }}
                    className={toolbarButtonClass(editor.isActive('link'))}
                    title="Add Link"
                >
                    <LinkIcon size={16} />
                </button>

                {showLinkInput && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-[#E9E9E7] rounded-lg shadow-lg p-3 z-20 min-w-[300px]">
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="Enter URL..."
                            className="w-full px-2 py-1 text-sm border border-[#E9E9E7] rounded focus:border-[#2383E2] focus:outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addLink();
                                } else if (e.key === 'Escape') {
                                    setShowLinkInput(false);
                                    setLinkUrl('');
                                }
                            }}
                            autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={addLink}
                                className="px-3 py-1 text-sm bg-[#FF5500] text-white rounded hover:bg-[#FF7F3D] transition-colors"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => {
                                    setShowLinkInput(false);
                                    setLinkUrl('');
                                }}
                                className="px-3 py-1 text-sm border border-[#E9E9E7] rounded hover:bg-[#EFEFED] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="w-px h-6 bg-[#E9E9E7] mx-2" />

            {/* Undo/Redo */}
            <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className={toolbarButtonClass()}
                title="Undo"
            >
                <Undo size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className={toolbarButtonClass()}
                title="Redo"
            >
                <Redo size={16} />
            </button>
        </div>
    );
}
