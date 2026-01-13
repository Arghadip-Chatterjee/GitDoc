"use client";

import { motion } from "framer-motion";
import { Book, BrainCircuit, Code2, Zap } from "lucide-react";

const FeatureCard = ({ title, description, icon: Icon, color, delay, type }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 hover:border-white/20 transition-colors duration-500"
        >
            {/* Internal Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px]"></div>

            {/* Hover Gradient Blob */}
            <div className={`absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-[80px] transition-opacity duration-500 rounded-full pointer-events-none`}></div>

            <div className="relative z-10 p-8 h-full flex flex-col">
                {/* Icon & Micro-Animation Area */}
                <div className="mb-6 relative w-12 h-12">
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                    <div className="relative flex items-center justify-center w-full h-full border border-white/10 rounded-xl overflow-hidden">
                        <Icon className="w-6 h-6 text-white relative z-10" />

                        {/* Specific Micro-Animations based on type */}
                        {type === 'scan' && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent w-full h-1/2"
                                animate={{ top: ['-100%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                        )}
                        {type === 'pulse' && (
                            <motion.div
                                className="absolute inset-0 bg-purple-500/30 rounded-full"
                                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        )}
                        {type === 'code' && (
                            <div className="absolute inset-0 flex flex-col gap-1 p-1 opacity-20">
                                <motion.div className="h-0.5 w-3/4 bg-orange-400" animate={{ width: ["0%", "75%"] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                <motion.div className="h-0.5 w-1/2 bg-orange-400" animate={{ width: ["0%", "50%"] }} transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }} />
                            </div>
                        )}
                        {type === 'connect' && (
                            <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
                                <motion.circle cx="50%" cy="50%" r="10" stroke="currentColor" fill="none"
                                    animate={{ r: [2, 12], opacity: [1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            </svg>
                        )}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-colors">
                    {title}
                </h3>

                <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-grow">
                    {description}
                </p>

                {/* Bottom Tech Detail / Visual */}
                <div className="mt-auto pt-6 border-t border-white/5 opacity-60 group-hover:opacity-100 transition-opacity font-mono text-[10px] text-gray-500 flex justify-between items-center">
                    <span>STATUS: ACTIVE</span>
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                className="w-1 h-1 rounded-full bg-white/50"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ModernBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Prominent Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:40px_40px] opacity-25"></div>

            {/* Animated Grid Overlay (Pulsing) */}
            <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,#444_1px,transparent_1px),linear-gradient(to_bottom,#444_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Horizontal Scanning Lines */}
            <motion.div
                className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
                animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"
                animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 2 }}
            />

            {/* Vertical Scanning Lines (New) */}
            <motion.div
                className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent"
                animate={{ left: ['0%', '100%'], opacity: [0, 1, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 1 }}
            />
            <motion.div
                className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-blue-500/30 to-transparent"
                animate={{ left: ['100%', '0%'], opacity: [0, 1, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 3 }}
            />

            {/* Corner Accent Lines - Brighter */}
            <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-white/10 rounded-tl-3xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-white/10 rounded-tr-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-white/10 rounded-bl-3xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-white/10 rounded-br-3xl"></div>

            {/* Subtle Dot Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}></div>
        </div>
    );
};

export const Features = () => {
    return (
        <section className="py-32 relative px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
            {/* Modern Technical Background */}
            <ModernBackground />

            {/* Connecting line from Hero */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent to-white/10"></div>

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20 relative">
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none"></div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold text-white mb-6 relative z-10"
                    >
                        Core Engines
                    </motion.h2>
                    <p className="text-gray-500 max-w-xl mx-auto text-sm uppercase tracking-widest font-mono">
                        System Modules & Capabilities
                    </p>
                </div>

                {/* 2x2 Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    <FeatureCard
                        title="Documentation Engine"
                        description="Auto-generates comprehensive technical documentation by parsing ASTs and file relationships."
                        icon={Book}
                        color="from-blue-500 to-cyan-500"
                        delay={0}
                        type="scan"
                    />
                    <FeatureCard
                        title="Contextual Mock Interview"
                        description="AI interviewer that understands your specific architecture and asks deeper system design questions."
                        icon={BrainCircuit}
                        color="from-purple-500 to-pink-500"
                        delay={0.1}
                        type="pulse"
                    />
                    <FeatureCard
                        title="Deep Static Analysis"
                        description="Identifies anti-patterns, security risks, and complexity hotspots beyond standard linting."
                        icon={Code2}
                        color="from-orange-500 to-red-500"
                        delay={0.2}
                        type="code"
                    />
                    <FeatureCard
                        title="Architecture Visualizer"
                        description="Instantly reverse-engineers codebase capability into Mermaid.js charts and class diagrams."
                        icon={Zap}
                        color="from-green-500 to-emerald-500"
                        delay={0.3}
                        type="connect"
                    />
                </div>
            </div>
        </section>
    );
};
