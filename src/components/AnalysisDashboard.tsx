"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText, CheckCircle, AlertCircle, ArrowRight, Book, ScanEye, BrainCircuit, Image as ImageIcon } from "lucide-react";
import RepoInput from "./RepoInput";
import BookViewer from "./BookViewer";
import { FileUploadDemo, TaggedFile } from "./FileUploadDemo";
import { analyzeRepoFiles } from "@/lib/github-loader";

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
    const [mainStatus, setMainStatus] = useState<"idle" | "loading_repo" | "analyzing" | "step_flow" | "done" | "error">("idle");
    const [currentStep, setCurrentStep] = useState(0); // 0 = not started, 1=Vision, 2=Structure, 3=Visuals, 4=Book
    const [stepStatus, setStepStatus] = useState<StepStatus>("idle");

    const [error, setError] = useState("");
    const [repoDetails, setRepoDetails] = useState<any>(null);
    const [fileAnalyses, setFileAnalyses] = useState<any[]>([]);

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
    const [diagramStates, setDiagramStates] = useState<Record<string, { status: "idle" | "loading" | "success" | "error", url?: string }>>({});

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
    const runStep = async (stepNumber: number, currentAnalyses: any[], repoName: string) => {
        try {
            await simulateStepScan(currentAnalyses);
            setStepStatus("generating");
            setScanFile("Generating Content...");

            const res = await fetch("/api/analyze/report", {
                method: "POST",
                body: JSON.stringify({
                    repoName: repoName,
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
        setMainStatus("loading_repo");
        setError("");
        setContext({ textual: "", structure: "", visuals: "" });
        setRepoDetails(null);
        setCurrentStep(0);
        setStepStatus("idle");

        try {
            const repoRes = await fetch(`/api/github/repo?url=${encodeURIComponent(url)}`);
            const repoData = await repoRes.json();
            if (!repoRes.ok) throw new Error(repoData.error);
            setRepoDetails(repoData);

            setMainStatus("analyzing");
            const analyses = await analyzeFiles(repoData);

            setMainStatus("step_flow");
            setCurrentStep(1);

            // Auto-run Step 1
            const rName = repoData.name || repoData.repo;
            await runStep(1, analyses, rName);

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
                    repoName: repoDetails.full_name,
                    context: aggregatedContext,
                    diagramType: diagramType
                })
            });

            const data = await res.json();

            if (data.success && data.url) {
                setDiagramStates(prev => ({
                    ...prev,
                    [diagramType]: { status: "success", url: data.url }
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

            // Prepare "Generated Diagrams" map
            const generatedMap: Record<string, string> = {};
            Object.entries(diagramStates).forEach(([type, state]) => {
                if (state.status === "success" && state.url) {
                    generatedMap[type] = state.url;
                }
            });

            const res = await fetch("/api/analyze/report", {
                method: "POST",
                body: JSON.stringify({
                    repoName: repoDetails.full_name,
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
            const rName = repoDetails?.name || repoDetails?.repo;
            setCurrentStep(4);
            const res = await runStep(4, fileAnalyses, rName);
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
            <div key={type} className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 flex flex-col h-full hover:border-neutral-600 transition-all shadow-lg hover:shadow-xl">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-neutral-200 text-sm truncate" title={type}>{type}</h4>
                    {state.status === "success" && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {state.status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>

                <div className="flex-1 bg-neutral-900/50 rounded-lg mb-3 p-2 space-y-2 overflow-y-auto min-h-[120px] max-h-[150px] scrollbar-thin">
                    {/* User Images */}
                    {userImagesForType.map((img, idx) => (
                        <div key={idx} className="relative group rounded-md overflow-hidden border border-blue-500/30">
                            <img src={img.url} className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-1 right-1 bg-blue-600/80 text-[10px] text-white px-1.5 py-0.5 rounded">User</div>
                        </div>
                    ))}

                    {/* AI Image */}
                    {state.status === "success" && state.url && (
                        <div className="relative group rounded-md overflow-hidden border border-purple-500/30">
                            <img src={state.url} className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-1 right-1 bg-purple-600/80 text-[10px] text-white px-1.5 py-0.5 rounded">AI</div>
                        </div>
                    )}

                    {state.status === "loading" && (
                        <div className="flex flex-col items-center justify-center h-24 text-neutral-500 gap-2">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-xs">Generating...</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => handleGenerateDiagram(type)}
                    disabled={state.status === "loading"}
                    className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${state.status === "success"
                        ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-400"
                        : state.status === "error"
                            ? "bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40"
                            : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20"
                        }`}
                >
                    {state.status === "loading" ? "Creating..." : state.status === "success" ? <>Regenerate <BrainCircuit className="w-3 h-3" /></> : state.status === "error" ? <>Retry <BrainCircuit className="w-3 h-3" /></> : <>Generate AI <BrainCircuit className="w-3 h-3" /></>}
                </button>
            </div>
        );
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-12 min-h-screen pb-20">
            <div className="text-center space-y-6 pt-12">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-extrabold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
                >
                    GitDoc AI
                </motion.h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                    Turn your codebase into a beautiful, paginated technical book.
                </p>
            </div>

            {/* ERROR DISPLAY */}
            {error && (
                <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* INITIAL URL INPUT */}
            {mainStatus === "idle" && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
                >
                    <RepoInput onAnalyze={handleStart} isLoading={false} />
                </motion.div>
            )}

            {/* PROCESSING UI (Used for Initial Analysis AND Per-Step Scanning/Generating) */}
            {(mainStatus === "analyzing" || stepStatus === "scanning" || (stepStatus === "generating" && (currentStep === 4 || (!context.visuals && currentStep !== 3)))) && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 max-w-2xl mx-auto text-center bg-gray-900/50 p-8 rounded-2xl border border-gray-700 backdrop-blur-md"
                >
                    <div className="flex justify-center mb-6">
                        {stepStatus === "generating" ? (
                            <BrainCircuit className="w-16 h-16 text-purple-500 animate-pulse" />
                        ) : (
                            <ScanEye className="w-16 h-16 text-blue-400 animate-bounce" />
                        )}
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">
                        {mainStatus === "analyzing" && "Analyzing Repository..."}
                        {stepStatus === "scanning" && (
                            currentStep === 3 ? "Analyzing visual requirements..." : `Step ${currentStep}: Scanning Context...`
                        )}
                        {stepStatus === "generating" && (
                            currentStep === 3 ? "Drafting Visual Assets..." :
                                currentStep === 4 ? "Compiling Final Book..." :
                                    `Step ${currentStep}: Generating Chapter...`
                        )}
                    </h3>

                    <p className="text-gray-400 mb-6 font-mono text-sm truncate">
                        {scanFile}
                    </p>

                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
                        <motion.div
                            className={`h-full rounded-full ${stepStatus === "generating" ? "bg-purple-600" : "bg-blue-500"}`}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 font-mono">{Math.round(progress)}%</p>
                </motion.div>
            )}

            {/* STEP PROGRESS INDICATOR */}
            {mainStatus === "step_flow" && (
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center px-12 mb-8">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep >= s
                                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-gray-800 border border-gray-700 text-gray-400"
                                    }`}>
                                    {currentStep > s ? <CheckCircle size={20} /> : s}
                                </div>
                                <span className={`text-xs uppercase tracking-widest font-semibold ${currentStep >= s ? "text-blue-400" : "text-gray-600"
                                    }`}>
                                    {s === 1 && "Vision"}
                                    {s === 2 && "Structure"}
                                    {s === 3 && "Visuals"}
                                    {s === 4 && "Bind"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN CONTENT for Steps */}
            {mainStatus === "step_flow" && (stepStatus === "complete" || (currentStep === 3 && !context.visuals)) && (
                <div className="max-w-5xl mx-auto">

                    <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 rounded-2xl p-8 shadow-2xl">

                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <CheckCircle className="text-green-400 w-8 h-8" />
                            {currentStep === 1 && "Chapter 1: The Vision"}
                            {currentStep === 2 && "Chapter 2: The Structure"}
                            {currentStep === 3 && (context.visuals ? "Chapter 3: The Visuals" : "Configure Visuals")}
                            {currentStep === 4 && "Final Book"}
                        </h2>

                        {/* STEP 1 & 2 TEXT CONTENT */}
                        {(currentStep === 1 || currentStep === 2) && (
                            <div className="space-y-6">
                                <div className="prose prose-invert prose-lg max-w-none min-h-[400px] max-h-[60vh] overflow-y-auto custom-scrollbar bg-neutral-950/50 p-6 rounded-xl border border-neutral-800">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {currentStep === 1 ? context.textual : context.structure}
                                    </ReactMarkdown>
                                </div>

                                {/* REVIEW & PROCEED BUTTONS */}
                                <div className="flex justify-end pt-4 border-t border-neutral-800">
                                    {currentStep === 1 && context.textual && (
                                        <button
                                            onClick={() => {
                                                setCurrentStep(2);
                                                runStep(2, fileAnalyses, repoDetails?.name);
                                            }}
                                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-bold text-lg flex items-center gap-3 shadow-xl hover:shadow-blue-500/25 transition-all transform hover:-translate-y-1"
                                        >
                                            Proceed to Chapter 2: Structure <ArrowRight className="w-6 h-6" />
                                        </button>
                                    )}
                                    {currentStep === 2 && context.structure && (
                                        <button
                                            onClick={() => setCurrentStep(3)} // Just switch to interactive UI
                                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-bold text-lg flex items-center gap-3 shadow-xl hover:shadow-blue-500/25 transition-all transform hover:-translate-y-1"
                                        >
                                            Proceed to Chapter 3: Visuals <ArrowRight className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 3 INTERACTIVE GRID (If visuals not generated yet) */}
                        {currentStep === 3 && !context.visuals && (
                            <div className="space-y-8 animate-in fade-in zoom-in duration-300">

                                <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                                    <h3 className="text-xl font-bold text-blue-100 mb-2 flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5 text-blue-400" />
                                        1. Upload & Tag Custom Images
                                    </h3>
                                    <p className="text-sm text-blue-200/60 mb-4">Upload your own diagrams or screenshots and tag them to sections.</p>
                                    <FileUploadDemo onFilesChange={setCustomImages} availableTags={DIAGRAM_OPTIONS} />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-purple-100 mb-4 flex items-center gap-2 pl-2">
                                        <BrainCircuit className="w-5 h-5 text-purple-400" />
                                        2. Generate AI Diagrams
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {DIAGRAM_OPTIONS.map(type => renderDiagramCard(type))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={runDraftingStep}
                                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-bold text-lg flex items-center gap-3 shadow-xl hover:shadow-blue-500/25 transition-all transform hover:-translate-y-1"
                                    >
                                        Draft Chapter 3 Now <ArrowRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3 COMPLETED: DRAFTED CONTENT */}
                        {currentStep === 3 && context.visuals && (
                            <div className="space-y-6">
                                <div className="prose prose-invert prose-lg max-w-none min-h-[500px] max-h-[70vh] overflow-y-auto bg-neutral-950/80 p-6 rounded-xl border border-neutral-800 shadow-inner custom-scrollbar">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            img: ({ node, ...props }) => (
                                                <img {...props} className="rounded-lg shadow-lg border border-neutral-700 max-w-full h-auto my-6 mx-auto block" />
                                            )
                                        }}
                                    >
                                        {context.visuals}
                                    </ReactMarkdown>
                                </div>
                                <div className="flex justify-between items-center bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                                    <button
                                        onClick={() => setContext(prev => ({ ...prev, visuals: "" }))}
                                        className="text-sm text-neutral-400 hover:text-white underline decoration-dashed underline-offset-4"
                                    >
                                        ← Go Back & Refine Diagrams
                                    </button>
                                    <button
                                        onClick={handleFinalBind}
                                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-bold text-lg flex items-center gap-3 shadow-xl hover:shadow-green-500/25 transition-all transform hover:-translate-y-1"
                                    >
                                        Compile Final Book <Book className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* STEP 4: FINAL BOOK */}
            {currentStep === 4 && finalBook && (
                <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700">
                    <div className="flex items-center justify-center gap-3 text-green-400 mb-8 p-4 bg-green-900/20 rounded-full w-fit mx-auto border border-green-900/50">
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-semibold text-lg">Book Generated Successfully</span>
                    </div>
                    <BookViewer bookData={finalBook} repoDetails={repoDetails} />
                </div>
            )}
        </div>
    );
}
