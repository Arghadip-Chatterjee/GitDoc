import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { isEmail } from "@/lib/validation";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                identifier: { label: "Email or Mobile", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                // Determine if identifier is email or mobile
                const isEmailLogin = isEmail(credentials.identifier);

                // Query user by email or mobile
                const user = await prisma.user.findUnique({
                    where: isEmailLogin
                        ? { email: credentials.identifier }
                        : { mobile: credentials.identifier }
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid credentials");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    isAdmin: user.isAdmin,
                    emailVerified: user.emailVerified
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.isAdmin = (user as any).isAdmin;
                token.emailVerified = (user as any).emailVerified;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).isAdmin = token.isAdmin;
                (session.user as any).emailVerified = token.emailVerified;
            }
            return session;
        }
    },
    pages: {
        signIn: "/auth/signin",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
