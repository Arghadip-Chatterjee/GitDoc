"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, FileText, MessageSquare, CheckCircle, Clock, Shield, Loader2, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
    const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
    const [userCredits, setUserCredits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state for Recent Actions
    const [actionsPage, setActionsPage] = useState(1);
    const actionsPerPage = 5;

    // Expanded user details
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [loadingUserDetails, setLoadingUserDetails] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (status === "authenticated") {
            const user = session.user as any;
            if (!user.isAdmin) {
                router.push("/dashboard");
            } else {
                fetchAdminData();
            }
        }
    }, [status, session, router]);

    const fetchAdminData = async () => {
        try {
            const res = await fetch("/api/admin/stats");

            if (!res.ok) {
                throw new Error("Failed to fetch admin data");
            }

            const data = await res.json();
            setStats(data.stats);
            setRecentUsers(data.recentUsers || []);
            setRecentAnalyses(data.recentAnalyses || []);
            setRecentInterviews(data.recentInterviews || []);
            setUserCredits(data.userCredits || []);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (userId: string) => {
        setLoadingUserDetails(true);
        try {
            const res = await fetch(`/api/admin/user/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setUserDetails(data);
            }
        } catch (error) {
            console.error("Failed to fetch user details:", error);
        } finally {
            setLoadingUserDetails(false);
        }
    };

    const toggleUserExpand = (userId: string) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
            setUserDetails(null);
        } else {
            setExpandedUserId(userId);
            fetchUserDetails(userId);
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
                    className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent box-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    animate={{ top: ["0%", "100%"] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />

                {/* Random Flickering Grid Cells */}
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-red-500/10 border border-red-500/20"
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
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        );
    }

    if (!session || !(session.user as any).isAdmin) return null;

    return (
        <div className="min-h-screen text-white p-8 pt-24 relative overflow-hidden">
            <BackgroundAnimation />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 border-b border-white/10 pb-8 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                            <Shield className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Admin Console</h1>
                            <p className="text-gray-500 text-sm font-mono flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                SYSTEM_WIDE_MONITORING
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group bg-black/40 backdrop-blur-md border border-white/10 hover:border-blue-500/50 transition-colors rounded-xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 font-mono">Total Users</p>
                                <p className="text-3xl font-bold text-white font-mono">{stats?.totalUsers || 0}</p>
                            </div>
                            <Users className="w-10 h-10 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="group bg-black/40 backdrop-blur-md border border-white/10 hover:border-purple-500/50 transition-colors rounded-xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 font-mono">Documents</p>
                                <p className="text-3xl font-bold text-white font-mono">{stats?.totalAnalyses || 0}</p>
                                <p className="text-[10px] text-green-400 mt-1 font-mono">{stats?.completedAnalyses || 0} COMPLETED</p>
                            </div>
                            <FileText className="w-10 h-10 text-purple-500/50 group-hover:text-purple-400 transition-colors" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="group bg-black/40 backdrop-blur-md border border-white/10 hover:border-indigo-500/50 transition-colors rounded-xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 font-mono">Interviews</p>
                                <p className="text-3xl font-bold text-white font-mono">{stats?.totalInterviews || 0}</p>
                                <p className="text-[10px] text-green-400 mt-1 font-mono">{stats?.completedInterviews || 0} COMPLETED</p>
                            </div>
                            <MessageSquare className="w-10 h-10 text-indigo-500/50 group-hover:text-indigo-400 transition-colors" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="group bg-black/40 backdrop-blur-md border border-white/10 hover:border-yellow-500/50 transition-colors rounded-xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 font-mono">Active Tasks</p>
                                <p className="text-3xl font-bold text-white font-mono">
                                    {(stats?.activeAnalyses || 0) + (stats?.activeInterviews || 0)}
                                </p>
                                <p className="text-[10px] text-yellow-400 mt-1 font-mono">RUNNING NOW</p>
                            </div>
                            <Clock className="w-10 h-10 text-yellow-500/50 group-hover:text-yellow-400 transition-colors" />
                        </div>
                    </motion.div>
                </div>

                {/* Main Content Area Details */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Recent Users Table */}
                    <div className="xl:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-500" /> Recent User Activity
                            </h2>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider">Docs</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider">Interviews</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {recentUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center mr-3 border border-white/10">
                                                            <span className="text-xs font-bold">{user.name?.[0] || user.email[0].toUpperCase()}</span>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{user.name || 'N/A'}</div>
                                                            <div className="text-xs text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {user.isAdmin ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-yellow-500/20 text-[10px] font-mono bg-yellow-500/10 text-yellow-400">
                                                            <Shield className="w-3 h-3" /> ADMIN
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded border border-gray-700 text-[10px] font-mono bg-gray-800 text-gray-400">USER</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">{user._count.analyses}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">{user._count.interviews}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="space-y-8">
                        {/* Documents Feed */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-500" /> Recent Actions
                                </h2>
                            </div>

                            {/* Combined Actions List */}
                            <div className="space-y-4">
                                {(() => {
                                    // Combine and sort all actions
                                    const allActions = [
                                        ...recentAnalyses.map(a => ({ ...a, type: 'analysis' })),
                                        ...recentInterviews.map(i => ({ ...i, type: 'interview' }))
                                    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                                    const totalPages = Math.ceil(allActions.length / actionsPerPage);
                                    const startIndex = (actionsPage - 1) * actionsPerPage;
                                    const paginatedActions = allActions.slice(startIndex, startIndex + actionsPerPage);

                                    return (
                                        <>
                                            {paginatedActions.map((action, i) => (
                                                <motion.div
                                                    key={action.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className={`bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:border-${action.type === 'analysis' ? 'purple' : 'indigo'}-500/30 transition-colors group`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 bg-${action.type === 'analysis' ? 'purple' : 'indigo'}-500/10 rounded-lg border border-${action.type === 'analysis' ? 'purple' : 'indigo'}-500/20 mt-1`}>
                                                            {action.type === 'analysis' ? (
                                                                <FileText className="w-4 h-4 text-purple-400" />
                                                            ) : (
                                                                <MessageSquare className="w-4 h-4 text-indigo-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className={`text-[10px] font-mono px-1.5 rounded border ${action.status === 'completed'
                                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                    : action.status === 'processing'
                                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                                    }`}>
                                                                    {action.status}
                                                                </span>
                                                                <span className="text-[10px] text-gray-600 font-mono">
                                                                    {new Date(action.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <h4 className={`text-sm font-medium text-white truncate group-hover:text-${action.type === 'analysis' ? 'purple' : 'indigo'}-400 transition-colors`}>
                                                                {action.repository.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                                User: {action.user?.email || 'Unknown'}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className={`text-[9px] px-2 py-0.5 rounded-full ${action.type === 'analysis'
                                                                    ? 'bg-purple-500/10 text-purple-400'
                                                                    : 'bg-indigo-500/10 text-indigo-400'
                                                                    }`}>
                                                                    {action.type === 'analysis' ? 'DOCUMENT' : 'INTERVIEW'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}

                                            {/* Pagination Controls */}
                                            {totalPages > 1 && (
                                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                                                    <div className="text-xs text-gray-500 font-mono">
                                                        Page {actionsPage} of {totalPages} ({allActions.length} total)
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setActionsPage(p => Math.max(1, p - 1))}
                                                            disabled={actionsPage === 1}
                                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                                        >
                                                            <ChevronLeft className="w-3 h-3" /> Prev
                                                        </button>
                                                        <button
                                                            onClick={() => setActionsPage(p => Math.min(totalPages, p + 1))}
                                                            disabled={actionsPage === totalPages}
                                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                                        >
                                                            Next <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Credits Monitoring Section */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-500" /> User Credit Status
                        </h2>
                    </div>
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider">Doc Credits</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider">Doc Cooldown</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider">Interview Credits</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-mono font-medium text-gray-400 uppercase tracking-wider">Interview Cooldown</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {userCredits.map((user) => {
                                        const formatTimeRemaining = (ms: number | null) => {
                                            if (!ms) return "N/A";
                                            const hours = Math.floor(ms / (1000 * 60 * 60));
                                            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
                                            if (hours > 0) return `${hours}h ${minutes}m`;
                                            return `${minutes}m`;
                                        };

                                        const isExpanded = expandedUserId === user.id;

                                        return (
                                            <>
                                                <tr
                                                    key={user.id}
                                                    onClick={() => toggleUserExpand(user.id)}
                                                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                                            )}
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center border border-white/10">
                                                                <span className="text-xs font-bold">{user.name?.[0] || user.email[0].toUpperCase()}</span>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{user.name || 'N/A'}</div>
                                                                <div className="text-xs text-gray-500">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {user.isAdmin ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-yellow-500/20 text-[10px] font-mono bg-yellow-500/10 text-yellow-400">
                                                                <Shield className="w-3 h-3" /> ADMIN
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded border border-gray-700 text-[10px] font-mono bg-gray-800 text-gray-400">USER</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {user.isAdmin ? (
                                                            <span className="text-sm font-mono text-green-400">∞</span>
                                                        ) : (
                                                            <span className={`text-sm font-mono font-bold ${user.documentCredits === 0 ? 'text-red-400' :
                                                                user.documentCredits === 1 ? 'text-yellow-400' :
                                                                    'text-green-400'
                                                                }`}>
                                                                {user.documentCredits}/2
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {user.isAdmin ? (
                                                            <span className="text-xs text-gray-600 font-mono">-</span>
                                                        ) : user.documentCredits === 0 && user.documentTimeUntilReset ? (
                                                            <span className="text-xs text-red-400 font-mono">
                                                                {formatTimeRemaining(user.documentTimeUntilReset)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-600 font-mono">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {user.isAdmin ? (
                                                            <span className="text-sm font-mono text-green-400">∞</span>
                                                        ) : (
                                                            <span className={`text-sm font-mono font-bold ${user.interviewCredits === 0 ? 'text-red-400' :
                                                                user.interviewCredits === 1 ? 'text-yellow-400' :
                                                                    'text-green-400'
                                                                }`}>
                                                                {user.interviewCredits}/2
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {user.isAdmin ? (
                                                            <span className="text-xs text-gray-600 font-mono">-</span>
                                                        ) : user.interviewCredits === 0 && user.interviewTimeUntilReset ? (
                                                            <span className="text-xs text-red-400 font-mono">
                                                                {formatTimeRemaining(user.interviewTimeUntilReset)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-600 font-mono">-</span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {/* Expanded Details Row */}
                                                {isExpanded && (
                                                    <tr className="bg-white/5">
                                                        <td colSpan={6} className="px-6 py-6">
                                                            {loadingUserDetails ? (
                                                                <div className="flex items-center justify-center py-8">
                                                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                                                </div>
                                                            ) : userDetails ? (
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                                                            <FileText className="w-4 h-4 text-purple-400" />
                                                                            Documents ({userDetails.analyses?.length || 0})
                                                                        </h4>
                                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                                            {userDetails.analyses?.length > 0 ? (
                                                                                userDetails.analyses.map((analysis: any) => (
                                                                                    <div key={analysis.id} className="bg-black/40 border border-white/10 rounded-lg p-3">
                                                                                        <div className="flex items-center justify-between mb-1">
                                                                                            <span className="text-xs font-medium text-white truncate">{analysis.repository.name}</span>
                                                                                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${analysis.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                                                                                }`}>
                                                                                                {analysis.status}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="text-[10px] text-gray-500 font-mono">
                                                                                            {new Date(analysis.createdAt).toLocaleString()}
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="text-xs text-gray-600 text-center py-4">No documents generated</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                                                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                                                                            Interviews ({userDetails.interviews?.length || 0})
                                                                        </h4>
                                                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                                                            {userDetails.interviews?.length > 0 ? (
                                                                                userDetails.interviews.map((interview: any) => (
                                                                                    <div key={interview.id} className="bg-black/40 border border-white/10 rounded-lg p-3">
                                                                                        <div className="flex items-center justify-between mb-1">
                                                                                            <span className="text-xs font-medium text-white truncate">{interview.repository.name}</span>
                                                                                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${interview.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                                                                                }`}>
                                                                                                {interview.status}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="text-[10px] text-gray-500 font-mono">
                                                                                            {new Date(interview.createdAt).toLocaleString()}
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="text-xs text-gray-600 text-center py-4">No interviews conducted</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-gray-600 text-center py-4">Failed to load user details</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
