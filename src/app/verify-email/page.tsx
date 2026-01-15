"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    const verifyEmail = useCallback(async () => {
        try {
            const res = await fetch(`/api/auth/verify-email?token=${token}`);
            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage(data.message || "Email verified successfully!");

                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    router.push("/dashboard");
                }, 3000);
            } else {
                setStatus("error");
                setMessage(data.error || "Verification failed");
            }
        } catch (error) {
            setStatus("error");
            setMessage("Something went wrong. Please try again.");
        }
    }, [token, router]);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link. Please check your email for the correct link.");
            return;
        }

        verifyEmail();
    }, [token, verifyEmail]);



    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 text-center">
                    {status === "loading" && (
                        <>
                            <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white mb-2">Verifying Email...</h1>
                            <p className="text-white/60">Please wait while we verify your email address.</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", duration: 0.5 }}
                            >
                                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            </motion.div>
                            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
                            <p className="text-white/60 mb-6">{message}</p>
                            <p className="text-sm text-white/40">Redirecting to dashboard...</p>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
                            <p className="text-white/60 mb-6">{message}</p>

                            <div className="space-y-3">
                                <Link
                                    href="/dashboard"
                                    className="block w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-white/90 transition-colors"
                                >
                                    Go to Dashboard
                                </Link>
                                <Link
                                    href="/auth/signin"
                                    className="block w-full bg-white/10 text-white font-semibold py-3 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
                <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
