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
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9E9E7]">
                    <h2 className="text-lg font-semibold text-[#37352F]">
                        {mode === 'file' ? 'Upload File' : 'Add Link'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {mode === 'file' ? (
                        <>
                            {/* File upload area */}
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                    dragActive
                                        ? 'border-[#FF5500] bg-orange-50'
                                        : 'border-[#E9E9E7] hover:border-[#C8C7C5] hover:bg-[#FAFAFA]'
                                }`}
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
                                    <div className="flex items-center gap-3">
                                        <File size={24} className="text-[#FF5500]" />
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium text-[#37352F]">{file.name}</p>
                                            <p className="text-xs text-[#9B9A97]">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={32} className="mx-auto mb-3 text-[#9B9A97]" />
                                        <p className="text-sm font-medium text-[#37352F] mb-1">
                                            Drop file here or click to browse
                                        </p>
                                        <p className="text-xs text-[#9B9A97]">
                                            Max file size: {formatFileSize(MAX_FILE_SIZE)}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Upload progress */}
                            {uploading && (
                                <div className="mt-4">
                                    <div className="w-full h-2 bg-[#F7F7F5] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#FF5500] transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-[#9B9A97] mt-2 text-center">
                                        Uploading... {uploadProgress}%
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Link input */}
                            <div>
                                <label className="block text-sm font-medium text-[#37352F] mb-2">
                                    Link URL
                                </label>
                                <div className="flex items-center gap-2 px-3 py-2 border border-[#E9E9E7] rounded-lg focus-within:border-[#2383E2]">
                                    <LinkIcon size={16} className="text-[#9B9A97]" />
                                    <input
                                        type="url"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="flex-1 text-sm text-[#37352F] bg-transparent outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="mt-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E9E9E7]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-[#37352F] border border-[#E9E9E7] rounded-lg hover:bg-[#F7F7F5] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={mode === 'file' ? handleUploadFile : handleAddLink}
                        disabled={uploading || (mode === 'file' ? !file : !linkUrl)}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#FF5500] rounded-lg hover:bg-[#FF7F3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {uploading && <Loader size={14} className="animate-spin" />}
                        {mode === 'file' ? 'Upload' : 'Add Link'}
                    </button>
                </div>
            </div>
        </div>
    );
}
