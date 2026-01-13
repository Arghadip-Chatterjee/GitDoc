"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ArrowRight, BrainCircuit, ScanEye, Code2, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeRepoFiles } from "@/lib/github-loader";
import InterviewControls from "@/components/InterviewControls";
import { Navbar } from "@/components/LandingPage/Navbar";

export default function InterviewPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [step, setStep] = useState<"input" | "analyzing" | "interview">("input");
    const [repoUrl, setRepoUrl] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [error, setError] = useState("");

    // Analysis Data
    const [repoDetails, setRepoDetails] = useState<any>(null);
    const [fileContext, setFileContext] = useState("");
    const [architectureContext, setArchitectureContext] = useState("");

    const handleStartAnalysis = async () => {
        if (!repoUrl) return;
        setError("");

        try {
            // Parse Repo
            const match = repoUrl.replace("https://github.com/", "").match(/^([^/]+)\/([^/]+)/);
            if (!match) throw new Error("Invalid GitHub URL format. Use 'owner/repo'");
            const [_, owner, name] = match;

            setStep("analyzing");
            setStatusMsg("Fetching repository details...");

            // 1. Fetch Repo Info
            // The API expects ?url=...
            const repoRes = await fetch(`/api/github/repo?url=https://github.com/${owner}/${name}`);
            if (!repoRes.ok) throw new Error("Repository not found or private");
            const repoData = await repoRes.json();
            setRepoDetails(repoData);

            // 2. Repo Data already includes files (from our API)
            setStatusMsg("Scanning file structure...");

            // 3. FULL File Analysis (Step 1)
            setStatusMsg("Analyzing all code files (This may take a minute)...");
            const fileAnalyses = await analyzeRepoFiles(repoData, (file, percent) => {
                setAnalysisProgress(percent);
                setStatusMsg(`Analyzing ${file.split('/').pop()}...`);
            });

            const fileContextStr = fileAnalyses.map(f => `File: ${f.path}\nAnalysis: ${f.analysis}`).join("\n\n");
            setFileContext(fileContextStr);

            // 4. Architecture Analysis (Step 2)
            setStatusMsg("Analyzing System Architecture...");
            setAnalysisProgress(100); // Visual candy

            const archRes = await fetch("/api/analyze/report", {
                method: "POST",
                body: JSON.stringify({
                    repoUrl: repoUrl, // Send the full URL
                    fileAnalyses: fileAnalyses,
                    step: 2, // Architecture Step
                    context: { textual: "", structure: "", visuals: "" } // Initial context
                })
            });
            const archData = await archRes.json();
            if (!archRes.ok) throw new Error(archData.error || "Architecture analysis failed");

            setArchitectureContext(archData.result);

            // Ready!
            setStep("interview");

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setStep("input");
        }
    };

    // Redirect to signin if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin?callbackUrl=/interview");
        }
    }, [status, router]);

    const BackgroundAnimation = () => {
        return (
            <div className="fixed inset-0 pointer-events-none -z-10">
                {/* Base Grid */}
                <div className="absolute inset-0 bg-black"></div>
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
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, repeatDelay: Math.random() * 5 }}
                    />
                ))}
            </div>
        );
    };

    // Show loading while checking authentication
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white font-sans selection:bg-blue-500/30 relative overflow-hidden">
            <Navbar />
            <BackgroundAnimation />

            <main className="pt-24 min-h-screen flex flex-col relative z-10">
                {step === "input" && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-2xl text-center space-y-8"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                    <BrainCircuit className="w-12 h-12 text-blue-400" />
                                </div>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                                Mock Technical Interview
                            </h1>
                            <p className="text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
                                Enter a GitHub repository URL. We'll analyze the codebase and simulate a realistic voice interview.
                            </p>

                            <div className="relative group max-w-xl mx-auto">
                                <div className="flex items-center bg-black rounded-xl border border-white/20 p-2 shadow-lg shadow-black/50 group-hover:border-blue-500/50 transition-colors duration-300">
                                    <input
                                        type="text"
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        placeholder="https://github.com/username/repo"
                                        className="flex-1 bg-transparent border-none px-4 py-3 text-lg text-white placeholder-gray-600 focus:ring-0 font-mono"
                                    />
                                    <button
                                        onClick={handleStartAnalysis}
                                        disabled={!repoUrl}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm border border-blue-400/20"
                                    >
                                        START <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2 justify-center text-sm"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                )}

                {step === "analyzing" && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <div className="w-full max-w-md space-y-8 text-center">
                            <div className="relative w-32 h-32 mx-auto">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle className="text-gray-900 stroke-current" strokeWidth="6" cx="50" cy="50" r="40" fill="transparent"></circle>
                                    <circle
                                        className="text-blue-500 transition-all duration-500 ease-out"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="transparent"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - analysisProgress / 100)}`}
                                    ></circle>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="text-2xl font-bold font-mono text-white">{Math.round(analysisProgress)}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-white animate-pulse">{statusMsg}</h3>
                                <p className="text-gray-500 text-sm">Deep scanning repository files & architecture...</p>
                            </div>

                            <div className="flex justify-center gap-6 text-sm">
                                <div className={`flex flex-col items-center gap-2 transition-colors ${analysisProgress > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                                    <div className={`p-2 rounded-full border ${analysisProgress > 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800 border-gray-700'}`}>
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider">Repo</span>
                                </div>
                                <div className={`flex flex-col items-center gap-2 transition-colors ${analysisProgress > 20 ? 'text-blue-400' : 'text-gray-600'}`}>
                                    <div className={`p-2 rounded-full border ${analysisProgress > 20 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-800 border-gray-700'}`}>
                                        <Code2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider">Code</span>
                                </div>
                                <div className={`flex flex-col items-center gap-2 transition-colors ${architectureContext ? 'text-purple-400' : 'text-gray-600'}`}>
                                    <div className={`p-2 rounded-full border ${architectureContext ? 'bg-purple-500/10 border-purple-500/30' : 'bg-gray-800 border-gray-700'}`}>
                                        <BrainCircuit className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider">Arch</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === "interview" && (
                    <div className="flex-1 flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-5xl bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                        >
                            <InterviewControls
                                repoName={repoDetails?.repo || repoUrl}
                                fileContext={fileContext}
                                architectureContext={architectureContext}
                                onEnd={() => {
                                    if (confirm("End interview session?")) {
                                        window.location.reload();
                                    }
                                }}
                            />
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
}
