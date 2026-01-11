"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, MessageSquare, Calendar, CheckCircle, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function UserDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (status === "authenticated") {
            fetchData();
        }
    }, [status, router]);

    const fetchData = async () => {
        try {
            const [analysesRes, interviewsRes] = await Promise.all([
                fetch("/api/user/analyses"),
                fetch("/api/user/interviews")
            ]);

            const analysesData = await analysesRes.json();
            const interviewsData = await interviewsRes.json();

            setAnalyses(analysesData.analyses || []);
            setInterviews(interviewsData.interviews || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
                    <p className="text-neutral-400">Welcome back, {session.user?.name || session.user?.email}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-400 text-sm">Total Documents</p>
                                <p className="text-3xl font-bold">{analyses.length}</p>
                            </div>
                            <FileText className="w-12 h-12 text-purple-500 opacity-50" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-400 text-sm">Total Interviews</p>
                                <p className="text-3xl font-bold">{interviews.length}</p>
                            </div>
                            <MessageSquare className="w-12 h-12 text-indigo-500 opacity-50" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-400 text-sm">Completed</p>
                                <p className="text-3xl font-bold">
                                    {analyses.filter(a => a.status === 'completed').length +
                                        interviews.filter(i => i.status === 'completed').length}
                                </p>
                            </div>
                            <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
                        </div>
                    </motion.div>
                </div>

                {/* Recent Documents */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Recent Documents</h2>
                        <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm">
                            Create New →
                        </Link>
                    </div>

                    {analyses.length === 0 ? (
                        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-8 text-center">
                            <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                            <p className="text-neutral-400">No documents yet. Create your first one!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {analyses.slice(0, 6).map((analysis) => (
                                <Link
                                    key={analysis.id}
                                    href={`/document/${analysis.id}`}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-4 hover:border-purple-500 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold truncate">{analysis.repository.name}</h3>
                                            <span className={`text-xs px-2 py-1 rounded ${analysis.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                analysis.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-neutral-500/20 text-neutral-400'
                                                }`}>
                                                {analysis.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-400 mb-3">
                                            Step {analysis.step}/4
                                        </p>
                                        <div className="flex items-center text-xs text-neutral-500">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(analysis.createdAt).toLocaleDateString()}
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Interviews */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Recent Interviews</h2>
                        <Link href="/interview" className="text-purple-400 hover:text-purple-300 text-sm">
                            Start New →
                        </Link>
                    </div>

                    {interviews.length === 0 ? (
                        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-8 text-center">
                            <MessageSquare className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                            <p className="text-neutral-400">No interviews yet. Start your first one!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {interviews.slice(0, 6).map((interview) => (
                                <Link
                                    key={interview.id}
                                    href={`/interview/${interview.id}`}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-4 hover:border-indigo-500 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold truncate">{interview.repository.name}</h3>
                                            <span className={`text-xs px-2 py-1 rounded ${interview.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                interview.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-neutral-500/20 text-neutral-400'
                                                }`}>
                                                {interview.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-400 mb-3">
                                            {interview.duration ? `${Math.floor(interview.duration / 60)}m ${interview.duration % 60}s` : 'In progress'}
                                        </p>
                                        <div className="flex items-center text-xs text-neutral-500">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(interview.createdAt).toLocaleDateString()}
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
