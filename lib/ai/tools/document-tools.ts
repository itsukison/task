import { createClient } from '@/lib/supabase/server';
import { MAX_DOCUMENT_CHARS, validateDocumentSize } from '../types';
import * as cheerio from 'cheerio';



// ============================================================================
// Tool Definitions
// ============================================================================

export const documentTools = [
    {
        type: 'function',
        function: {
            name: 'get_document_content',
            description: 'Retrieves the full content of a document by ID. Use this to answer questions about specific documents.',
            parameters: {
                type: 'object',
                properties: {
                    document_id: {
                        type: 'string',
                        description: 'UUID of the document to retrieve',
                    },
                },
                required: ['document_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'search_in_documents',
            description: 'Searches for keywords or phrases within the content of selected documents.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query or keyword to find',
                    },
                    document_ids: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of document IDs to search within',
                    },
                },
                required: ['query', 'document_ids'],
            },
        },
    },
];

// ============================================================================
// Tool Implementations
// ============================================================================

export async function getDocumentContent(documentId: string): Promise<string> {
    const supabase = await createClient();

    // Try to fetch with RLS (will filter by permissions)
    const { data, error } = await supabase
        .from('documents')
        .select('title, content, type, file_url, link_url, file_type, file_name')
        .eq('id', documentId)
        .is('deleted_at', null)
        .maybeSingle(); // Use maybeSingle() to handle RLS filtering gracefully

    if (error) {
        throw new Error(`Failed to retrieve document: ${error.message}`);
    }

    if (!data) {
        // Document doesn't exist OR RLS filtered it out (permission denied)
        throw new Error('Document not found or you do not have permission to access it');
    }

    // Extract text content based on document type
    let textContent = '';

    switch (data.type) {
        case 'document':
            // Tiptap JSON - extract text
            textContent = extractTextFromTiptap(data.content as unknown as TiptapNode);
            break;

        case 'uploaded_file':
            // On-demand file extraction
            textContent = await extractFileContent(data.file_url, data.file_type, data.file_name);
            break;

        case 'link':
            // On-demand link fetching
            textContent = await extractLinkContent(data.link_url, data.title);
            break;

        default:
            textContent = '[Unknown document type]';
    }

    // Validate size
    const validation = validateDocumentSize(textContent);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    return `# ${data.title}\n\n${textContent}`;
}

export async function searchInDocuments(
    query: string,
    documentIds: string[]
): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('documents')
        .select('id, title, content')
        .in('id', documentIds)
        .eq('type', 'document'); // Only search in text documents

    if (error) {
        throw new Error(`Failed to search documents: ${error.message}`);
    }

    const results: string[] = [];
    const lowerQuery = query.toLowerCase();

    for (const doc of data || []) {
        const textContent = extractTextFromTiptap(doc.content as unknown as TiptapNode);
        const lowerContent = textContent.toLowerCase();

        if (lowerContent.includes(lowerQuery)) {
            // Find context around the match
            const index = lowerContent.indexOf(lowerQuery);
            const start = Math.max(0, index - 100);
            const end = Math.min(textContent.length, index + query.length + 100);
            const snippet = textContent.slice(start, end);

            results.push(`**${doc.title}**:\n...${snippet}...`);
        }
    }

    if (results.length === 0) {
        return `No results found for "${query}" in the selected documents.`;
    }

    return `Found ${results.length} result(s):\n\n${results.join('\n\n')}`;
}

// ============================================================================
// Helper Functions
// ============================================================================

interface TiptapNode {
    type: string;
    text?: string;
    content?: TiptapNode[];
}

function extractTextFromTiptap(content: TiptapNode | null | undefined): string {
    if (!content || !content.type) return '';

    let text = '';

    // Handle different Tiptap node types
    if (content.type === 'text') {
        text += content.text || '';
    }

    if (content.type === 'paragraph' || content.type === 'heading') {
        if (content.content) {
            content.content.forEach((child: TiptapNode) => {
                text += extractTextFromTiptap(child);
            });
        }
        text += '\n';
    }

    if (content.type === 'doc') {
        if (content.content) {
            content.content.forEach((child: TiptapNode) => {
                text += extractTextFromTiptap(child);
            });
        }
    }

    // Handle lists
    if (content.type === 'bulletList' || content.type === 'orderedList') {
        if (content.content) {
            content.content.forEach((child: TiptapNode) => {
                text += '• ' + extractTextFromTiptap(child);
            });
        }
    }

    if (content.type === 'listItem') {
        if (content.content) {
            content.content.forEach((child: TiptapNode) => {
                text += extractTextFromTiptap(child);
            });
        }
        text += '\n';
    }

    return text;
}

// PDF extraction helper (on-demand)
async function extractFileContent(
    fileUrl: string | null,
    fileType: string | null,
    fileName: string | null
): Promise<string> {
    if (!fileUrl) {
        return `[File: ${fileName || 'Unknown'}]\nNote: File URL not available.`;
    }

    // Only handle PDFs for now
    if (fileType !== 'application/pdf') {
        return `[File: ${fileName || 'Unknown'}]\nType: ${fileType || 'Unknown'}\nNote: Only PDF files can be read. Other file types show metadata only.`;
    }

    try {
        // Use require for pdf-parse (CommonJS module)
        const pdfParse = require('pdf-parse');

        // Fetch PDF from storage
        const response = await fetch(fileUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text from PDF
        const pdfData = await pdfParse(buffer);



        if (!pdfData.text || pdfData.text.trim().length === 0) {
            return `[PDF: ${fileName}]\nNote: PDF appears to be empty or contains only images/scans. Text extraction requires OCR which is not yet supported.`;
        }

        return pdfData.text;
    } catch (error) {
        console.error('PDF extraction error:', error);
        return `[PDF: ${fileName}]\nNote: Failed to extract text from PDF. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}

// Link content extraction helper (on-demand)
async function extractLinkContent(
    linkUrl: string | null,
    title: string
): Promise<string> {
    if (!linkUrl) {
        return `[Link: ${title}]\nNote: URL not available.`;
    }

    try {
        // Fetch the webpage with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(linkUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TaskOS-AI/1.0)',
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove script and style elements
        $('script, style, nav, footer, header').remove();

        // Try to get main content (common patterns)
        let content = '';
        const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content'];

        for (const selector of mainSelectors) {
            const mainContent = $(selector).text();
            if (mainContent && mainContent.length > 200) {
                content = mainContent;
                break;
            }
        }

        // Fallback to body if no main content found
        if (!content) {
            content = $('body').text();
        }

        // Clean up whitespace
        content = content
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 10000); // Limit to 10k chars

        if (!content || content.length < 50) {
            return `[Link: ${title}]\nURL: ${linkUrl}\nNote: Could not extract meaningful content from this webpage.`;
        }

        return `[Link: ${title}]\nURL: ${linkUrl}\n\n${content}`;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return `[Link: ${title}]\nURL: ${linkUrl}\nNote: Request timed out after 10 seconds.`;
        }

        console.error('Link extraction error:', error);
        return `[Link: ${title}]\nURL: ${linkUrl}\nNote: Failed to fetch content. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}
