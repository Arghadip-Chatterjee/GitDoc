"use client";

import AnalysisDashboard from "@/components/AnalysisDashboard";
import { Navbar } from "@/components/LandingPage/Navbar";
import { motion } from "framer-motion";

const BackgroundAnimation = () => {
    return (
        <div className="fixed inset-0 pointer-events-none">
            {/* Base Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

            {/* Scanning Line */}
            <motion.div
                className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent box-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />

            {/* Random Flickering Grid Cells */}
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-blue-500/10 border border-blue-500/20"
                    style={{
                        width: 40,
                        height: 40,
                        left: `${Math.floor(Math.random() * 100)}%`,
                        top: `${Math.floor(Math.random() * 100)}%`,
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: Math.random() * 2 + 1,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 5,
                    }}
                />
            ))}
        </div>
    );
};

export default function DocPage() {
    return (
        <main className="min-h-screen bg-black text-white relative overflow-hidden">
            <Navbar />
            <BackgroundAnimation />
            <div className="pt-24 px-4 sm:px-6 lg:px-8 relative z-10">
                <AnalysisDashboard />
            </div>
        </main>
    );
}
