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

        const userId = (session.user as any).id;

        const interviews = await prisma.interview.findMany({
            where: { userId },
            include: {
                repository: true,
                feedback: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ interviews });

    } catch (error: any) {
        console.error("Fetch interviews error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch interviews" },
            { status: 500 }
        );
    }
}
