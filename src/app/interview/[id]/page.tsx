"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ArrowLeft, Calendar, Clock, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function InterviewFeedbackPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [interview, setInterview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchInterview = useCallback(async () => {
        try {
            const res = await fetch(`/api/interview/${params.id}`);
            if (!res.ok) throw new Error("Interview not found");
            const data = await res.json();
            setInterview(data.interview);
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
            fetchInterview();
        }
    }, [status, params.id, fetchInterview, router]);



    if (loading || status === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    if (error || !interview) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || "Interview not found"}</p>
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>

                {/* Interview Info */}
                <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-6 mb-6">
                    <h1 className="text-3xl font-bold mb-4">{interview.repository.name}</h1>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-neutral-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(interview.createdAt).toLocaleDateString()}
                        </div>

                        <div className="flex items-center gap-2 text-neutral-400">
                            <Clock className="w-4 h-4" />
                            {interview.duration
                                ? `${Math.floor(interview.duration / 60)}m ${interview.duration % 60}s`
                                : "Duration not recorded"}
                        </div>

                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className={`px-2 py-1 rounded text-xs ${interview.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {interview.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Feedback */}
                {interview.feedback ? (
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-6">
                        <h2 className="text-2xl font-bold mb-4">Interview Feedback</h2>
                        <div className="prose prose-invert prose-lg max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {interview.feedback.feedback}
                            </ReactMarkdown>
                        </div>
                    </div>
                ) : (
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-8 text-center">
                        <p className="text-neutral-400">No feedback available for this interview yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
