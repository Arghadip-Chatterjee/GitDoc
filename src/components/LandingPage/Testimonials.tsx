"use client";

import { motion } from "framer-motion";
import { Quote, Terminal, RefreshCw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

// --- Testimonial Card ---
interface TestimonialProps {
    quote: string;
    author: string;
    role: string;
    company: string;
    image: string;
    onRef?: (el: HTMLDivElement | null) => void;
}

const TestimonialCard = ({ quote, author, role, company, image, onRef }: TestimonialProps) => {
    return (
        <motion.div
            ref={onRef}
            className="group relative p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 mb-6 mx-4 data-[is-hit=true]:border-blue-500/50 data-[is-hit=true]:bg-blue-500/10 data-[is-hit=true]:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
        >
            {/* Tech Decoration */}
            <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
                <Quote className="w-4 h-4 text-white" />
            </div>

            <div className="flex gap-4">
                <div className="flex-shrink-0 pt-1">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
                        <Image
                            src={image}
                            alt={author}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                <div className="flex-1">
                    <p className="text-gray-300 text-sm leading-relaxed mb-4 font-mono">
                        "{quote}"
                    </p>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <div>
                            <h4 className="text-white font-bold text-xs">{author}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase">
                                <span>{role}</span>
                                <span className="text-blue-500">@</span>
                                <span>{company}</span>
                            </div>
                        </div>
                        <Terminal className="w-3 h-3 text-gray-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                </div>
            </div>

            {/* Loading/Refresh Line */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
        </motion.div>
    );
};

// --- Background Data Rain ---
const MatrixRain = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
            <div className="flex justify-between w-full text-[10px] font-mono leading-none text-green-500">
                {Array(20).fill(0).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: '1000%', opacity: [0, 1, 0] }}
                        transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "linear"
                        }}
                    >
                        {Array(10).fill(0).map((_, j) => (
                            <div key={j}>{Math.random() > 0.5 ? '1' : '0'}</div>
                        ))}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};


export const Testimonials = () => {
    const testimonials = [
        {
            quote: "GitDoc reverse-engineered our entire microservices architecture in seconds.",
            author: "Sarah Chen",
            role: "Staff Eng",
            company: "Vercel",
            image: "/testimonials/Gemini_Generated_Image_7dyq8i7dyq8i7dyq.png"
        },
        {
            quote: "The context-aware mock interview is terrifyingly good. It found bugs I missed.",
            author: "Marcus R.",
            role: "Senior Dev",
            company: "Stripe",
            image: "/testimonials/Gemini_Generated_Image_f7y78pf7y78pf7y7.png"
        },
        {
            quote: "Documentation that updates itself. We've cut onboarding time by 40%.",
            author: "Emily Watson",
            role: "CTO",
            company: "StartUp",
            image: "/testimonials/Gemini_Generated_Image_g7acpdg7acpdg7ac.png"
        },
        {
            quote: "I use this to explain my legacy code to junior devs. It's a lifesaver.",
            author: "David Kim",
            role: "Lead",
            company: "Meta",
            image: "/testimonials/Gemini_Generated_Image_7dyq8i7dyq8i7dyq.png"
        },
        {
            quote: "The AST parsing is surprisingly accurate even for dynamic Python code.",
            author: "Alex J.",
            role: "Backend",
            company: "Netflix",
            image: "/testimonials/Gemini_Generated_Image_f7y78pf7y78pf7y7.png"
        },
        {
            quote: "Finally, a tool that actually understands system architecture.",
            author: "Priya S.",
            role: "Architect",
            company: "Amazon",
            image: "/testimonials/Gemini_Generated_Image_g7acpdg7acpdg7ac.png"
        }
    ];

    const beamRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        let animationFrameId: number;

        const checkIntersection = () => {
            const beam = beamRef.current;
            if (!beam) return;

            const beamRect = beam.getBoundingClientRect();
            // Since the beam is horizontal, we care about its Top/Bottom position relative to the viewport
            const beamY = beamRect.top;

            cardsRef.current.forEach((card) => {
                if (!card) return;
                const cardRect = card.getBoundingClientRect();

                // Check if beam is within the card's vertical range
                // We consider it a "hit" if the beam line crosses the card at all
                const isHit = beamY >= cardRect.top && beamY <= cardRect.bottom;

                // Optimization: Only update attribute if changed to avoid unnecessary repaint triggers
                const currentHit = card.getAttribute("data-is-hit") === "true";
                if (isHit !== currentHit) {
                    card.setAttribute("data-is-hit", isHit ? "true" : "false");
                }
            });

            animationFrameId = requestAnimationFrame(checkIntersection);
        };

        animationFrameId = requestAnimationFrame(checkIntersection);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Duplicate for seamless loop
    const doubledTestimonials = [...testimonials, ...testimonials];

    return (
        <section className="py-24 bg-black relative overflow-hidden flex flex-col items-center justify-center">
            {/* Backgrounds - Unified Grid System */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:40px_40px] opacity-25 pointer-events-none"></div>

            {/* Pulsing Grid Overlay */}
            <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,#444_1px,transparent_1px),linear-gradient(to_bottom,#444_1px,transparent_1px)] bg-[size:40px_40px] opacity-0 pointer-events-none"
                animate={{ opacity: [0, 0.2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Grid Scanning Beams */}
            <motion.div
                ref={beamRef}
                className="absolute left-0 right-0 h-[1px] bg-blue-500/50"
                animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                className="absolute top-0 bottom-0 w-[1px] bg-cyan-500/50"
                animate={{ left: ['0%', '100%'], opacity: [0, 1, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            />

            <MatrixRain />

            {/* Radial Gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-10"></div>

            <div className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                {/* Text Content */}
                <div className="text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-6">
                        <RefreshCw className="w-3 h-3 animate-spin duration-[3000ms]" />
                        <span>LIVE FEED</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Trusted by <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">Engineering Teams</span>
                    </h2>
                    <p className="text-gray-500 max-w-md text-sm leading-relaxed mb-8">
                        See what developers are saying about their new AI-powered documentation workflow.
                        <br /><br />
                        Join 10,000+ engineers shipping faster with GitDoc.
                    </p>
                </div>

                {/* Vertical Marquee "Feed" */}
                <div className="relative h-[500px] overflow-hidden rounded-2xl border-x border-white/5 bg-black/20 backdrop-blur-sm mask-image-gradient">
                    {/* Gradient Masks for smooth fade out */}
                    <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black to-transparent z-10"></div>
                    <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black to-transparent z-10"></div>

                    <div className="absolute inset-0 flex flex-col gap-0 w-full">
                        <motion.div
                            animate={{ y: ["0%", "-50%"] }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="w-full"
                        >
                            {doubledTestimonials.map((t, idx) => (
                                <TestimonialCard
                                    key={idx}
                                    {...t}
                                    onRef={(el) => {
                                        if (el) cardsRef.current[idx] = el;
                                    }}
                                />
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};
