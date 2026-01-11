import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;

        // Check if user is admin
        if (!user.isAdmin) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // Fetch system-wide statistics
        const [
            totalUsers,
            totalAnalyses,
            totalInterviews,
            completedAnalyses,
            completedInterviews,
            recentUsers,
            recentAnalyses,
            recentInterviews
        ] = await Promise.all([
            prisma.user.count(),
            prisma.analysis.count(),
            prisma.interview.count(),
            prisma.analysis.count({ where: { status: 'completed' } }),
            prisma.interview.count({ where: { status: 'completed' } }),
            prisma.user.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    isAdmin: true,
                    createdAt: true,
                    _count: {
                        select: {
                            analyses: true,
                            interviews: true
                        }
                    }
                }
            }),
            prisma.analysis.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    repository: true,
                    user: {
                        select: {
                            email: true,
                            name: true
                        }
                    }
                }
            }),
            prisma.interview.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    repository: true,
                    user: {
                        select: {
                            email: true,
                            name: true
                        }
                    }
                }
            })
        ]);

        return NextResponse.json({
            stats: {
                totalUsers,
                totalAnalyses,
                totalInterviews,
                completedAnalyses,
                completedInterviews,
                activeAnalyses: totalAnalyses - completedAnalyses,
                activeInterviews: totalInterviews - completedInterviews
            },
            recentUsers,
            recentAnalyses,
            recentInterviews
        });

    } catch (error: any) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch admin statistics" },
            { status: 500 }
        );
    }
}
