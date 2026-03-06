/** Extracts plain text from a Tiptap JSON document */
export function extractPlainText(tiptapContent: any): string {
    if (!tiptapContent || !tiptapContent.content) return '';

    const extractText = (node: any): string => {
        if (node.type === 'text') return node.text || '';
        if (node.content) return node.content.map(extractText).join(' ');
        return '';
    };

    return tiptapContent.content.map(extractText).join('\n').trim();
}
