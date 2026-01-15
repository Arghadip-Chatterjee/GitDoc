import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
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

        const userId = params.userId;

        // Fetch detailed user information
        const userDetails = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                isAdmin: true,
                documentCredits: true,
                interviewCredits: true,
                documentCreditsResetAt: true,
                interviewCreditsResetAt: true,
                createdAt: true,
                updatedAt: true,
                analyses: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        repository: {
                            select: {
                                name: true,
                                url: true
                            }
                        }
                    }
                },
                interviews: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        repository: {
                            select: {
                                name: true,
                                url: true
                            }
                        }
                    }
                }
            }
        });

        if (!userDetails) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(userDetails);

    } catch (error: any) {
        console.error("User details error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch user details" },
            { status: 500 }
        );
    }
}
