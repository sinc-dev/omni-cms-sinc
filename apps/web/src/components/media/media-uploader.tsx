'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File as FileIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/lib/context/organization-context';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useApiClient } from '@/lib/hooks/use-api-client';

interface MediaUploaderProps {
    onUploadComplete: () => void;
    className?: string;
    accept?: Record<string, string[]>;
    maxSize?: number; // in bytes
}

export function MediaUploader({
    onUploadComplete,
    className,
    accept = {
        'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize = 10 * 1024 * 1024, // 10MB
}: MediaUploaderProps) {
    const { organization } = useOrganization();
    const api = useApiClient();
    const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            clearError();
        }
    }, [clearError]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple: false,
    });

    const handleUpload = withErrorHandling(async () => {
        if (!file || !api || !organization) {
            handleError('No organization selected or API unavailable', { title: 'Upload Error' });
            return;
        }

        setUploading(true);
        clearError();

        // Get image dimensions if it's an image
        let width: number | undefined;
        let height: number | undefined;

        if (file.type.startsWith('image/')) {
            const img = new Image();
            const url = URL.createObjectURL(file);
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    width = img.width;
                    height = img.height;
                    URL.revokeObjectURL(url);
                    resolve(null);
                };
                img.onerror = reject;
                img.src = url;
            });
        }

        // 1. Request upload URL and create media record
        const response = await api.requestUploadUrl({
            filename: file.name,
            mimeType: file.type,
            fileSize: file.size,
            width,
            height,
        });

        // The response should contain uploadUrl, fileKey, and media record
        const { uploadUrl } = response;

        // 2. Upload file to R2 using presigned URL
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });

        if (!uploadResponse.ok) {
            throw new Error('Upload to storage failed');
        }

        // 3. Notify parent - upload complete
        onUploadComplete();

        // Reset state
        setFile(null);
        setUploading(false);
    }, { title: 'Upload Failed' });

    const removeFile = () => {
        setFile(null);
        clearError();
    };

    return (
        <div className={cn('w-full', className)}>
            {!file ? (
                <div
                    {...getRootProps()}
                    className={cn(
                        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:bg-muted/50',
                        isDragActive ? 'border-primary bg-muted/50' : 'border-muted-foreground/25',
                        error && 'border-destructive/50 bg-destructive/5'
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                            {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                            Max size: {Math.round(maxSize / 1024 / 1024)}MB
                        </p>
                    </div>
                </div>
            ) : (
                <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                <FileIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        {!uploading && (
                            <Button variant="ghost" size="icon" onClick={removeFile}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button
                        className="w-full"
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Upload'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
