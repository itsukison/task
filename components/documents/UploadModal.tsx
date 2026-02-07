'use client';

import { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, File, Loader } from 'lucide-react';
import { uploadFile, formatFileSize, isFileTypeSupported, MAX_FILE_SIZE } from '@/lib/utils/file-upload';
import { useAuth } from '@/lib/auth/hooks';

interface UploadModalProps {
    isOpen: boolean;
    mode: 'file' | 'link';
    onClose: () => void;
    onUploadComplete: (data: {
        type: 'uploaded_file' | 'link';
        title: string;
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        fileType?: string;
        linkUrl?: string;
        previewImageUrl?: string;
        previewMetadata?: any;
    }) => Promise<void>;
}

export function UploadModal({ isOpen, mode, onClose, onUploadComplete }: UploadModalProps) {
    const { user, currentOrg } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (selectedFile: File) => {
        setError(null);

        // Validate file size
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
            return;
        }

        // Validate file type
        if (!isFileTypeSupported(selectedFile.name)) {
            setError('File type not supported');
            return;
        }

        setFile(selectedFile);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleUploadFile = async () => {
        if (!file || !user || !currentOrg) return;

        try {
            setUploading(true);
            setError(null);

            const { url, path } = await uploadFile(
                file,
                user.id,
                currentOrg.id,
                (progress) => setUploadProgress(progress)
            );

            await onUploadComplete({
                type: 'uploaded_file',
                title: file.name,
                fileUrl: url,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
            });

            onClose();
            setFile(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload file');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleAddLink = async () => {
        if (!linkUrl) return;

        try {
            setUploading(true);
            setError(null);

            // Fetch link preview (simplified - will implement full preview fetching later)
            await onUploadComplete({
                type: 'link',
                title: linkUrl,
                linkUrl: linkUrl,
            });

            onClose();
            setLinkUrl('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add link');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/20 z-[100] flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-white w-full max-w-[480px] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-[#37352F]">
                        {mode === 'file' ? 'Upload file' : 'Add link'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-[#9B9A97] hover:text-[#37352F] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                    {mode === 'file' ? (
                        <>
                            {/* File upload area */}
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    relative rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                                    ${dragActive
                                        ? 'bg-[#EFEFED] ring-2 ring-[#37352F] ring-offset-2'
                                        : 'bg-[#F7F7F5] hover:bg-[#EFEFED]'
                                    }
                                `}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleFileChange(e.target.files[0]);
                                        }
                                    }}
                                />

                                {file ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="p-2 bg-white rounded-md shadow-sm">
                                            <File size={20} className="text-[#37352F]" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-[#37352F] truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-[#787774]">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                            <Upload size={18} className="text-[#787774]" />
                                        </div>
                                        <p className="text-sm font-medium text-[#37352F] mb-1">
                                            Click to upload
                                        </p>
                                        <p className="text-xs text-[#9B9A97]">
                                            or drag and drop
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Upload progress */}
                            {uploading && (
                                <div className="mt-4">
                                    <div className="w-full h-1 bg-[#E9E9E7] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#37352F] transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Link input */}
                            <div>
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="Paste any link..."
                                    className="w-full px-4 py-3 text-sm text-[#37352F] bg-[#F7F7F5] rounded-lg border-none focus:ring-2 focus:ring-[#37352F]/10 focus:bg-[#EFEFED] placeholder:text-[#9B9A97] transition-all"
                                    autoFocus
                                />
                            </div>
                        </>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="mt-4 text-sm text-[#EB5757] flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#EB5757]" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <button
                    onClick={mode === 'file' ? handleUploadFile : handleAddLink}
                    disabled={uploading || (mode === 'file' ? !file : !linkUrl)}
                    className={`
                        w-full py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                        ${uploading || (mode === 'file' ? !file : !linkUrl)
                            ? 'bg-[#F7F7F5] text-[#9B9A97] cursor-not-allowed'
                            : 'bg-[#37352F] text-white hover:bg-[#2F2D29] active:scale-[0.99]'
                        }
                    `}
                >
                    {uploading && <Loader size={14} className="animate-spin" />}
                    {mode === 'file' ? (uploading ? 'Uploading...' : 'Upload file') : 'Add link'}
                </button>
            </div>
        </div>
    );
}
