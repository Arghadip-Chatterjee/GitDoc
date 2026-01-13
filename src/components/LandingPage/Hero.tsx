"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Book, BrainCircuit } from "lucide-react";

const GridAnimation = () => {
    // Generate random positions for the "active" cells
    const cells = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.floor(Math.random() * 80) * 24 + 1, // Align with 24px grid (approx)
        y: Math.floor(Math.random() * 30) * 24 + 1,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 3
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
            <svg width="100%" height="100%">
                {cells.map((cell) => (
                    <motion.rect
                        key={cell.id}
                        x={cell.x}
                        y={cell.y}
                        width="23"
                        height="23"
                        fill="currentColor"
                        className="text-blue-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.6, 0] }}
                        transition={{
                            duration: cell.duration,
                            repeat: Infinity,
                            delay: cell.delay,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </svg>
        </div>
    );
};

const ElectricBeams = () => {
    // Horizontal beams
    const hBeams = Array.from({ length: 5 }).map((_, i) => ({
        id: `h-${i}`,
        top: Math.floor(Math.random() * 30) * 24, // Grid aligned
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4
    }));

    // Vertical beams
    const vBeams = Array.from({ length: 5 }).map((_, i) => ({
        id: `v-${i}`,
        left: Math.floor(Math.random() * 60) * 24, // Grid aligned
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {hBeams.map((beam) => (
                <motion.div
                    key={beam.id}
                    className="absolute h-[1px] w-32 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_10px_2px_rgba(59,130,246,0.5)]"
                    style={{ top: beam.top, left: -150 }}
                    animate={{ left: ["0%", "100%"] }}
                    transition={{
                        duration: beam.duration,
                        repeat: Infinity,
                        delay: beam.delay,
                        ease: "linear"
                    }}
                />
            ))}
            {vBeams.map((beam) => (
                <motion.div
                    key={beam.id}
                    className="absolute w-[1px] h-32 bg-gradient-to-b from-transparent via-purple-400 to-transparent shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]"
                    style={{ left: beam.left, top: -150 }}
                    animate={{ top: ["0%", "100%"] }}
                    transition={{
                        duration: beam.duration,
                        repeat: Infinity,
                        delay: beam.delay,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
};

export const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-black">
            {/* Stronger Grid Background with Extended Mask */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a2a2a_1px,transparent_1px),linear-gradient(to_bottom,#2a2a2a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]"></div>

            {/* Micro Animations: Flickering Grid Cells */}
            <GridAnimation />

            {/* Electric Current Animations */}
            <ElectricBeams />

            {/* Top Spotlight Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-500/10 via-transparent to-transparent blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex justify-center mb-8">
                        <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-blue-300 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                            Bit-Perfect Documentation & Interviews
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-white">
                        Turn Code into <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-300 to-gray-500">
                            Engineering Insights
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl text-gray-400 mb-10 leading-relaxed font-light">
                        The developer-first platform that parses your repository to generate technical books, architectural diagrams, and mock interviews tailored to your stack.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/doc"
                            className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-xl shadow-white/5"
                        >
                            <Book className="w-5 h-5" />
                            Start Generation
                        </Link>
                        <Link
                            href="/interview"
                            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                        >
                            <BrainCircuit className="w-5 h-5" />
                            Mock Interview
                        </Link>
                    </div>

                    {/* Tech Stack Strip */}
                    <div className="mt-16 pt-8 border-t border-white/5">
                        <p className="text-sm text-gray-500 mb-6 uppercase tracking-widest font-mono text-[10px]">Powered by modern analysis engines</p>
                        <div className="flex justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Simple text placeholders for logos to keep it clean, or icons if available */}
                            <span className="font-mono font-bold text-white">GitHub</span>
                            <span className="font-mono font-bold text-white">OpenAI</span>
                            <span className="font-mono font-bold text-white">Mermaid</span>
                            <span className="font-mono font-bold text-white">React</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
