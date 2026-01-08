"use client";
import React, { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { X, CheckCircle, Loader2 } from "lucide-react";

interface UploadedFile {
    url: string;
    publicId: string;
    originalName: string;
}

interface FileUploadDemoProps {
    onSelectionChange?: (selectedUrls: string[]) => void;
}

export function FileUploadDemo({ onSelectionChange }: FileUploadDemoProps) {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (files: File[]) => {
        setUploading(true);
        try {
            // 1. Get Signature
            const signRes = await fetch("/api/cloudinary-sign", { method: "POST" });
            const signData = await signRes.json();

            // 2. Upload Each File
            const newUploads: UploadedFile[] = [];

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
                        originalName: file.name
                    });
                }
            }

            setUploadedFiles(prev => [...prev, ...newUploads]);

            // Auto-select newly uploaded files
            const newSet = new Set(selectedIds);
            newUploads.forEach(u => newSet.add(u.url));
            setSelectedIds(newSet);
            onSelectionChange?.(Array.from(newSet));

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
        onSelectionChange?.(Array.from(newSet));
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {uploadedFiles.map((file, idx) => (
                        <div
                            key={idx}
                            onClick={() => toggleSelection(file.url)}
                            className={`relative group cursor-pointer border-2 rounded-xl overflow-hidden transition-all duration-200 ${selectedIds.has(file.url) ? "border-green-500 ring-2 ring-green-500/20" : "border-gray-800 hover:border-gray-600"}`}
                        >
                            <img
                                src={file.url}
                                alt={file.originalName}
                                className="w-full h-32 object-cover"
                            />
                            <div className={`absolute top-2 right-2 p-1 rounded-full ${selectedIds.has(file.url) ? "bg-green-500 text-white" : "bg-black/50 text-white/50"}`}>
                                <CheckCircle className="w-4 h-4" />
                            </div>
                            <div className="absolute bottom-0 w-full bg-black/60 p-2 text-xs truncate text-gray-300">
                                {file.originalName}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
