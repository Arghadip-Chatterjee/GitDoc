"use client";

import { Github, Twitter, Linkedin, ArrowRight, Command } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export const Footer = () => {
    return (
        <footer className="relative bg-black border-t border-white/10 pt-20 pb-10 overflow-hidden">
            {/* Background Grid Extension */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <div className="p-2 bg-white/5 border border-white/10 rounded-lg group-hover:bg-white/10 transition-colors">
                                <Command className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight">GitDoc</span>
                        </Link>
                        <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
                            The intelligent platform for developer documentation and technical interview preparation. transforming repositories into knowledge bases.
                        </p>

                        <div className="flex items-center gap-2 text-xs font-mono text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-full w-fit">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            All Systems Operational
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="/doc" className="hover:text-blue-400 transition-colors flex items-center gap-1 group">Documentation <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></Link></li>
                            <li><Link href="/interview" className="hover:text-purple-400 transition-colors flex items-center gap-1 group">Mock Interview <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></Link></li>
                            <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                            {/* <li><Link href="#" className="hover:text-white transition-colors">API Reference</Link></li> */}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Connect</h4>
                        <div className="flex gap-4 mb-6">
                            <Link href="https://github.com/Arghadip-Chatterjee/GitDoc" className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-gray-400 hover:text-white">
                                <Github className="w-5 h-5" />
                            </Link>
                            {/* <Link href="#" className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-gray-400 hover:text-white">
                                <Twitter className="w-5 h-5" />
                            </Link> */}
                            <Link href="https://www.linkedin.com/in/arghadip-chatterjee/" className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-gray-400 hover:text-white">
                                <Linkedin className="w-5 h-5" />
                            </Link>
                        </div>
                        <p className="text-xs text-gray-500">
                            Feel Free to Connect !! 😉
                        </p>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-center items-center gap-4 text-lg text-gray-600 mx-auto">
                    <p>&copy; {new Date().getFullYear()} ❤️ from GitDoc . All rights reserved.</p>
                    {/* <div className="flex gap-8">
                        <Link href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
                    </div> */}
                </div>
            </div>

            {/* Massive Watermark */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 pointer-events-none opacity-[0.03]">
                <h1 className="text-[20vw] font-bold text-white tracking-tighter leading-none select-none">
                    GITDOC
                </h1>
            </div>
        </footer>
    );
};
