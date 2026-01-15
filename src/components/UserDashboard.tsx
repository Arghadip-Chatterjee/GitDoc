"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, MessageSquare, Calendar, CheckCircle, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import CreditDisplay from "./CreditDisplay";
import EmailVerificationBanner from "./EmailVerificationBanner";

export default function UserDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creditStatus, setCreditStatus] = useState<any>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (status === "authenticated") {
            fetchData();
        }
    }, [status, router]);

    const fetchData = async () => {
        try {
            const [analysesRes, interviewsRes, creditsRes] = await Promise.all([
                fetch("/api/user/analyses"),
                fetch("/api/user/interviews"),
                fetch("/api/user/credits")
            ]);

            const analysesData = await analysesRes.json();
            const interviewsData = await interviewsRes.json();
            const creditsData = await creditsRes.json();

            setAnalyses(analysesData.analyses || []);
            setInterviews(interviewsData.interviews || []);
            setCreditStatus(creditsData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const BackgroundAnimation = () => {
        return (
            <div className="fixed inset-0 pointer-events-none -z-10">
                {/* Base Grid */}
                <div className="absolute inset-0 bg-black"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

                {/* Scanning Line */}
                <motion.div
                    className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent box-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    animate={{ top: ["0%", "100%"] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />

                {/* Random Flickering Grid Cells */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-purple-500/10 border border-purple-500/20"
                        style={{
                            width: 40,
                            height: 40,
                            left: `${Math.floor(Math.random() * 100)}%`,
                            top: `${Math.floor(Math.random() * 100)}%`,
                        }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, repeatDelay: Math.random() * 5 }}
                    />
                ))}
            </div>
        );
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen text-white p-8 pt-24 relative overflow-hidden">
            <BackgroundAnimation />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 border-b border-white/10 pb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Command Center
                        </h1>
                        {(session.user as any)?.emailVerified && (
                            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-xs font-medium text-green-400">Verified</span>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Welcome back, <span className="text-white font-mono">{session.user?.name || session.user?.email}</span>
                    </p>
                </motion.div>

                {/* Email Verification Banner */}
                {session?.user && !(session.user as any).emailVerified && (
                    <EmailVerificationBanner userEmail={(session.user as any).email} />
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group bg-black/40 backdrop-blur-md border border-white/10 hover:border-purple-500/50 transition-colors rounded-xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Total Docs</p>
                                <p className="text-3xl font-bold text-white font-mono">{analyses.length}</p>
                            </div>
                            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <FileText className="w-6 h-6 text-purple-400" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="group bg-black/40 backdrop-blur-md border border-white/10 hover:border-blue-500/50 transition-colors rounded-xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Interviews</p>
                                <p className="text-3xl font-bold text-white font-mono">{interviews.length}</p>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <MessageSquare className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="group bg-black/40 backdrop-blur-md border border-white/10 hover:border-green-500/50 transition-colors rounded-xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Completed</p>
                                <p className="text-3xl font-bold text-white font-mono">
                                    {analyses.filter(a => a.status === 'completed').length +
                                        interviews.filter(i => i.status === 'completed').length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Credit Display Card */}
                    {!creditStatus?.isAdmin && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <CreditDisplay />
                        </motion.div>
                    )}
                </div>

                {/* Recent Documents */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-500" /> Recent Documents
                        </h2>
                        {creditStatus?.isAdmin || (creditStatus && creditStatus.documentCredits > 0) ? (
                            <Link href="/" className="px-4 py-2 text-xs font-mono text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/10 transition-colors flex items-center gap-2">
                                + CREATE NEW
                            </Link>
                        ) : (
                            <div className="relative group">
                                <button
                                    disabled
                                    className="px-4 py-2 text-xs font-mono text-gray-600 border border-gray-800 rounded-lg cursor-not-allowed flex items-center gap-2"
                                >
                                    + CREATE NEW
                                </button>
                                <div className="absolute bottom-full mb-2 right-0 hidden group-hover:block w-48 p-2 bg-black border border-red-500/30 rounded-lg text-xs text-red-400">
                                    No document credits available
                                </div>
                            </div>
                        )}
                    </div>

                    {analyses.length === 0 ? (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-12 text-center">
                            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500">No documents generated yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {analyses.slice(0, 6).map((analysis, i) => (
                                <Link key={analysis.id} href={`/document/${analysis.id}`}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group h-full bg-black/40 border border-white/10 hover:border-purple-500/50 rounded-xl p-5 transition-all hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/5 to-transparent -mr-10 -mt-10 rounded-full blur-xl group-hover:from-purple-500/20 transition-colors"></div>

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-white/5 rounded-lg border border-white/5 group-hover:border-purple-500/30 transition-colors">
                                                <FileText className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                            </div>
                                            <span className={`text-[10px] font-mono px-2 py-1 rounded border ${analysis.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                analysis.status === 'processing' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    'bg-gray-800 text-gray-400 border-gray-700'
                                                }`}>
                                                {analysis.status}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-white mb-2 truncate pr-4">{analysis.repository.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono mb-4 flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> {new Date(analysis.createdAt).toLocaleDateString()}
                                        </p>

                                        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                            <div className="h-full bg-purple-500 w-3/4 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Interviews */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-gray-500" /> Recent Interviews
                        </h2>
                        {creditStatus?.isAdmin || (creditStatus && creditStatus.interviewCredits > 0) ? (
                            <Link href="/interview" className="px-4 py-2 text-xs font-mono text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors flex items-center gap-2">
                                + START NEW
                            </Link>
                        ) : (
                            <div className="relative group">
                                <button
                                    disabled
                                    className="px-4 py-2 text-xs font-mono text-gray-600 border border-gray-800 rounded-lg cursor-not-allowed flex items-center gap-2"
                                >
                                    + START NEW
                                </button>
                                <div className="absolute bottom-full mb-2 right-0 hidden group-hover:block w-48 p-2 bg-black border border-red-500/30 rounded-lg text-xs text-red-400">
                                    No interview credits available
                                </div>
                            </div>
                        )}
                    </div>

                    {interviews.length === 0 ? (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-12 text-center">
                            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500">No interviews started yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {interviews.slice(0, 6).map((interview, i) => (
                                <Link key={interview.id} href={`/interview/${interview.id}`}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group h-full bg-black/40 border border-white/10 hover:border-blue-500/50 rounded-xl p-5 transition-all hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/5 to-transparent -mr-10 -mt-10 rounded-full blur-xl group-hover:from-blue-500/20 transition-colors"></div>

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-white/5 rounded-lg border border-white/5 group-hover:border-blue-500/30 transition-colors">
                                                <MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                            </div>
                                            <span className={`text-[10px] font-mono px-2 py-1 rounded border ${interview.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                interview.status === 'active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-gray-800 text-gray-400 border-gray-700'
                                                }`}>
                                                {interview.status}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-white mb-2 truncate pr-4">{interview.repository.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono mb-4 flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> {interview.duration ? `${Math.floor(interview.duration / 60)}m ${interview.duration % 60}s` : 'In progress'}
                                        </p>

                                        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                            <div className="h-full bg-blue-500 w-1/2 opacity-50 group-hover:opacity-100 transition-opacity"></div>
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
