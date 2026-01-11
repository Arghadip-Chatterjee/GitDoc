import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if this is the admin email
        const isAdmin = email === process.env.ADMIN_EMAIL;

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name: name || null,
                password: hashedPassword,
                isAdmin
            }
        });

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.isAdmin
            }
        });

    } catch (error: any) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create user" },
            { status: 500 }
        );
    }
}
