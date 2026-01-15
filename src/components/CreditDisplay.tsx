"use client";

import { useEffect, useState } from "react";
import { Clock, FileText, MessageSquare, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface CreditStatus {
    isAdmin: boolean;
    documentCredits: number;
    interviewCredits: number;
    documentCreditsResetAt: string | null;
    interviewCreditsResetAt: string | null;
    documentTimeUntilReset: number | null;
    interviewTimeUntilReset: number | null;
}

export default function CreditDisplay() {
    const [credits, setCredits] = useState<CreditStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [documentTimeLeft, setDocumentTimeLeft] = useState<string>("");
    const [interviewTimeLeft, setInterviewTimeLeft] = useState<string>("");

    useEffect(() => {
        fetchCredits();
        // Refresh credits every 30 seconds
        const interval = setInterval(fetchCredits, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!credits) return;

        const updateTimers = () => {
            if (credits.documentTimeUntilReset) {
                const now = Date.now();
                const resetTime = new Date(credits.documentCreditsResetAt!).getTime();
                const remaining = Math.max(0, resetTime - now);
                setDocumentTimeLeft(formatTimeRemaining(remaining));
            } else {
                setDocumentTimeLeft("");
            }

            if (credits.interviewTimeUntilReset) {
                const now = Date.now();
                const resetTime = new Date(credits.interviewCreditsResetAt!).getTime();
                const remaining = Math.max(0, resetTime - now);
                setInterviewTimeLeft(formatTimeRemaining(remaining));
            } else {
                setInterviewTimeLeft("");
            }
        };

        updateTimers();
        const interval = setInterval(updateTimers, 1000);
        return () => clearInterval(interval);
    }, [credits]);

    const fetchCredits = async () => {
        try {
            const response = await fetch("/api/user/credits");
            if (response.ok) {
                const data = await response.json();
                setCredits(data);
            }
        } catch (error) {
            console.error("Failed to fetch credits:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeRemaining = (ms: number): string => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    if (loading) {
        return (
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
            </div>
        );
    }

    if (!credits || credits.isAdmin) {
        return null; // Don't show credit display for admins
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-hidden"
        >
            {/* Background glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent -mr-16 -mt-16 rounded-full blur-2xl"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-bold text-white">Usage Credits</h3>
                </div>

                <div className="space-y-4">
                    {/* Document Credits */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-gray-400">Documents</span>
                            </div>
                            <span className="text-sm font-mono text-white">
                                {credits.documentCredits}/2
                            </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(credits.documentCredits / 2) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className={`h-full ${credits.documentCredits === 0
                                        ? "bg-red-500"
                                        : credits.documentCredits === 1
                                            ? "bg-yellow-500"
                                            : "bg-purple-500"
                                    }`}
                            />
                        </div>
                        {credits.documentCredits === 0 && documentTimeLeft && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>Resets in {documentTimeLeft}</span>
                            </div>
                        )}
                    </div>

                    {/* Interview Credits */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-gray-400">Interviews</span>
                            </div>
                            <span className="text-sm font-mono text-white">
                                {credits.interviewCredits}/2
                            </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(credits.interviewCredits / 2) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className={`h-full ${credits.interviewCredits === 0
                                        ? "bg-red-500"
                                        : credits.interviewCredits === 1
                                            ? "bg-yellow-500"
                                            : "bg-blue-500"
                                    }`}
                            />
                        </div>
                        {credits.interviewCredits === 0 && interviewTimeLeft && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>Resets in {interviewTimeLeft}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info message */}
                {(credits.documentCredits === 0 || credits.interviewCredits === 0) && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-xs text-yellow-400">
                            Credits automatically reset 48 hours after first use
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
