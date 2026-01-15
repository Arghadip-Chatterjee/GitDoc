"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, AlertCircle } from "lucide-react";

interface CreditWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "document" | "interview";
    timeUntilReset: string;
}

export default function CreditWarningModal({ isOpen, onClose, type, timeUntilReset }: CreditWarningModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-black border border-red-500/30 rounded-2xl p-8 max-w-md w-full relative overflow-hidden"
                        >
                            {/* Background glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                        <AlertCircle className="w-6 h-6 text-red-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Credits Exhausted</h2>
                                </div>

                                <p className="text-gray-400 mb-6">
                                    You've used all your {type === "document" ? "document generation" : "mock interview"} credits for this period.
                                </p>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-yellow-400" />
                                        <span className="text-sm font-semibold text-white">Credits Reset In</span>
                                    </div>
                                    <p className="text-2xl font-mono font-bold text-yellow-400">{timeUntilReset}</p>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-blue-400">
                                        <strong>How it works:</strong> You get 2 {type === "document" ? "document generations" : "mock interviews"} every 48 hours.
                                        The timer starts when you use your first credit.
                                    </p>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all"
                                >
                                    Got it
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
