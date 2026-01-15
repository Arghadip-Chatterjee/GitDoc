import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signupSchema, normalizeMobile } from "@/lib/validation";
import { ZodError } from "zod";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate input with Zod
        const validatedData = signupSchema.parse(body);
        const { email, mobile, name, password } = validatedData;

        // Normalize mobile number (remove spaces/dashes)
        const normalizedMobile = normalizeMobile(mobile);

        // Check if email already exists
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUserByEmail) {
            return NextResponse.json(
                {
                    error: "Email already registered",
                    field: "email"
                },
                { status: 400 }
            );
        }

        // Check if mobile number already exists
        const existingUserByMobile = await prisma.user.findUnique({
            where: { mobile: normalizedMobile }
        });

        if (existingUserByMobile) {
            return NextResponse.json(
                {
                    error: "Mobile number already registered",
                    field: "mobile"
                },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if this is the admin email
        const isAdmin = email === process.env.ADMIN_EMAIL;

        // Generate email verification token
        const { generateEmailVerificationToken } = await import("@/lib/tokens");
        const { sendVerificationEmail } = await import("@/lib/email");
        const { token: verificationToken, expires: verificationExpires } = generateEmailVerificationToken();

        console.log("Generated verification token:", verificationToken);
        console.log("Token expires at:", verificationExpires);

        // Create new user
        const user = await prisma.user.create({
            data: {
                email,
                mobile: normalizedMobile,
                name: name || null,
                password: hashedPassword,
                isAdmin,
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationExpires
            }
        });

        console.log("User created with token:", user.emailVerificationToken);

        // Send verification email (don't block signup if email fails)
        try {
            await sendVerificationEmail(user.email, verificationToken, user.name);
            console.log("Verification email sent successfully");
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            // Continue with signup even if email fails
        }

        return NextResponse.json({
            message: "Account created successfully! Please check your email to verify your account.",
            user: {
                id: user.id,
                email: user.email,
                mobile: user.mobile,
                name: user.name,
                isAdmin: user.isAdmin,
                emailVerified: user.emailVerified
            }
        });

    } catch (error: any) {
        // Handle Zod validation errors
        if (error instanceof ZodError) {
            const firstError = error.issues?.[0];
            return NextResponse.json(
                {
                    error: firstError?.message || "Validation error",
                    field: firstError?.path?.[0] || "unknown",
                    details: error.issues
                },
                { status: 400 }
            );
        }

        console.error("Signup error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create user" },
            { status: 500 }
        );
    }
}
