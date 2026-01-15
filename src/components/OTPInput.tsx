"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, Mail } from "lucide-react";

interface OTPInputProps {
    length?: number;
    onComplete: (otp: string) => void;
    onResend: () => void;
    email: string;
    loading?: boolean;
    error?: string;
    expiresIn?: number; // seconds
}

export default function OTPInput({
    length = 6,
    onComplete,
    onResend,
    email,
    loading = false,
    error = "",
    expiresIn = 900 // 15 minutes in seconds
}: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
    const [timeLeft, setTimeLeft] = useState(expiresIn);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer
    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if complete
        if (newOtp.every((digit) => digit !== "")) {
            onComplete(newOtp.join(""));
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {
                // Move to previous input if current is empty
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current input
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\s/g, "");

        if (!/^\d+$/.test(pastedData)) return;

        const digits = pastedData.slice(0, length).split("");
        const newOtp = [...otp];

        digits.forEach((digit, index) => {
            if (index < length) {
                newOtp[index] = digit;
            }
        });

        setOtp(newOtp);

        // Focus last filled input or next empty
        const lastFilledIndex = Math.min(digits.length - 1, length - 1);
        inputRefs.current[lastFilledIndex]?.focus();

        // Check if complete
        if (newOtp.every((digit) => digit !== "")) {
            onComplete(newOtp.join(""));
        }
    };

    const handleResend = () => {
        setOtp(new Array(length).fill(""));
        setTimeLeft(expiresIn);
        inputRefs.current[0]?.focus();
        onResend();
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
            >
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
                <p className="text-white/60 text-sm">
                    Enter the 6-digit code sent to<br />
                    <span className="text-white font-medium">{email}</span>
                </p>
            </motion.div>

            {/* OTP Input Boxes */}
            <div className="flex gap-3 justify-center mb-6">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        disabled={loading}
                        className={`w-12 h-14 text-center text-2xl font-bold bg-white/[0.05] border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${error
                            ? "border-red-500 focus:ring-red-500"
                            : "border-white/[0.08] focus:border-cyan-400 focus:ring-cyan-400"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        autoFocus={index === 0}
                    />
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm text-center"
                >
                    {error}
                </motion.div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center gap-2 text-white/60 text-sm mb-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                </div>
            )}

            {/* Timer and Resend */}
            <div className="text-center">
                {timeLeft > 0 ? (
                    <p className="text-white/40 text-sm mb-3">
                        Code expires in <span className="text-white font-mono">{formatTime(timeLeft)}</span>
                    </p>
                ) : (
                    <p className="text-red-400 text-sm mb-3">Code expired</p>
                )}

                <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Resend Code
                </button>
            </div>
        </div>
    );
}
