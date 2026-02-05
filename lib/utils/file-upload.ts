import { supabase } from '@/lib/supabase';

/**
 * File upload progress callback
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Supported file types for document uploads
 */
export const SUPPORTED_FILE_TYPES = {
    documents: ['pdf', 'doc', 'docx', 'txt', 'md'],
    images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    spreadsheets: ['xls', 'xlsx', 'csv'],
    presentations: ['ppt', 'pptx'],
    other: ['zip', 'json', 'xml'],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file type is supported
 */
export function isFileTypeSupported(filename: string): boolean {
    const ext = getFileExtension(filename);
    return Object.values(SUPPORTED_FILE_TYPES).some((types) => types.includes(ext));
}

/**
 * Get file type category
 */
export function getFileCategory(filename: string): string {
    const ext = getFileExtension(filename);
    
    for (const [category, types] of Object.entries(SUPPORTED_FILE_TYPES)) {
        if (types.includes(ext)) {
            return category;
        }
    }
    
    return 'other';
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Compress image if it's too large
 */
async function compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    file.type,
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
    file: File,
    userId: string,
    organizationId: string,
    onProgress?: UploadProgressCallback
): Promise<{ url: string; path: string }> {
    try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
        }

        // Validate file type
        if (!isFileTypeSupported(file.name)) {
            throw new Error('File type not supported');
        }

        // Compress images if they're too large
        let fileToUpload: File | Blob = file;
        const category = getFileCategory(file.name);
        if (category === 'images' && file.size > 2 * 1024 * 1024) {
            // Compress images larger than 2MB
            try {
                fileToUpload = await compressImage(file);
            } catch (err) {
                console.warn('Failed to compress image, uploading original:', err);
                fileToUpload = file;
            }
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const ext = getFileExtension(file.name);
        const fileName = `${timestamp}-${randomString}.${ext}`;
        const filePath = `${organizationId}/${userId}/${fileName}`;

        // Log upload attempt for debugging
        console.log('Upload attempt:', {
            bucket: 'document-files',
            path: filePath,
            userId: userId,
            organizationId: organizationId,
            fileName: file.name,
            fileSize: file.size,
        });

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('document-files')
            .upload(filePath, fileToUpload, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Storage upload failed:', {
                error,
                message: error.message,
                path: filePath,
                hint: 'Check storage RLS policies if this is a permission error',
            });
            throw error;
        }

        // Get signed URL for private bucket (valid for 1 year)
        const { data: urlData, error: urlError } = await supabase.storage
            .from('document-files')
            .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

        if (urlError) {
            throw urlError;
        }

        if (onProgress) {
            onProgress(100);
        }

        return {
            url: urlData.signedUrl,
            path: filePath,
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(filePath: string): Promise<void> {
    try {
        const { error } = await supabase.storage
            .from('document-files')
            .remove([filePath]);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

/**
 * Generate thumbnail URL for file
 */
export function getFileThumbnailUrl(fileUrl: string, fileType: string): string {
    const category = getFileCategory(fileType);
    
    // For images, return the URL as is (can add transformation parameters later)
    if (category === 'images') {
        return fileUrl;
    }
    
    // For other file types, return icon-based placeholders
    // These can be replaced with actual icon URLs or data URIs
    return fileUrl;
}

/**
 * Get file icon name based on file type
 */
export function getFileIcon(filename: string): string {
    const category = getFileCategory(filename);
    const ext = getFileExtension(filename);
    
    switch (category) {
        case 'documents':
            if (ext === 'pdf') return 'FileText';
            return 'FileText';
        case 'images':
            return 'Image';
        case 'spreadsheets':
            return 'Table';
        case 'presentations':
            return 'Presentation';
        default:
            return 'File';
    }
}
