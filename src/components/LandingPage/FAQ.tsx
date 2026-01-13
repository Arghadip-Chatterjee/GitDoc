"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle, Terminal } from "lucide-react";

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
    index: number;
}

const FAQItem = ({ question, answer, isOpen, onClick, index }: FAQItemProps) => {
    return (
        <div className="border-b border-white/10 last:border-0 relative overflow-hidden group/item">
            {/* Hover Glow Effect */}
            <div className={`absolute inset-0 bg-blue-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 pointer-events-none ${isOpen ? 'opacity-100' : ''}`}></div>

            {/* Active Border Indicator */}
            <motion.div
                className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: isOpen ? '100%' : '0%', opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
            />

            <button
                onClick={onClick}
                className="w-full flex items-center justify-between py-6 px-6 text-left relative z-10"
            >
                <div className="flex items-center gap-6">
                    <span className={`text-xs font-mono transition-colors duration-300 ${isOpen ? 'text-blue-400' : 'text-gray-600 group-hover/item:text-blue-500'
                        }`}>
                        {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={`text-base font-medium transition-colors duration-300 flex items-center gap-3 ${isOpen ? 'text-white' : 'text-gray-300 group-hover/item:text-white'
                        }`}>
                        <span className="opacity-0 -ml-4 group-hover/item:opacity-100 group-hover/item:ml-0 transition-all duration-300 text-blue-500 font-mono">[</span>
                        {question}
                        <span className="opacity-0 -mr-4 group-hover/item:opacity-100 group-hover/item:mr-0 transition-all duration-300 text-blue-500 font-mono">]</span>
                    </span>
                </div>

                <div className={`p-1.5 rounded-lg border transition-all duration-300 ${isOpen
                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 rotate-180'
                    : 'bg-transparent text-gray-500 border-white/10 group-hover/item:border-white/30 group-hover/item:text-white'
                    }`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6 pl-16 pr-8 relative">
                            {/* Connector Line */}
                            <div className="absolute left-9 top-0 bottom-6 w-[1px] bg-white/10"></div>
                            <div className="absolute left-9 top-4 w-4 h-[1px] bg-white/10"></div>

                            <p className="text-gray-400 text-sm leading-relaxed font-light">
                                <Terminal className="w-3 h-3 inline-block mr-2 mb-0.5 text-blue-500/50" />
                                {answer}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Animated Digital Grid Background ---
const DigitalGrid = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Base Grid - Increased Opacity */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>

            {/* Pulsing Grid Overlay */}
            <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,#444_1px,transparent_1px),linear-gradient(to_bottom,#444_1px,transparent_1px)] bg-[size:50px_50px] opacity-0"
                animate={{ opacity: [0, 0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Moving Grid Overlay (Parallax feel) */}
            <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,#444_1px,transparent_1px),linear-gradient(to_bottom,#444_1px,transparent_1px)] bg-[size:100px_100px] opacity-10"
                animate={{ y: [0, -50] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {/* Spotlight Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>


            {/* Scanning Data Beams (Horizontal) */}
            <motion.div
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
                animate={{ top: ['10%', '90%'], opacity: [0, 1, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
                animate={{ top: ['80%', '20%'], opacity: [0, 1, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />

            {/* Floating Data Particles */}
            {Array(8).fill(0).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-blue-400 rounded-sm"
                    initial={{
                        x: Math.random() * 1000,
                        y: Math.random() * 800,
                        opacity: 0
                    }}
                    animate={{
                        y: [0, -100],
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1.2, 0.5]
                    }}
                    transition={{
                        duration: Math.random() * 5 + 5,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                        ease: "linear"
                    }}
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`
                    }}
                />
            ))}

            {/* Pulse Nodes (Existing but enhanced) */}
            {Array(5).fill(0).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{
                        opacity: [0.2, 0.6, 0.2],
                        scale: [1, 1.5, 1]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeInOut"
                    }}
                    style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`
                    }}
                />
            ))}

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
                <motion.path
                    d="M0,50 Q400,100 800,50 T1600,50"
                    fill="none"
                    stroke="url(#gradient-line)"
                    strokeWidth="1"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
                <defs>
                    <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};

export const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: "How does GitDoc analyze my codebase?",
            answer: "GitDoc clones your repository to a secure sandboxed environment and uses advanced AST parsing combined with LLM analysis. It builds a semantic graph of your code to understand dependencies, class structures, and business logic before generating documentation."
        },
        {
            question: "Is my code secure?",
            answer: "Absolutely. We use ephemeral sandboxes for analysis. Your code is pulled, analyzed, and the environment is immediately destroyed. We do not store your source code permanently, only the generated documentation artifacts and embeddings for the search index."
        },
        {
            question: "Can I customize the interview focus?",
            answer: "Yes. The AI interviewer automatically detects frameworks (React, Node, Go, etc.) but you can also guide it. Before starting, you can specifically ask it to focus on 'System Design', 'Security', or 'React Patterns' for a tailored session."
        },
        {
            question: "Which languages are supported?",
            answer: "We support major languages including TypeScript/JavaScript, Python, Go, Rust, Java, and C++. The diagram generation works best with object-oriented and module-based languages."
        }
    ];

    return (
        <section className="py-24 bg-black relative border-t border-white/5 overflow-hidden">
            <DigitalGrid />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex items-center gap-4 mb-12">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse"></div>
                        <HelpCircle className="w-5 h-5 text-gray-400" />
                    </motion.div>
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">System FAQ</h2>
                        {/* <p className="text-gray-500 text-xs font-mono uppercase tracking-wider mt-1">
                            <span className="text-blue-500">///</span><span> Knowledge Base </span>
                        </p> */}
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
                >
                    {faqs.map((faq, idx) => (
                        <FAQItem
                            key={idx}
                            index={idx}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === idx}
                            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
};
