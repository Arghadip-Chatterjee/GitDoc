import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isTokenExpired } from "@/lib/tokens";

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: "Email and verification code are required" },
                { status: 400 }
            );
        }

        // Normalize OTP (remove spaces, convert to string)
        const normalizedOTP = otp.toString().replace(/\s/g, '');

        console.log("Verifying OTP:", normalizedOTP, "for email:", email);

        // Find user with this email and OTP
        const user = await prisma.user.findFirst({
            where: {
                email,
                emailVerificationToken: normalizedOTP,
                emailVerified: false
            }
        });

        console.log("User found:", user ? `Yes (${user.email})` : "No");

        if (!user) {
            return NextResponse.json(
                { error: "Invalid verification code or email" },
                { status: 400 }
            );
        }

        // Check if token has expired
        if (isTokenExpired(user.emailVerificationExpires)) {
            return NextResponse.json(
                { error: "Verification code has expired. Please request a new one." },
                { status: 400 }
            );
        }

        // Verify the email
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null
            }
        });

        return NextResponse.json({
            message: "Email verified successfully!",
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error: any) {
        console.error("Email verification error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to verify email" },
            { status: 500 }
        );
    }
}
