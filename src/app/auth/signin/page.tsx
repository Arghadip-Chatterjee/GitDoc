"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Terminal, Code2 } from "lucide-react";

// Matrix Rain Background Component
const MatrixRain = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.35]">
            <div className="flex justify-between w-full text-xs font-mono leading-none text-green-400">
                {Array(50).fill(0).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: '1000%', opacity: [0, 1, 0] }}
                        transition={{
                            duration: Math.random() * 3 + 4,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                            ease: "linear"
                        }}
                    >
                        {Array(20).fill(0).map((_, j) => (
                            <div key={j}>{Math.random() > 0.5 ? '1' : '0'}</div>
                        ))}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// Floating Code Snippets
const FloatingCode = () => {
    const codeSnippets = [
        'const auth = async () => {}',
        'function login() { }',
        'import { useState }',
        'export default',
        '{ user: data }',
        'await fetch()',
        'return response.json()',
        'if (error) throw',
        'try { await }',
        'const data = {}',
    ];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.2]">
            {codeSnippets.map((snippet, i) => (
                <motion.div
                    key={i}
                    className="absolute text-xs font-mono text-blue-400"
                    initial={{
                        x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
                        y: -50
                    }}
                    animate={{
                        y: typeof window !== 'undefined' ? window.innerHeight + 50 : 1000,
                        x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0
                    }}
                    transition={{
                        duration: Math.random() * 15 + 10,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 5
                    }}
                >
                    {snippet}
                </motion.div>
            ))}
        </div>
    );
};

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (error) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Animations */}
            <MatrixRain />
            <FloatingCode />

            {/* Scanning Line */}
            <motion.div
                className="absolute left-0 right-0 h-[2px] bg-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-transparent to-zinc-950/50 pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                    {/* Header */}
                    <motion.div
                        className="text-center mb-8"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Code2 className="w-8 h-8 text-cyan-400" />
                            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
                        </div>
                        <p className="text-white/50 text-sm">Sign in to access your GitDoc dashboard</p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Email Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="block text-sm font-medium text-white/70 mb-2">
                                Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.05] transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </motion.div>

                        {/* Password Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label className="block text-sm font-medium text-white/70 mb-2">
                                Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.05] transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className="w-full bg-white text-black font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:hover:shadow-none"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <Terminal className="w-5 h-5" />
                                    Sign In
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Footer */}
                    <motion.div
                        className="mt-6 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <p className="text-white/50 text-sm">
                            Don't have an account?{" "}
                            <Link href="/auth/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors relative group">
                                Sign up
                                <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-cyan-400 transition-all group-hover:w-full"></span>
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
