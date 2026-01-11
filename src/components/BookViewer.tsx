"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, List } from "lucide-react";
import Image from "next/image";

interface Chapter {
    title: string;
    content: string;
}

interface BookData {
    title: string;
    chapters: Chapter[];
}

interface BookViewerProps {
    bookData: BookData;
    repoDetails?: any;
}

export default function BookViewer({ bookData, repoDetails }: BookViewerProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [showTableOfContents, setShowTableOfContents] = useState(false);

    if (!bookData || !bookData.chapters || bookData.chapters.length === 0) {
        return <div className="text-gray-400 text-center p-8">No book data available.</div>;
    }

    const totalPages = bookData.chapters.length;
    const currentChapter = bookData.chapters[currentPage];

    const nextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto my-12 relative font-serif">
            {/* Book Cover / Header */}
            <div className="mb-8 text-center border-b border-gray-700 pb-8">
                <div className="flex items-center justify-center gap-4 mb-4 text-blue-400">
                    <BookOpen size={40} />
                    <h1 className="text-4xl font-bold tracking-wide">{bookData.title}</h1>
                </div>
                <p className="text-gray-500 italic">Automated Technical Documentation</p>
            </div>

            <div className="flex gap-8 relative">
                {/* Table of Contents Sidebar (collapsible) */}
                <AnimatePresence>
                    {showTableOfContents && (
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="w-64 flex-shrink-0 bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-6 h-fit sticky top-8"
                        >
                            <h3 className="text-xl font-bold text-gray-200 mb-6 font-sans">Contents</h3>
                            <ul className="space-y-3 font-sans text-sm">
                                {bookData.chapters.map((chapter, index) => (
                                    <li key={index}>
                                        <button
                                            onClick={() => {
                                                setCurrentPage(index);
                                                setShowTableOfContents(false); // Optional: close on select
                                            }}
                                            className={`text-left w-full hover:text-blue-400 transition-colors ${currentPage === index ? "text-blue-400 font-bold" : "text-gray-400"}`}
                                        >
                                            {index + 1}. {chapter.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toggle TOC Button (if hidden) */}
                {!showTableOfContents && (
                    <button
                        onClick={() => setShowTableOfContents(true)}
                        className="absolute -left-16 top-0 p-3 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-400 transition-colors"
                        title="Table of Contents"
                    >
                        <List size={20} />
                    </button>
                )}


                {/* Main Content Area (The Page) */}
                <div className="flex-1 min-h-[600px] bg-[#1a1b26] rounded-r-2xl rounded-l-md shadow-[20px_0_50px_rgba(0,0,0,0.5),-1px_0_2px_rgba(255,255,255,0.1)] border-r border-gray-800 p-12 relative overflow-hidden">
                    {/* Decorative Spine/Gutter Shadow */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

                    <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4 text-gray-500 font-sans text-sm uppercase tracking-widest">
                        <span>Chapter {currentPage + 1}</span>
                        <span>{currentChapter.title}</span>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-gray-100 prose-p:text-gray-300 prose-p:leading-8 prose-p:text-lg"
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    img: ({ node, ...props }) => {
                                        let src = props.src || "";
                                        // GitHub Raw URL Transformation
                                        if (src && !src.startsWith("http") && repoDetails) {
                                            const branch = repoDetails.default_branch || "main";
                                            const cleanSrc = src.startsWith("/") ? src.slice(1) : src;
                                            src = `https://raw.githubusercontent.com/${repoDetails.owner.login}/${repoDetails.name}/${branch}/${cleanSrc}`;
                                        }
                                        return <Image {...props} src={src} alt={props.alt || ""} width={800} height={600} className="rounded-lg shadow-lg border border-gray-700 max-w-full h-auto my-4 mx-auto" />;
                                    }
                                }}
                            >
                                {currentChapter.content}
                            </ReactMarkdown>
                        </motion.div>
                    </AnimatePresence>

                    {/* Page Number Footer */}
                    <div className="mt-16 pt-8 border-t border-gray-800 flex justify-between items-center text-gray-600 font-sans text-sm">
                        <span>{bookData.title}</span>
                        <span>Page {currentPage + 1} of {totalPages}</span>
                    </div>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-8 px-12">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-200 font-medium"
                >
                    <ChevronLeft size={20} /> Previous Chapter
                </button>

                <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages - 1}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white font-medium shadow-lg shadow-blue-500/20"
                >
                    Next Chapter <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
