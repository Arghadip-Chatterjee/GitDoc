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

        const analysis = await prisma.analysis.findFirst({
            where: {
                id: params.id,
                userId: userId // Ensure user can only access their own documents
            },
            include: {
                repository: true,
                diagrams: true,
                reports: true
            }
        });

        if (!analysis) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        return NextResponse.json({ analysis });

    } catch (error: any) {
        console.error("Fetch analysis error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch document" },
            { status: 500 }
        );
    }
}
