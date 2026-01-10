"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, ArrowRight, BrainCircuit, ScanEye, Code2, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeRepoFiles } from "@/lib/github-loader";
import InterviewControls from "@/components/InterviewControls";

export default function InterviewPage() {
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
                    repoName: `${owner}/${name}`,
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

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-black/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <BrainCircuit className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">GitDoc Interview</span>
                    </div>
                </div>
            </header>

            <main className="pt-16 h-screen flex flex-col">
                {step === "input" && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-2xl text-center space-y-8"
                        >
                            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                                Mock Technical Interview
                            </h1>
                            <p className="text-xl text-gray-400">
                                Enter a GitHub repository URL. We will analyze the entire codebase and architecture, then simulate a voice interview with a Senior Engineering Manager.
                            </p>

                            <div className="flex gap-2 relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur-lg" />
                                <input
                                    type="text"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    placeholder="https://github.com/username/repo"
                                    className="relative z-10 flex-1 bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 text-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                                />
                                <button
                                    onClick={handleStartAnalysis}
                                    disabled={!repoUrl}
                                    className="relative z-10 bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    Start <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2 justify-center">
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {step === "analyzing" && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <div className="w-full max-w-md space-y-6 text-center">
                            <div className="relative w-24 h-24 mx-auto">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle className="text-gray-800 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                                    <circle className="text-blue-500 progress-ring__circle stroke-current transition-all duration-300" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - analysisProgress / 100)}`}></circle>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-xl font-bold font-mono">
                                    {Math.round(analysisProgress)}%
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold animate-pulse">{statusMsg}</h3>
                                <p className="text-gray-500">Scanning repository files and architecture patterns...</p>
                            </div>

                            <div className="flex justify-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" /> Repo Info
                                </div>
                                <div className={`flex items-center gap-2 ${analysisProgress > 0 ? 'text-gray-300' : ''}`}>
                                    {analysisProgress === 100 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                                    File Scan
                                </div>
                                <div className={`flex items-center gap-2 ${architectureContext ? 'text-gray-300' : ''}`}>
                                    {architectureContext ? <CheckCircle className="w-4 h-4 text-green-500" /> : <ScanEye className="w-4 h-4" />}
                                    Architecture
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === "interview" && (
                    <div className="flex-1 flex items-center justify-center relative bg-[url('/grid.svg')] bg-center bg-fixed">
                        {/* Centered Interview Controls */}
                        <div className="w-full max-w-3xl bg-black rounded-2xl border border-gray-800 shadow-2xl overflow-hidden min-h-[500px]">
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
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
