"use client";
import React, { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { X, CheckCircle, Loader2, Tag } from "lucide-react";

export interface TaggedFile {
    url: string;
    publicId: string;
    originalName: string;
    tag?: string;
}

interface FileUploadDemoProps {
    onFilesChange?: (files: TaggedFile[]) => void;
    availableTags?: string[];
}

export function FileUploadDemo({ onFilesChange, availableTags = [] }: FileUploadDemoProps) {
    const [uploadedFiles, setUploadedFiles] = useState<TaggedFile[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (files: File[]) => {
        setUploading(true);
        try {
            // 1. Get Signature
            const signRes = await fetch("/api/cloudinary-sign", { method: "POST" });
            const signData = await signRes.json();

            // 2. Upload Each File
            const newUploads: TaggedFile[] = [];

            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "");
                formData.append("timestamp", signData.timestamp);
                formData.append("signature", signData.signature);
                formData.append("folder", "gitdoc_uploads");

                const uploadRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );
                const data = await uploadRes.json();

                if (data.secure_url) {
                    newUploads.push({
                        url: data.secure_url,
                        publicId: data.public_id,
                        originalName: file.name,
                        tag: "Other" // Default tag
                    });
                }
            }

            setUploadedFiles(prev => {
                const updated = [...prev, ...newUploads];
                // Notify parent immediately
                onFilesChange?.(updated.filter(f => newSet.has(f.url)));
                return updated;
            });

            // Auto-select newly uploaded files
            const newSet = new Set(selectedIds);
            newUploads.forEach(u => newSet.add(u.url));
            setSelectedIds(newSet);

            // Notify parent of currently selected files with their tags
            const currentFiles = [...uploadedFiles, ...newUploads];
            const selectedFiles = currentFiles.filter(f => newSet.has(f.url));
            onFilesChange?.(selectedFiles);

        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    const toggleSelection = (url: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(url)) {
            newSet.delete(url);
        } else {
            newSet.add(url);
        }
        setSelectedIds(newSet);

        const selectedFiles = uploadedFiles.filter(f => newSet.has(f.url));
        onFilesChange?.(selectedFiles);
    };

    const handleTagChange = (url: string, newTag: string) => {
        setUploadedFiles(prev => {
            const updated = prev.map(f => f.url === url ? { ...f, tag: newTag } : f);

            // Also notify parent if this file is selected
            if (selectedIds.has(url)) {
                const selectedFiles = updated.filter(f => selectedIds.has(f.url));
                onFilesChange?.(selectedFiles);
            }
            return updated;
        });
    };

    return (
        <div className="w-full space-y-4">
            <div className="w-full max-w-4xl mx-auto min-h-[200px] border border-dashed bg-white dark:bg-black/20 border-neutral-200 dark:border-neutral-800 rounded-lg">
                <FileUpload onChange={handleFileUpload} />
            </div>

            {uploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading to Cloud....
                </div>
            )}

            {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {uploadedFiles.map((file, idx) => (
                        <div
                            key={idx}
                            className={`relative group border-2 rounded-xl overflow-hidden transition-all duration-200 bg-neutral-900/50 flex flex-col ${selectedIds.has(file.url) ? "border-green-500 ring-2 ring-green-500/20" : "border-gray-800 hover:border-gray-600"}`}
                        >
                            {/* Image Area - Click to Select */}
                            <div
                                onClick={() => toggleSelection(file.url)}
                                className="relative cursor-pointer h-40 w-full"
                            >
                                <img
                                    src={file.url}
                                    alt={file.originalName}
                                    className="w-full h-full object-cover"
                                />
                                <div className={`absolute top-2 right-2 p-1 rounded-full ${selectedIds.has(file.url) ? "bg-green-500 text-white" : "bg-black/50 text-white/50"}`}>
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Controls Area */}
                            <div className="p-3 bg-neutral-900 border-t border-gray-800 space-y-2">
                                <div className="text-xs truncate text-gray-400 font-mono" title={file.originalName}>
                                    {file.originalName}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Tag className="w-3 h-3 text-blue-400" />
                                    <select
                                        value={file.tag || "Other"}
                                        onChange={(e) => handleTagChange(file.url, e.target.value)}
                                        className="flex-1 bg-neutral-800 border border-gray-700 text-xs text-white rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                                        onClick={(e) => e.stopPropagation()} // Prevent toggling selection
                                    >
                                        <option value="Other">Other (Gallery)</option>
                                        {availableTags.map(tag => (
                                            <option key={tag} value={tag}>{tag}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
