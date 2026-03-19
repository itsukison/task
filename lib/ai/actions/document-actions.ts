import { ActionContext, ActionCallbacks } from './types';
import { PendingDocumentEditAction, PendingOrganizeAction } from '../types';

export const handleEditDocument = async (
    action: PendingDocumentEditAction,
    context: ActionContext,
    callbacks: ActionCallbacks
) => {
    const { setMessages, setPendingAction } = callbacks;

    const supabaseImport = await import('@/lib/supabase/client');
    const supabase = supabaseImport.createClient();

    // Fetch current document to get content
    const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('content, type')
        .eq('id', action.documentId)
        .single();

    if (fetchError || !doc) {
        console.error('Failed to fetch document:', fetchError);
        setMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: `❌ Failed to fetch document: ${fetchError?.message || 'Not found'}`,
                timestamp: Date.now(),
            },
        ]);
        setPendingAction(null);
        return;
    }

    // Helper to extract text from Tiptap content
    const extractText = (content: any): string => {
        if (!content || !content.type) return '';
        let text = '';
        if (content.type === 'text') text += content.text || '';
        if (content.type === 'paragraph' || content.type === 'heading' || content.type === 'doc') {
            if (content.content) {
                content.content.forEach((child: any) => {
                    text += extractText(child);
                });
            }
            if (content.type !== 'doc') text += '\n';
        }
        return text;
    };

    // Helper to convert plain text to Tiptap JSON
    const textToTiptap = (text: string): any => {
        const paragraphs = text.split('\n').filter(p => p.trim());
        return {
            type: 'doc',
            content: paragraphs.map(p => ({
                type: 'paragraph',
                content: [{ type: 'text', text: p }]
            }))
        };
    };

    // Compute new content based on edit type
    const currentText = extractText(doc.content);
    let newText = '';

    switch (action.editType) {
        case 'rewrite':
            newText = action.newContent;
            break;
        case 'append':
            newText = currentText + '\n\n' + action.newContent;
            break;
        case 'prepend':
            newText = action.newContent + '\n\n' + currentText;
            break;
        case 'replace_section':
            if (action.targetText) {
                newText = currentText.replace(action.targetText, action.newContent);
            }
            break;
    }

    const newContent = textToTiptap(newText);

    // Update document
    const { error: updateError } = await supabase
        .from('documents')
        .update({ content: newContent })
        .eq('id', action.documentId);

    if (updateError) {
        console.error('Failed to update document:', updateError);
        setMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: `❌ Failed to update document: ${updateError.message}`,
                timestamp: Date.now(),
            },
        ]);
        setPendingAction(null);
        return;
    }

    setMessages((prev) => [
        ...prev,
        {
            role: 'assistant',
            content: 'Document edited successfully',
            timestamp: Date.now(),
            action: { ...action, type: 'edit_document' }
        },
    ]);

    // Dispatch event for document updates
    window.dispatchEvent(new CustomEvent('ai-documents-changed'));
};


export const handleOrganizeDocuments = async (
    action: PendingOrganizeAction,
    context: ActionContext,
    callbacks: ActionCallbacks
) => {
    const { user, currentOrganization } = context;
    const { setMessages, setPendingAction } = callbacks;

    const supabaseImport = await import('@/lib/supabase/client');
    const supabase = supabaseImport.createClient();

    if (!currentOrganization || !user) return;

    // Execute each operation in the plan
    for (const op of action.operations) {
        let folderId = op.folderId;

        // Create folder if it doesn't exist
        if (!folderId) {
            const { data: newFolder, error: folderError } = await supabase
                .from('folders')
                .insert({
                    organization_id: currentOrganization.id,
                    created_by: user.id,
                    name: op.folderName,
                    parent_folder_id: action.currentFolderId,
                    visibility: 'team',
                } as any)
                .select()
                .single();

            if (folderError || !newFolder) {
                console.error('Failed to create folder:', folderError);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `❌ Failed to create folder "${op.folderName}": ${folderError?.message}`,
                        timestamp: Date.now(),
                    },
                ]);
                setPendingAction(null);
                return;
            }

            folderId = newFolder.id;
        }

        // Move documents into folder
        for (const docId of op.documentIds) {
            const { error: moveError } = await supabase
                .from('documents')
                .update({ folder_id: folderId })
                .eq('id', docId);

            if (moveError) {
                console.error('Failed to move document:', moveError);
                // Continue with other documents even if one fails
            }
        }
    }

    setMessages((prev) => [
        ...prev,
        {
            role: 'assistant',
            content: `✅ Organized ${action.preview.totalMoves} documents into ${action.operations.length} folder(s)`,
            timestamp: Date.now(),
            action: { ...action, type: 'organize_documents' }
        },
    ]);

    // Dispatch event for document updates
    window.dispatchEvent(new CustomEvent('ai-documents-changed'));
};
