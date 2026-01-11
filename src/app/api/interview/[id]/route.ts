import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const interview = await prisma.interview.findFirst({
            where: {
                id: params.id,
                userId: userId // Ensure user can only access their own interviews
            },
            include: {
                repository: true,
                feedback: true
            }
        });

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        return NextResponse.json({ interview });

    } catch (error: any) {
        console.error("Fetch interview error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch interview" },
            { status: 500 }
        );
    }
}
