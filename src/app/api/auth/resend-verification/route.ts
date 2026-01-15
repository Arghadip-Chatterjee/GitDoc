import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateEmailVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
    const now = Date.now();
    const limit = rateLimitMap.get(email);

    if (!limit || now > limit.resetAt) {
        // Reset or create new limit
        rateLimitMap.set(email, {
            count: 1,
            resetAt: now + 60 * 60 * 1000 // 1 hour
        });
        return true;
    }

    if (limit.count >= 3) {
        return false; // Rate limit exceeded
    }

    limit.count++;
    return true;
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userEmail = (session.user as any).email;

        // Check rate limit
        if (!checkRateLimit(userEmail)) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json(
                { message: "Email is already verified" },
                { status: 200 }
            );
        }

        // Generate new verification OTP
        const { token, expires } = generateEmailVerificationToken();

        // Update user with new OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken: token,
                emailVerificationExpires: expires
            }
        });

        // Send verification email
        await sendVerificationEmail(user.email, token, user.name);

        return NextResponse.json({
            message: "Verification code sent successfully"
        });

    } catch (error: any) {
        console.error("Resend verification error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to resend verification email" },
            { status: 500 }
        );
    }
}
