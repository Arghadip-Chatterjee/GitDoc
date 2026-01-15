"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ArrowLeft } from "lucide-react";
import BookViewer from "@/components/BookViewer";

export default function DocumentViewerPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDocument = useCallback(async () => {
        try {
            const res = await fetch(`/api/analysis/${params.id}`);
            if (!res.ok) throw new Error("Document not found");
            const data = await res.json();
            setAnalysis(data.analysis);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (status === "authenticated" && params.id) {
            fetchDocument();
        }
    }, [status, params.id, fetchDocument, router]);

    // Redirect to doc page for resume if document is still processing
    useEffect(() => {
        if (analysis && analysis.status === "processing") {
            router.push(`/doc?resumeId=${params.id}`);
        }
    }, [analysis, params.id, router]);

    if (loading || status === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || "Document not found"}</p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="text-purple-400 hover:text-purple-300"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Check if document is completed and has a report
    const hasReport = analysis?.reports && analysis.reports.length > 0;

    if (!hasReport) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>

                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-8 text-center">
                        <p className="text-neutral-400">
                            {analysis.status === 'processing'
                                ? `Document generation in progress (Step ${analysis.step}/4)...`
                                : 'Document not yet completed.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Parse the report into book format
    let bookData;
    try {
        // The report markdown field contains JSON book data
        const reportData = JSON.parse(analysis.reports[0].markdown);
        bookData = reportData;
    } catch (e) {
        // Fallback: if it's not JSON, treat as plain markdown and create a single chapter
        bookData = {
            title: analysis.repository.name,
            chapters: [{
                title: "Documentation",
                content: analysis.reports[0].markdown
            }]
        };
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-8">
            <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors max-w-6xl mx-auto"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </button>

            <BookViewer bookData={bookData} repoDetails={null} analysisId={params.id as string} />
        </div>
    );
}
