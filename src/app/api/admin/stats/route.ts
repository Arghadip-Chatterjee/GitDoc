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
            recentInterviews,
            allUsersWithCredits
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
            }),
            // Fetch all users with credit information
            prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    isAdmin: true,
                    documentCredits: true,
                    interviewCredits: true,
                    documentCreditsResetAt: true,
                    interviewCreditsResetAt: true,
                    createdAt: true
                }
            })
        ]);

        // Calculate time until reset for each user
        const now = Date.now();
        const userCredits = allUsersWithCredits.map(user => {
            const documentTimeUntilReset = user.documentCreditsResetAt
                ? Math.max(0, user.documentCreditsResetAt.getTime() - now)
                : null;
            const interviewTimeUntilReset = user.interviewCreditsResetAt
                ? Math.max(0, user.interviewCreditsResetAt.getTime() - now)
                : null;

            return {
                id: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.isAdmin,
                documentCredits: user.documentCredits,
                interviewCredits: user.interviewCredits,
                documentCreditsResetAt: user.documentCreditsResetAt,
                interviewCreditsResetAt: user.interviewCreditsResetAt,
                documentTimeUntilReset,
                interviewTimeUntilReset,
                createdAt: user.createdAt
            };
        });

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
            recentInterviews,
            userCredits
        });

    } catch (error: any) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch admin statistics" },
            { status: 500 }
        );
    }
}
