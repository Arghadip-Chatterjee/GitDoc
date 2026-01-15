"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Loader2, CheckCircle } from "lucide-react";

interface EmailVerificationBannerProps {
    userEmail: string;
    onDismiss?: () => void;
}

export default function EmailVerificationBanner({ userEmail, onDismiss }: EmailVerificationBannerProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [dismissed, setDismissed] = useState(false);

    const handleResend = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 5000);
            } else {
                setError(data.error || "Failed to send verification email");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        if (onDismiss) onDismiss();
    };

    if (dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-6"
            >
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-amber-400" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white mb-1">
                            Verify Your Email Address
                        </h3>
                        <p className="text-sm text-white/70 mb-3">
                            We sent a verification email to <span className="font-medium text-white">{userEmail}</span>.
                            Please check your inbox and click the verification link to access all features.
                        </p>

                        {/* Success Message */}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-sm text-green-400 mb-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span>Verification email sent! Check your inbox.</span>
                            </motion.div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-red-400 mb-2"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleResend}
                                disabled={loading || success}
                                className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : success ? (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Sent!
                                    </>
                                ) : (
                                    "Resend verification email"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-white/40 hover:text-white/60 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
