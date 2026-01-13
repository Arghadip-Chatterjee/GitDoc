"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText, CheckCircle, AlertCircle, ArrowRight, Book, ScanEye, BrainCircuit, Image as ImageIcon, LogIn } from "lucide-react";
import RepoInput from "./RepoInput";
import BookViewer from "./BookViewer";
import { FileUploadDemo, TaggedFile } from "./FileUploadDemo";
import { analyzeRepoFiles } from "@/lib/github-loader";
import Image from "next/image";

type StepStatus = "idle" | "scanning" | "generating" | "complete";

const DIAGRAM_OPTIONS = [
    "System Design Architecture Diagram",
    "DFD Level 0 Diagram",
    "DFD Level 1 Diagram",
    "ERD Diagaram",
    "Sequence Diagram",
    "Activity Diagram",
    "Class Diagram",
    "Component Diagram",
    "Deployment Diagram"
];

export default function AnalysisDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [mainStatus, setMainStatus] = useState<"idle" | "loading_repo" | "analyzing" | "step_flow" | "done" | "error">("idle");
    const [currentStep, setCurrentStep] = useState(0); // 0 = not started, 1=Vision, 2=Structure, 3=Visuals, 4=Book
    const [stepStatus, setStepStatus] = useState<StepStatus>("idle");

    const [error, setError] = useState("");
    const [repoDetails, setRepoDetails] = useState<any>(null);
    const [fileAnalyses, setFileAnalyses] = useState<any[]>([]);
    const [originalRepoUrl, setOriginalRepoUrl] = useState(""); // Store original user input URL

    // Progress State
    const [progress, setProgress] = useState(0);
    const [scanFile, setScanFile] = useState("");

    // Step Data Context
    const [context, setContext] = useState({
        textual: "",
        structure: "",
        visuals: ""
    });
    const [finalBook, setFinalBook] = useState<any>(null);
    const [customImages, setCustomImages] = useState<TaggedFile[]>([]);

    // --- STEP 2 (VISUALS) INTERACTIVE STATE ---
    const [diagramStates, setDiagramStates] = useState<Record<string, { status: "idle" | "loading" | "success" | "error", url?: string, code?: string }>>({});

    const handleResumeDocument = useCallback(async (analysisId: string) => {
        try {
            setMainStatus("loading_repo");
            setError("");

            // Fetch existing analysis
            const res = await fetch(`/api/analysis/${analysisId}`);
            if (!res.ok) throw new Error("Document not found");

            const data = await res.json();
            const analysis = data.analysis;

            // Check if already completed - redirect to view
            if (analysis.status === "completed") {
                router.push(`/document/${analysisId}`);
                return;
            }

            // Restore repository details
            setRepoDetails(analysis.repository);
            setOriginalRepoUrl(analysis.repository.url);

            // Parse and restore file context
            if (analysis.fileContext) {
                try {
                    const parsedFileContext = JSON.parse(analysis.fileContext);
                    setFileAnalyses(parsedFileContext);
                } catch (e) {
                    // If not JSON, it might be the old format - create basic structure
                    setFileAnalyses([]);
                }
            }

            // Parse and restore architecture context (contains textual, structure, visuals)
            if (analysis.architectureContext) {
                try {
                    const archContext = JSON.parse(analysis.architectureContext);
                    setContext({
                        textual: archContext.textual || "",
                        structure: archContext.structure || "",
                        visuals: archContext.visuals || ""
                    });
                } catch (e) {
                    console.error("Failed to parse architecture context:", e);
                }
            }

            // Restore diagrams (both user-uploaded and AI-generated)
            if (analysis.diagrams && analysis.diagrams.length > 0) {
                const userImages: TaggedFile[] = [];
                const aiDiagrams: Record<string, any> = {};

                analysis.diagrams.forEach((diagram: any) => {
                    if (diagram.mermaidCode) {
                        // AI-generated diagram
                        aiDiagrams[diagram.type] = {
                            status: "success",
                            url: diagram.imageUrl,
                            code: diagram.mermaidCode
                        };
                    } else {
                        // User-uploaded image
                        userImages.push({
                            url: diagram.imageUrl,
                            publicId: diagram.tag || diagram.type, // Use tag as publicId fallback
                            tag: diagram.tag || diagram.type,
                            originalName: diagram.type
                        });
                    }
                });

                setCustomImages(userImages);
                setDiagramStates(aiDiagrams);
            }

            // Set the current step to show the last completed step
            // If step 1 is completed, show step 1 with the "Proceed to Step 2" button
            setCurrentStep(analysis.step);
            setMainStatus("step_flow");
            setStepStatus("complete");

            // Clear URL parameter
            window.history.replaceState({}, '', '/doc');

        } catch (err: any) {
            console.error("Resume error:", err);
            setError(err.message || "Failed to resume document");
            setMainStatus("error");
        }
    }, [router]);

    // Resume functionality - detect resumeId from URL
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const resumeId = searchParams.get('resumeId');

        if (resumeId && status === "authenticated") {
            handleResumeDocument(resumeId);
        }
    }, [status, handleResumeDocument]);



    // Initial Analysis (Real File Fetching)
    const analyzeFiles = async (repoData: any) => {
        const analyses = await analyzeRepoFiles(repoData, (file, percent) => {
            setScanFile(file);
            setProgress(percent);
        });
        setFileAnalyses(analyses);
        return analyses;
    };

    // Simulate "Scanning" for each step (Visual Candy)
    const simulateStepScan = async (files: any[]) => {
        setStepStatus("scanning");
        setProgress(0);
        const scanDuration = 2000;
        const stepTime = scanDuration / files.length;
        for (let i = 0; i < files.length; i++) {
            setScanFile(files[i].path);
            setProgress(((i + 1) / files.length) * 100);
            await new Promise(r => setTimeout(r, Math.min(stepTime, 100)));
        }
    };

    // Generic Runner for Steps 1, 2 (structure), 4
    const runStep = async (stepNumber: number, currentAnalyses: any[], repoUrl: string) => {
        try {
            await simulateStepScan(currentAnalyses);
            setStepStatus("generating");
            setScanFile("Generating Content...");

            const res = await fetch("/api/analyze/report", {
                method: "POST",
                body: JSON.stringify({
                    repoUrl: repoUrl, // Send original URL
                    fileAnalyses: currentAnalyses,
                    step: stepNumber,
                    context: context
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            if (stepNumber === 1) {
                setContext(prev => ({ ...prev, textual: data.result }));
                // REMOVED: setCurrentStep(2);  <-- Manual Advance Only
            } else if (stepNumber === 2) {
                setContext(prev => ({ ...prev, structure: data.result }));
                // REMOVED: setCurrentStep(3);  <-- Manual Advance Only
            } else if (stepNumber === 4) {
                return data.result;
            }

            setStepStatus("complete");
            return data.result;

        } catch (err: any) {
            throw new Error(err.message);
        }
    };

    const handleStart = async (url: string) => {
        // Check authentication before making any API calls
        if (status === "unauthenticated" || !session) {
            setError("Please sign in to use the Document Generator");
            router.push("/auth/signin?callbackUrl=/");
            return;
        }

        setMainStatus("loading_repo");
        setError("");
        setContext({ textual: "", structure: "", visuals: "" });
        setRepoDetails(null);
        setCurrentStep(0);
        setStepStatus("idle");
        setOriginalRepoUrl(url); // Store the original URL from input box

        try {
            const repoRes = await fetch(`/api/github/repo?url=${encodeURIComponent(url)}`);
            const repoData = await repoRes.json();
            if (!repoRes.ok) throw new Error(repoData.error);
            setRepoDetails(repoData);

            setMainStatus("analyzing");
            const analyses = await analyzeFiles(repoData);

            setMainStatus("step_flow");
            setCurrentStep(1);

            // Auto-run Step 1 with original URL from input box
            await runStep(1, analyses, url);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setMainStatus("error");
        }
    };

    // --- NEW: SINGLE DIAGRAM GENERATION ---
    const handleGenerateDiagram = async (diagramType: string) => {
        setDiagramStates(prev => ({ ...prev, [diagramType]: { status: "loading" } }));

        try {
            const aggregatedContext = fileAnalyses.map((item: any) => `### File: ${item.path}\n${item.analysis}\n`).join("\n\n");

            const res = await fetch("/api/analyze/diagram", {
                method: "POST",
                body: JSON.stringify({
                    repoName: repoDetails.html_url || repoDetails.full_name,
                    context: aggregatedContext,
                    diagramType: diagramType
                })
            });

            const data = await res.json();

            if (data.success && data.url) {
                setDiagramStates(prev => ({
                    ...prev,
                    [diagramType]: { status: "success", url: data.url, code: data.code }
                }));
            } else {
                setDiagramStates(prev => ({ ...prev, [diagramType]: { status: "error" } }));
            }
        } catch (e) {
            console.error(e);
            setDiagramStates(prev => ({ ...prev, [diagramType]: { status: "error" } }));
        }
    };

    // --- STEP 3 DRAFTING RUNNER ---
    const runDraftingStep = async () => {
        try {
            setStepStatus("generating");
            setScanFile("Drafting Chapter 3...");

            // Prepare "Generated Diagrams" map with both URL and code
            const generatedMap: Record<string, { url: string, code: string }> = {};
            Object.entries(diagramStates).forEach(([type, state]) => {
                if (state.status === "success" && state.url) {
                    generatedMap[type] = {
                        url: state.url,
                        code: (state as any).code || ""
                    };
                }
            });

            const res = await fetch("/api/analyze/report", {
                method: "POST",
                body: JSON.stringify({
                    repoUrl: originalRepoUrl,
                    fileAnalyses: fileAnalyses, // Send context for Step 3 drafting
                    step: 3,
                    customImages: customImages,
                    generatedDiagrams: generatedMap,
                    context: context
                })
            });

            if (!res.ok) throw new Error("Drafting failed");

            const data = await res.json();
            setContext(prev => ({ ...prev, visuals: data.result }));
            setStepStatus("complete");

        } catch (e: any) {
            setError(e.message || "Failed to generate draft");
            setStepStatus("idle");
        }
    };

    const handleFinalBind = async () => {
        try {
            const rName = repoDetails?.html_url || repoDetails?.full_name || repoDetails?.name;
            setCurrentStep(4);
            const res = await runStep(4, fileAnalyses, originalRepoUrl);
            const bookJson = JSON.parse(res);
            setFinalBook(bookJson);
            setMainStatus("done");
        } catch (e: any) {
            setError(e.message);
        }
    };

    // Render Helper for Diagram Card
    const renderDiagramCard = (type: string) => {
        const state = diagramStates[type] || { status: "idle" };
        const userImagesForType = customImages.filter(img => img.tag === type);

        return (
            <motion.div
                key={type}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col h-full hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-900/20"
            >
                <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

                <div className="relative z-10 flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-200 text-sm truncate pr-2" title={type}>{type}</h4>
                    {state.status === "success" && <div className="p-1 bg-green-500/10 rounded-full"><CheckCircle className="w-4 h-4 text-green-400" /></div>}
                    {state.status === "error" && <div className="p-1 bg-red-500/10 rounded-full"><AlertCircle className="w-4 h-4 text-red-400" /></div>}
                </div>

                <div className="relative z-10 flex-1 bg-black/40 rounded-xl mb-4 p-2 space-y-2 overflow-y-auto min-h-[140px] max-h-[160px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {/* Empty State */}
                    {state.status === "idle" && userImagesForType.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                            <BrainCircuit className="w-8 h-8 opacity-20" />
                            <span className="text-xs">No diagrams yet</span>
                        </div>
                    )}

                    {/* User Images */}
                    {userImagesForType.map((img, idx) => (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={idx} className="relative group/img rounded-lg overflow-hidden border border-blue-500/30">
                            <Image src={img.url} width={200} height={150} alt="User Image" className="w-full h-auto object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" />
                            <div className="absolute top-1 right-1 bg-blue-600/90 backdrop-blur-sm text-[10px] uppercase font-bold text-white px-2 py-0.5 rounded-full shadow-lg">User</div>
                        </motion.div>
                    ))}

                    {/* AI Image */}
                    {state.status === "success" && state.url && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative group/img rounded-lg overflow-hidden border border-purple-500/30">
                            <Image src={state.url} width={200} height={150} alt="AI Image" className="w-full h-auto object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" />
                            <div className="absolute top-1 right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-[10px] uppercase font-bold text-white px-2 py-0.5 rounded-full shadow-lg">AI Generated</div>
                        </motion.div>
                    )}

                    {state.status === "loading" && (
                        <div className="flex flex-col items-center justify-center h-full text-purple-400 gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500 blur-lg opacity-20 animate-pulse"></div>
                                <Loader2 className="w-8 h-8 animate-spin relative z-10" />
                            </div>
                            <span className="text-xs font-medium animate-pulse">Designing Architecture...</span>
                        </div>
                    )}
                </div>

                <div className="relative z-10">
                    <button
                        onClick={() => handleGenerateDiagram(type)}
                        disabled={state.status === "loading"}
                        className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 ${state.status === "success"
                            ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                            : state.status === "error"
                                ? "bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/20 border border-purple-500/20"
                            }`}
                    >
                        {state.status === "loading" ? "Processing..." : state.status === "success" ? <>Regenerate <BrainCircuit className="w-3 h-3" /></> : state.status === "error" ? <>Retry Generation <BrainCircuit className="w-3 h-3" /></> : <>Generate with AI <BrainCircuit className="w-3 h-3" /></>}
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="w-full min-h-screen pb-20 relative">
            {/* Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen"></div>
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

                {/* HERO Header */}
                <div className="text-center space-y-6 pt-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-300 mb-2"
                    >
                        <BrainCircuit className="w-3 h-3" />
                        <span>AI Document Generator</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500"
                    >
                        Transform Code into Knowledge
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-400 max-w-2xl mx-auto"
                    >
                        Generate comprehensive technical documentation, architecture diagrams, and interviews from your GitHub repository in minutes.
                    </motion.p>
                </div>

                {/* ERROR DISPLAY */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-900/20 border border-red-500/50 text-red-300 rounded-xl p-4 flex items-center justify-center gap-3 backdrop-blur-sm"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* AUTHENTICATION REQUIRED OVERLAY */}
                {status === "unauthenticated" && mainStatus === "idle" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
                        <div className="relative z-10">
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-8 transform -rotate-3">
                                <LogIn className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Authentication Required</h2>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                                Join GitDoc to unlock AI-powered documentation generation, mock interviews, and advanced code analysis features.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => router.push("/auth/signin")}
                                    className="px-8 py-3.5 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                                >
                                    <LogIn className="w-5 h-5" />
                                    Sign In
                                </button>
                                <button
                                    onClick={() => router.push("/auth/signup")}
                                    className="px-8 py-3.5 bg-white/10 text-white border border-white/20 font-bold rounded-xl hover:bg-white/20 transition-colors"
                                >
                                    Create Account
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* INITIAL URL INPUT */}
                {mainStatus === "idle" && status === "authenticated" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative z-20"
                    >
                        <div className="backdrop-blur-xl bg-gray-900/40 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl ring-1 ring-white/5">
                            <RepoInput onAnalyze={handleStart} isLoading={false} />
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap justify-center gap-4 mt-8 opacity-60">
                            {["Smart Parsing", "Visuals Generation", "PDF Export", "Code Analysis"].map((tag, i) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-gray-400 border border-white/5">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* PROCESSING UI */}
                {(mainStatus === "analyzing" || stepStatus === "scanning" || (stepStatus === "generating" && (currentStep === 4 || (!context.visuals && currentStep !== 3)))) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-3xl mx-auto shadow-2xl relative overflow-hidden"
                    >
                        {/* Ambient Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full animate-pulse"></div>

                        <div className="relative z-10 text-center">
                            <div className="flex justify-center mb-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-lg opacity-40 animate-pulse rounded-full"></div>
                                    <div className="bg-gray-900 rounded-full p-6 relative border border-white/10">
                                        {stepStatus === "generating" ? (
                                            <BrainCircuit className="w-12 h-12 text-purple-400 animate-pulse" />
                                        ) : (
                                            <ScanEye className="w-12 h-12 text-blue-400 animate-spin-slow" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <motion.h3
                                key={stepStatus}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl font-bold text-white mb-2"
                            >
                                {mainStatus === "analyzing" && "Analyzing Repository Structure..."}
                                {stepStatus === "scanning" && (
                                    currentStep === 3 ? "Analyzing Visual Requirements..." : `Step ${currentStep}: Context Scanning...`
                                )}
                                {stepStatus === "generating" && (
                                    currentStep === 3 ? "Drafting Architectural Visuals..." :
                                        currentStep === 4 ? "Compiling Final Book PDF..." :
                                            `Step ${currentStep}: Writing Chapter...`
                                )}
                            </motion.h3>

                            <p className="text-gray-400 mb-8 font-mono text-sm max-w-lg mx-auto truncate px-4 py-1 bg-white/5 rounded-full border border-white/5">
                                {scanFile || "Initializing..."}
                            </p>

                            <div className="w-full max-w-lg mx-auto bg-gray-800/50 rounded-full h-2 overflow-hidden border border-white/5">
                                <motion.div
                                    className={`h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] ${stepStatus === "generating" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gradient-to-r from-blue-500 to-cyan-500"}`}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "linear" }}
                                />
                            </div>
                            <p className="mt-3 text-xs text-gray-500 font-mono tracking-wider">{Math.round(progress)}% COMPLETE</p>
                        </div>
                    </motion.div>
                )}

                {/* STEP PROGRESS NAVIGATION */}
                {mainStatus === "step_flow" && (
                    <div className="sticky top-20 z-40 bg-black/60 backdrop-blur-xl border-y border-white/5 py-4 mb-8">
                        <div className="max-w-4xl mx-auto px-4">
                            <div className="relative">
                                {/* Track Line */}
                                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-800 -translate-y-1/2 rounded-full"></div>
                                <motion.div
                                    className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 -translate-y-1/2 rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />

                                <div className="relative flex justify-between items-center">
                                    {[1, 2, 3, 4].map((s) => {
                                        const isActive = currentStep >= s;
                                        const isCurrent = currentStep === s;

                                        return (
                                            <div key={s} className="flex flex-col items-center gap-3 bg-black/40 px-2 rounded-xl backdrop-blur-sm">
                                                <motion.div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all duration-300 z-10 ${isActive
                                                        ? "bg-gray-900 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                                                        : "bg-gray-900 border-gray-700 text-gray-600"
                                                        }`}
                                                    animate={{ scale: isCurrent ? 1.2 : 1 }}
                                                >
                                                    {currentStep > s ? <CheckCircle className="w-5 h-5" /> : s}
                                                </motion.div>
                                                <span className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${isActive ? "text-blue-300" : "text-gray-600"
                                                    }`}>
                                                    {s === 1 && "Vision"}
                                                    {s === 2 && "Structure"}
                                                    {s === 3 && "Visuals"}
                                                    {s === 4 && "Bind"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MAIN CONTENT AREA */}
                {mainStatus === "step_flow" && (stepStatus === "complete" || (currentStep === 3 && !context.visuals)) && (
                    <div className="w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            {/* Content Header */}
                            <div className="px-8 py-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Book className="text-blue-400 w-5 h-5" />
                                    </div>
                                    {currentStep === 1 && "Chapter 1: The Vision"}
                                    {currentStep === 2 && "Chapter 2: The Structure"}
                                    {currentStep === 3 && (context.visuals ? "Chapter 3: The Visuals" : "Configure Visuals")}
                                    {currentStep === 4 && "Final Book"}
                                </h2>
                                <div className="text-xs font-mono text-gray-500 uppercase tracking-wider border border-white/10 px-3 py-1 rounded-full">
                                    Generated Content
                                </div>
                            </div>

                            {/* STEP 1 & 2 TEXT CONTENT */}
                            {(currentStep === 1 || currentStep === 2) && (
                                <div className="p-8">
                                    <div className="prose prose-invert prose-lg max-w-none min-h-[400px] max-h-[60vh] overflow-y-auto custom-scrollbar bg-black/20 p-8 rounded-2xl border border-white/5 shadow-inner">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {currentStep === 1 ? context.textual : context.structure}
                                        </ReactMarkdown>
                                    </div>

                                    {/* REVIEW & PROCEED BUTTONS */}
                                    <div className="flex justify-end pt-8 mt-4">
                                        {currentStep === 1 && context.textual && (
                                            <button
                                                onClick={() => {
                                                    setCurrentStep(2);
                                                    runStep(2, fileAnalyses, originalRepoUrl);
                                                }}
                                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-bold text-lg flex items-center gap-3 shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-1 hover:border-blue-400 border border-transparent"
                                            >
                                                Proceed to Chapter 2: Structure <ArrowRight className="w-5 h-5" />
                                            </button>
                                        )}
                                        {currentStep === 2 && context.structure && (
                                            <button
                                                onClick={() => setCurrentStep(3)} // Just switch to interactive UI
                                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-bold text-lg flex items-center gap-3 shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-1 hover:border-blue-400 border border-transparent"
                                            >
                                                Proceed to Chapter 3: Visuals <ArrowRight className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3 INTERACTIVE GRID */}
                            {currentStep === 3 && !context.visuals && (
                                <div className="p-8 space-y-10 animate-in fade-in zoom-in duration-300">

                                    {/* Section 1: Upload */}
                                    <div className="bg-gradient-to-br from-blue-900/10 to-indigo-900/10 border border-blue-500/20 rounded-2xl p-6">
                                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-mono text-sm">1</div>
                                            Upload & Tag Custom Images
                                        </h3>
                                        <p className="text-sm text-gray-400 mb-6 ml-11 max-w-2xl">Upload existing diagrams, screenshots, or whiteboard sketches. Tag them to help the AI place them in the right section.</p>
                                        <div className="ml-11">
                                            <FileUploadDemo onFilesChange={setCustomImages} availableTags={DIAGRAM_OPTIONS} />
                                        </div>
                                    </div>

                                    {/* Section 2: AI Generation */}
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 pl-2">
                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-mono text-sm">2</div>
                                            Generate AI Diagrams
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-11">
                                            {DIAGRAM_OPTIONS.map(type => renderDiagramCard(type))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-8 border-t border-white/10">
                                        <button
                                            onClick={runDraftingStep}
                                            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-white font-bold text-xl flex items-center gap-3 shadow-xl hover:shadow-purple-500/25 transition-all transform hover:-translate-y-1 hover:scale-105"
                                        >
                                            <BrainCircuit className="w-6 h-6" />
                                            Draft Chapter 3 Now
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3 COMPLETED: DRAFTED CONTENT */}
                            {currentStep === 3 && context.visuals && (
                                <div className="p-8 space-y-8">
                                    <div className="prose prose-invert prose-lg max-w-none min-h-[500px] max-h-[70vh] overflow-y-auto bg-black/20 p-10 rounded-2xl border border-white/5 shadow-inner custom-scrollbar">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                img: ({ node, ...props }) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true }}
                                                        className="my-8"
                                                    >
                                                        <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                                                            <Image {...props} src={props.src || ""} alt={props.alt || ""} width={800} height={600} className="w-full h-auto" />
                                                        </div>
                                                        {props.alt && <p className="text-center text-sm text-gray-500 mt-2 italic">{props.alt}</p>}
                                                    </motion.div>
                                                )
                                            }}
                                        >
                                            {context.visuals}
                                        </ReactMarkdown>
                                    </div>

                                    <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-2xl border border-white/10">
                                        <button
                                            onClick={() => setContext(prev => ({ ...prev, visuals: "" }))}
                                            className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
                                        >
                                            <ArrowRight className="w-4 h-4 rotate-180" />
                                            Go Back & Refine Diagrams
                                        </button>
                                        <button
                                            onClick={handleFinalBind}
                                            className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-bold text-lg flex items-center gap-3 shadow-lg hover:shadow-green-500/25 transition-all transform hover:-translate-y-1"
                                        >
                                            Compile Final Book <Book className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* STEP 4: FINAL BOOK */}
                {currentStep === 4 && finalBook && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="w-full relative z-20"
                    >
                        <div className="flex items-center justify-center gap-3 text-green-400 mb-10 p-4 bg-green-500/10 rounded-full w-fit mx-auto border border-green-500/20 backdrop-blur-md">
                            <CheckCircle className="w-6 h-6" />
                            <span className="font-semibold text-lg">Book Generated Successfully</span>
                        </div>
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            <BookViewer bookData={finalBook} repoDetails={repoDetails} />
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
