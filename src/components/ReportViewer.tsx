"use client";


import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ReportViewer({ report }: { report: string }) {
    if (!report) return null;

    return (
        <div className="w-full max-w-5xl mx-auto mt-12 p-8 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-700">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <h2 className="ml-4 text-gray-400 font-mono text-sm">report.md</h2>
            </div>
            <div className="prose prose-invert max-w-none prose-headings:text-blue-400 prose-a:text-blue-300 font-sans text-sm leading-relaxed text-gray-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </div>
        </div>
    );
}
