"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, FileText, MessageSquare, CheckCircle, Clock, Shield, Loader2, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
    const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
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

    if (!session || !(session.user as any).isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center gap-3">
                    <Shield className="w-10 h-10 text-yellow-500" />
                    <div>
                        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                        <p className="text-neutral-400">System-wide statistics and management</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-400 text-sm">Total Users</p>
                                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                            </div>
                            <Users className="w-12 h-12 text-blue-500 opacity-50" />
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
                                <p className="text-neutral-400 text-sm">Total Documents</p>
                                <p className="text-3xl font-bold">{stats?.totalAnalyses || 0}</p>
                                <p className="text-xs text-green-400 mt-1">{stats?.completedAnalyses || 0} completed</p>
                            </div>
                            <FileText className="w-12 h-12 text-purple-500 opacity-50" />
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
                                <p className="text-neutral-400 text-sm">Total Interviews</p>
                                <p className="text-3xl font-bold">{stats?.totalInterviews || 0}</p>
                                <p className="text-xs text-green-400 mt-1">{stats?.completedInterviews || 0} completed</p>
                            </div>
                            <MessageSquare className="w-12 h-12 text-indigo-500 opacity-50" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-neutral-400 text-sm">Active Tasks</p>
                                <p className="text-3xl font-bold">
                                    {(stats?.activeAnalyses || 0) + (stats?.activeInterviews || 0)}
                                </p>
                                <p className="text-xs text-yellow-400 mt-1">In progress</p>
                            </div>
                            <Clock className="w-12 h-12 text-yellow-500 opacity-50" />
                        </div>
                    </motion.div>
                </div>

                {/* Recent Users */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Recent Users</h2>
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Documents</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Interviews</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-700">
                                    {recentUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-neutral-800/30">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium">{user.name || 'N/A'}</div>
                                                    <div className="text-sm text-neutral-400">{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.isAdmin ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                                                        <Shield className="w-3 h-3" />
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-neutral-700 text-neutral-300">User</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{user._count.analyses}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{user._count.interviews}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Documents */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Recent Documents</h2>
                        <div className="space-y-3">
                            {recentAnalyses.slice(0, 5).map((analysis) => (
                                <motion.div
                                    key={analysis.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{analysis.repository.name}</h3>
                                            <p className="text-sm text-neutral-400">
                                                by {analysis.user?.name || analysis.user?.email || 'Anonymous'}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${analysis.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {analysis.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-xs text-neutral-500 mt-2">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(analysis.createdAt).toLocaleString()}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Interviews */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Recent Interviews</h2>
                        <div className="space-y-3">
                            {recentInterviews.slice(0, 5).map((interview) => (
                                <motion.div
                                    key={interview.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-700 rounded-xl p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{interview.repository.name}</h3>
                                            <p className="text-sm text-neutral-400">
                                                by {interview.user?.name || interview.user?.email || 'Anonymous'}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${interview.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {interview.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-xs text-neutral-500 mt-2">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(interview.createdAt).toLocaleString()}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
