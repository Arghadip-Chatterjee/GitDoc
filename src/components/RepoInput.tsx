"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface RepoInputProps {
    onAnalyze: (url: string) => void;
    isLoading: boolean;
}

export default function RepoInput({ onAnalyze, isLoading }: RepoInputProps) {
    const [url, setUrl] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onAnalyze(url);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-1">
            <form onSubmit={handleSubmit} className="relative group">
                <div className="relative flex items-center bg-black rounded-xl p-2 md:p-3 border border-white/20 group-hover:border-blue-500/50 transition-colors duration-300 shadow-lg shadow-black/50">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
                        <Search className={`w-6 h-6 transition-colors duration-300 ${isFocused ? "text-blue-400" : "text-gray-500"}`} />
                    </div>

                    <input
                        type="text"
                        className="block w-full p-4 pl-14 text-lg text-white bg-transparent border-none rounded-xl focus:ring-0 placeholder-gray-600 font-mono"
                        placeholder="Paste GitHub Repository URL..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={isLoading}
                        autoFocus
                        required
                    />

                    <button
                        type="submit"
                        disabled={isLoading || !url.trim()}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all duration-300 transform border border-transparent
                            ${url.trim() && !isLoading
                                ? "bg-blue-600 hover:bg-blue-500 border-blue-400/20 shadow-lg hover:scale-105"
                                : "bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed"}`}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                <span className="font-mono">ANALYZING...</span>
                            </div>
                        ) : (
                            <span className="font-mono tracking-wide">GENERATE</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
