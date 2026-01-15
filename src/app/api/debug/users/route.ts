import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Get all users with their verification tokens
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                emailVerified: true,
                emailVerificationToken: true,
                emailVerificationExpires: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        return NextResponse.json({
            count: users.length,
            users: users.map(u => ({
                ...u,
                tokenLength: u.emailVerificationToken?.length || 0,
                hasToken: !!u.emailVerificationToken
            }))
        });
    } catch (error: any) {
        console.error("Debug error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
