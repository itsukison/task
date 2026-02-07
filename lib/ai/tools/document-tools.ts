import { createClient } from '@/lib/supabase/server';
import { MAX_DOCUMENT_CHARS, validateDocumentSize, PendingDocumentEditAction, PendingOrganizeAction, AgentContext } from '../types';
import * as cheerio from 'cheerio';
import { getDocumentProxy, extractText } from 'unpdf';



// ============================================================================
// Tool Definitions
// ============================================================================

export const documentTools = [
    {
        type: 'function',
        function: {
            name: 'get_document_content',
            description: 'Retrieves the full content of a document by ID. REQUIRES: document_id from selected documents context. USE WITH: edit_document_content - call get_document_content first to see existing content before editing. RETURNS: Document content as plain text or structured data.',
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
            description: 'Searches for keywords or phrases within selected documents. REQUIRES: document_ids from selected documents context. RETURNS: Search results with matches and context snippets.',
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
    {
        type: 'function',
        function: {
            name: 'edit_document_content',
            description: 'Edits a document\'s content. REQUIRES: document_id from selected documents context. USE WITH: get_document_content to read existing content before editing (for refining/updating). RETURNS: Preview for user confirmation. Edit types: "rewrite" (replace all), "append" (add to end), "prepend" (add to start), "replace_section" (find and replace specific text).',
            parameters: {
                type: 'object',
                properties: {
                    document_id: {
                        type: 'string',
                        description: 'The ID of the document to edit (available from selected documents context).',
                    },
                    edit_type: {
                        type: 'string',
                        enum: ['rewrite', 'append', 'prepend', 'replace_section'],
                        description: 'The type of edit: "rewrite" (replace entire content), "append" (add to end), "prepend" (add to beginning), "replace_section" (find and replace specific text)',
                    },
                    new_content: {
                        type: 'string',
                        description: 'The new content to insert or use for replacement. For replace_section, this is the replacement text. For rewrite/append/prepend, this is the complete new text.',
                    },
                    target_text: {
                        type: 'string',
                        description: 'Required only for edit_type="replace_section". The specific text to find and replace in the document. Must be an exact match from the existing content.',
                    },
                },
                required: ['document_id', 'edit_type', 'new_content'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'organize_documents',
            description: 'Organizes documents into folders based on titles and content. REQUIRES: document_ids from selected documents context. RETURNS: Preview showing proposed folder structure and document placement for user confirmation.',
            parameters: {
                type: 'object',
                properties: {
                    document_ids: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of document IDs to organize. If not provided, organizes all documents in the current folder.',
                    },
                    folder_structure: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                folder_name: {
                                    type: 'string',
                                    description: 'Name of the folder to create or use',
                                },
                                document_ids: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Document IDs to move into this folder',
                                },
                            },
                            required: ['folder_name', 'document_ids'],
                        },
                        description: 'The proposed folder structure with documents to move into each folder. AI should analyze document titles and content to suggest logical groupings.',
                    },
                },
                required: ['folder_structure'],
            },
        },
    },
];

// ============================================================================
// Tool Implementations
// ============================================================================

export async function getDocumentContent(
    documentId: string,
    cache?: { [documentId: string]: { content: string; fetchedAt: number } }
): Promise<{ content: string; updatedCache: { [documentId: string]: { content: string; fetchedAt: number } } }> {
    // Check cache first
    if (cache && cache[documentId]) {
        console.log(`✅ Using cached content for document ${documentId}`);
        return {
            content: cache[documentId].content,
            updatedCache: cache,
        };
    }

    console.log(`📄 Fetching fresh content for document ${documentId}`);
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

    const fullContent = `# ${data.title}\n\n${textContent}`;

    // Update cache
    const updatedCache = {
        ...(cache || {}),
        [documentId]: {
            content: fullContent,
            fetchedAt: Date.now(),
        },
    };

    return { content: fullContent, updatedCache };
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
        // Fetch PDF from storage
        const response = await fetch(fileUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Load PDF with unpdf
        const pdf = await getDocumentProxy(arrayBuffer);

        // Extract all text from all pages
        const { text } = await extractText(pdf, { mergePages: true });

        if (!text || text.trim().length === 0) {
            return `[PDF: ${fileName}]\nNote: PDF appears to be empty or contains only images/scans. Text extraction requires OCR which is not yet supported.`;
        }

        return text;
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

// ============================================================================
// New Tool Implementations: Edit Document & Organize Documents
// ============================================================================

export async function editDocumentContent(
    documentId: string,
    editType: 'rewrite' | 'append' | 'prepend' | 'replace_section',
    newContent: string,
    targetText: string | undefined,
    context: AgentContext
): Promise<PendingDocumentEditAction> {
    const supabase = await createClient();

    // Fetch current document
    const { data: doc, error } = await supabase
        .from('documents')
        .select('id, title, content, type, created_by')
        .eq('id', documentId)
        .is('deleted_at', null)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to fetch document: ${error.message}`);
    }

    if (!doc) {
        throw new Error('Document not found or you do not have permission to access it');
    }

    // Only allow editing native documents (not uploaded files or links)
    if (doc.type !== 'document') {
        throw new Error('Can only edit text documents. Uploaded files and links cannot be edited.');
    }

    // Extract current content
    const currentContent = extractTextFromTiptap(doc.content as unknown as TiptapNode);

    // Validate target text for replace_section
    if (editType === 'replace_section') {
        if (!targetText) {
            throw new Error('target_text is required for replace_section edit type');
        }
        if (!currentContent.includes(targetText)) {
            throw new Error('target_text not found in document content. Ensure you copied the exact text from get_document_content.');
        }
    }

    // Compute new content based on edit type
    let afterContent = '';
    switch (editType) {
        case 'rewrite':
            afterContent = newContent;
            break;
        case 'append':
            afterContent = currentContent + '\n\n' + newContent;
            break;
        case 'prepend':
            afterContent = newContent + '\n\n' + currentContent;
            break;
        case 'replace_section':
            afterContent = currentContent.replace(targetText!, newContent);
            break;
    }

    // Generate preview (first 200 chars)
    const beforePreview = currentContent.substring(0, 200) + (currentContent.length > 200 ? '...' : '');
    const afterPreview = afterContent.substring(0, 200) + (afterContent.length > 200 ? '...' : '');

    return {
        type: 'edit_document',
        documentId,
        editType,
        newContent,
        targetText,
        preview: {
            documentTitle: doc.title,
            beforeContent: beforePreview,
            afterContent: afterPreview,
            editType,
        },
    };
}

export async function organizeDocuments(
    documentIds: string[] | undefined,
    folderStructure: Array<{ folder_name: string; document_ids: string[] }>,
    context: AgentContext
): Promise<PendingOrganizeAction> {
    const supabase = await createClient();

    // Get current folder from context (documents page may have currentFolderId)
    // For now, we'll use null as the parent (root level organization)
    const currentFolderId = null;

    // If documentIds not provided, fetch all docs in current folder
    let docsToOrganize: any[];
    if (!documentIds || documentIds.length === 0) {
        const { data, error } = await supabase
            .from('documents')
            .select('id, title')
            .eq('organization_id', context.organizationId)
            .is('folder_id', currentFolderId)
            .is('deleted_at', null);

        if (error) {
            throw new Error(`Failed to fetch documents: ${error.message}`);
        }

        docsToOrganize = data || [];
    } else {
        // Validate provided document IDs
        const { data, error } = await supabase
            .from('documents')
            .select('id, title')
            .in('id', documentIds)
            .eq('organization_id', context.organizationId)
            .is('deleted_at', null);

        if (error) {
            throw new Error(`Failed to fetch documents: ${error.message}`);
        }

        docsToOrganize = data || [];

        // Check if all requested docs were found
        if (docsToOrganize.length !== documentIds.length) {
            const foundIds = docsToOrganize.map(d => d.id);
            const missingIds = documentIds.filter(id => !foundIds.includes(id));
            throw new Error(`Some documents not found or inaccessible: ${missingIds.join(', ')}`);
        }
    }

    // Build document title map for previews
    const docTitleMap = new Map(docsToOrganize.map(d => [d.id, d.title]));

    // Check which folders already exist
    const folderNames = folderStructure.map(f => f.folder_name);
    const { data: existingFolders } = await supabase
        .from('folders')
        .select('id, name')
        .eq('organization_id', context.organizationId)
        .is('parent_folder_id', currentFolderId)
        .in('name', folderNames)
        .is('deleted_at', null);

    const existingFolderMap = new Map((existingFolders || []).map(f => [f.name, f.id]));

    // Build operations array
    const operations = folderStructure.map(folder => {
        const folderId = existingFolderMap.get(folder.folder_name) || null;
        const documentTitles = folder.document_ids
            .map(id => docTitleMap.get(id))
            .filter(Boolean) as string[];

        return {
            folderName: folder.folder_name,
            folderId,
            documentIds: folder.document_ids,
            documentTitles,
        };
    });

    // Generate preview summary
    const foldersToCreate = operations
        .filter(op => op.folderId === null)
        .map(op => op.folderName);

    const totalMoves = operations.reduce((sum, op) => sum + op.documentIds.length, 0);
    const folderCount = operations.length;

    return {
        type: 'organize_documents',
        currentFolderId,
        operations,
        preview: {
            foldersToCreate,
            totalMoves,
            movesSummary: `${totalMoves} documents → ${folderCount} folder${folderCount > 1 ? 's' : ''}`,
        },
    };
}
