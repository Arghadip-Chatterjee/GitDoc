import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: "User ID required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                emailVerified: true,
                emailVerificationToken: true,
                emailVerificationExpires: true,
                createdAt: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                ...user,
                tokenLength: user.emailVerificationToken?.length || 0,
                hasToken: !!user.emailVerificationToken,
                tokenPreview: user.emailVerificationToken?.substring(0, 20) + "..."
            }
        });

    } catch (error: any) {
        console.error("Debug error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
