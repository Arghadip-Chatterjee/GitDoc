"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import UserNav from "../UserNav";
import { motion } from "framer-motion";
import { Code2 } from "lucide-react";

export const Navbar = () => {
    const { data: session } = useSession();

    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/[0.08] bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
            {/* Ambient Noise Texture - SVG Data URI for valid static noise */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            ></div>

            {/* Subtle Vignette for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-3 group">
                        <motion.div
                            className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] group-hover:bg-white/[0.08] group-hover:border-white/20 transition-all shadow-sm"
                            whileHover={{ rotate: 15, scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <Code2 className="w-5 h-5 text-white/90" />
                        </motion.div>
                        <span className="text-lg tracking-tight font-sans flex items-center gap-[2px]">
                            <span className="font-bold text-white tracking-tight">Git</span>
                            <span className="font-medium text-white/50 group-hover:text-white/80 transition-colors">Doc</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {/* Navigation Links with animated indicator */}
                        {[
                            { href: "/", label: "Home" },
                            { href: "/doc", label: "Generator" },
                            { href: "/interview", label: "Interview" },
                            ...(session ? [{ href: "/dashboard", label: "Dashboard" }] : [])
                        ].map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-white/60 hover:text-white transition-colors relative group py-1"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white/50 transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {session ? (
                            <UserNav />
                        ) : (
                            <>
                                <Link
                                    href="/auth/signin"
                                    className="text-sm font-medium text-white/60 hover:text-white transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="px-5 py-2 text-sm font-semibold text-black bg-white rounded-full hover:bg-gray-100 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
