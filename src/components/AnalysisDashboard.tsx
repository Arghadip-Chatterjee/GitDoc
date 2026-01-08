
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText, CheckCircle, AlertCircle, ArrowRight, Book, ScanEye, BrainCircuit, Image as ImageIcon } from "lucide-react";
import RepoInput from "./RepoInput";
import BookViewer from "./BookViewer";
import { FileUploadDemo } from "./FileUploadDemo";

type StepStatus = "idle" | "scanning" | "generating" | "complete";

export default function AnalysisDashboard() {
    const [mainStatus, setMainStatus] = useState<"idle" | "loading_repo" | "analyzing" | "step_flow" | "done" | "error">("idle");
    const [currentStep, setCurrentStep] = useState(0); // 0 = not started, 1=Vision, 2=Structure, 3=Visuals, 4=Book
    const [stepStatus, setStepStatus] = useState<StepStatus>("idle");

    const [error, setError] = useState("");
    const [repoDetails, setRepoDetails] = useState<any>(null);
    const [fileAnalyses, setFileAnalyses] = useState<any[]>([]);

    // Progress State
    const [progress, setProgress] = useState(0);
    const [scanFile, setScanFile] = useState(""); // File currently being "scanned"

    // Step Data Context
    const [context, setContext] = useState({
        textual: "",
        structure: "",
        visuals: ""
    });
    const [finalBook, setFinalBook] = useState<any>(null);
    const [customImages, setCustomImages] = useState<string[]>([]);
    const [skipAIImages, setSkipAIImages] = useState(false);

    // Initial Analysis (Real File Fetching)
    const analyzeFiles = async (repoData: any) => {
        const filesToAnalyze = repoData.files.filter((f: any) =>
            // Code files
            (f.path.endsWith('.ts') || f.path.endsWith('.tsx') || f.path.endsWith('.js') || f.path.endsWith('.jsx') ||
                f.path.endsWith('.py') || f.path.endsWith('.java') || f.path.endsWith('.go') || f.path.endsWith('.rs') ||
                f.path.endsWith('.md') || f.path.endsWith('.json') || f.path.endsWith('.css') || f.path.endsWith('.html')) ||
            // Images
            (f.path.endsWith('.png') || f.path.endsWith('.jpg') || f.path.endsWith('.jpeg') || f.path.endsWith('.svg') || f.path.endsWith('.webp') || f.path.endsWith('.gif')) ||
            // Config & Documentation
            (f.path.toLowerCase() === 'readme') ||
            (f.path.toLowerCase() === 'dockerfile') ||
            (f.path.toLowerCase() === 'package.json')
        ).filter((f: any) =>
            !f.path.includes('node_modules') &&
            !f.path.includes('package-lock.json') &&
            !f.path.includes('yarn.lock') &&
            !f.path.includes('pnpm-lock.yaml') &&
            !f.path.includes('dist/') &&
            !f.path.includes('build/') &&
            !f.path.includes('.git/') &&
            !f.path.includes('.next/') &&
            !f.path.includes('coverage/') &&
            !f.path.includes('__pycache__') &&
            !f.path.includes('.venv') &&
            !f.path.includes('venv/') &&
            !f.path.includes('.idea/') &&
            !f.path.includes('.vscode/') &&
            !f.path.includes('.DS_Store')
        ).slice(0, 15);

        const analyses = [];

        for (let i = 0; i < filesToAnalyze.length; i++) {
            const file = filesToAnalyze[i];
            setScanFile(file.path);

            const isImage = /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(file.path);

            if (isImage) {
                analyses.push({
                    path: file.path,
                    analysis: `[IMAGE FILE AVAILABLE] This is an image file located at ${file.path}. You should verify if it's relevant for architecture (e.g. diagrams) and include it in the documentation using markdown image syntax: ![${file.path.split(' / ').pop()}](${file.path})`
                });
            } else {
                const contentRes = await fetch(`/api/github/content?owner=${repoData.owner}&repo=${repoData.name}&path=${encodeURIComponent(file.path)}`);
                const contentData = await contentRes.json();

                if (contentRes.ok) {
                    const analyzeRes = await fetch("/api/analyze/file", {
                        method: "POST",
                        body: JSON.stringify({
                            content: contentData.content,
                            path: file.path,
                            language: file.path.split('.').pop()
                        })
                    });
                    const analyzeData = await analyzeRes.json();
                    if (analyzeRes.ok) {
                        analyses.push({ path: file.path, analysis: analyzeData.analysis });
                    }
                }
            }
            setProgress(((i + 1) / filesToAnalyze.length) * 100);
        }
        setFileAnalyses(analyses);
        return analyses;
    };

    // Simulate "Scanning" for each step (Visual Candy)
    const simulateStepScan = async (files: any[]) => {
        setStepStatus("scanning");
        setProgress(0);

        const scanDuration = 2000; // 2 seconds total scan time
        const stepTime = scanDuration / files.length;

        for (let i = 0; i < files.length; i++) {
            setScanFile(files[i].path);
            setProgress(((i + 1) / files.length) * 100);
            await new Promise(r => setTimeout(r, Math.min(stepTime, 100))); // Fast but visible
        }
    };

    const runStep = async (stepNumber: number, currentAnalyses: any[], repoName: string) => {
        try {
            // 1. Visual Scan
            await simulateStepScan(currentAnalyses);

            // 2. Generate
            setStepStatus("generating");
            setScanFile("Generating Content...");

            const res = await fetch("/api/analyze/report", {
                method: "POST",
                body: JSON.stringify({
                    repoName: repoName,
                    fileAnalyses: currentAnalyses,
                    step: stepNumber,
                    context: context,
                    customImages: customImages,
                    skipAIImages: skipAIImages
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

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
            // 1. Fetch Repo
            const repoRes = await fetch(`/api/github/repo?url=${encodeURIComponent(url)}`);
            const repoData = await repoRes.json();
            if (!repoRes.ok) throw new Error(repoData.error);
            setRepoDetails(repoData);

            // 2. Analyze Files (Initial)
            setMainStatus("analyzing");
            const analyses = await analyzeFiles(repoData);

            // 3. Start Step Flow
            setMainStatus("step_flow");
            setCurrentStep(1); // Ready for Step 1

            // Generate Step 1 immediately using the fetched data
            // Note: repoData.name might be the property, or repoData.repo.
            // Based on previous code it was repoData.repo or repoData.name.
            // Let's use repoData.name || repoData.repo to be safe.
            const rName = repoData.name || repoData.repo;
            const step1Result = await runStep(1, analyses, rName);
            setContext(prev => ({ ...prev, textual: step1Result }));

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setMainStatus("error");
        }
    };


    const generateImages = async () => {
        if (!context.visuals.includes("[[GENERATE_IMAGE:")) return;

        setStepStatus("generating");
        setScanFile("Generating AI Diagrams...");

        const regex = /\[\[GENERATE_IMAGE:\s*(.*?)\s*\|\s*(.*?)\]\]/g;
        let match;
        let newContent = context.visuals;

        // Find all matches first
        const matches = [];
        while ((match = regex.exec(context.visuals)) !== null) {
            matches.push({ full: match[0], title: match[1], prompt: match[2] });
        }

        for (let i = 0; i < matches.length; i++) {
            const m = matches[i];
            try {
                setScanFile(`Generating ${m.title}...`);
                setProgress(((i + 1) / matches.length) * 100); // Update progress for image generation
                const res = await fetch("/api/generate-image", {
                    method: "POST",
                    body: JSON.stringify({ prompt: m.prompt })
                });
                const data = await res.json();

                if (data.image) {
                    newContent = newContent.replace(m.full, `![${m.title}](${data.image})`);
                    // Update state incrementally to show progress
                    setContext(prev => ({ ...prev, visuals: newContent }));
                }
            } catch (e) {
                console.error("Failed to generate image:", e);
            }
        }

        setStepStatus("complete");
    };

    const handleNextStep = async () => {
        try {
            setStepStatus("idle");
            const rName = repoDetails?.name || repoDetails?.repo;

            if (currentStep === 1) {
                setCurrentStep(2);
                const res = await runStep(2, fileAnalyses, rName);
                setContext(prev => ({ ...prev, structure: res }));
            } else if (currentStep === 2) {
                setCurrentStep(3);
                const res = await runStep(3, fileAnalyses, rName);
                setContext(prev => ({ ...prev, visuals: res }));
            } else if (currentStep === 3) {
                // Check if AI images need generation
                if (context.visuals.includes("[[GENERATE_IMAGE:")) {
                    // If tags still exist, it means the user clicked "Compile & Bind Book" without generating images.
                    // We could warn them, or just proceed. For now, let's just proceed.
                    // The generateImages function is now triggered by a separate button.
                }

                setCurrentStep(4);
                const res = await runStep(4, fileAnalyses, rName);
                try {
                    const bookJson = JSON.parse(res);
                    setFinalBook(bookJson);
                    setMainStatus("done");
                } catch (e) {
                    throw new Error("Failed to parse final book JSON");
                }
            }
        } catch (err: any) {
            setError(err.message);
            setMainStatus("error");
        }
    };

    const hasImageTags = context.visuals.includes("[[GENERATE_IMAGE:");

    return (
        <div className="w-full max-w-5xl mx-auto space-y-12 min-h-screen">
            <div className="text-center space-y-6 pt-12">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-extrabold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
                >
                    GitHub Book Generator
                </motion.h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                    Turn your codebase into a beautiful, paginated technical book.
                </p>
            </div>

            {mainStatus === "idle" && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
                >
                    <RepoInput onAnalyze={handleStart} isLoading={false} />
                </motion.div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* PROCESSING UI (Used for Initial Analysis AND Per-Step Scanning/Generating) */}
            {(mainStatus === "analyzing" || stepStatus === "scanning" || stepStatus === "generating") && (
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
                        {stepStatus === "scanning" && `Step ${currentStep}: Scanning Context...`}
                        {stepStatus === "generating" && `Step ${currentStep}: Generating Chapter...`}
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

            {/* STEP COMPLETION UI (The "Next" Loop) */}
            {mainStatus === "step_flow" && stepStatus === "complete" && (
                <div className="max-w-4xl mx-auto mt-12 space-y-8">
                    {/* Progress Steps Indicator */}
                    <div className="flex justify-between items-center px-12">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= s ? "bg-green-500 text-white" : "bg-gray-700 text-gray-400"}`}>
                                    {currentStep > s ? <CheckCircle size={16} /> : s}
                                </div>
                                <span className="text-xs text-gray-400 uppercase tracking-widest">
                                    {s === 1 && "Vision"}
                                    {s === 2 && "Structure"}
                                    {s === 3 && "Visuals"}
                                    {s === 4 && "Bind"}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-2xl p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="text-green-400" />
                            {currentStep === 1 && "Chapter 1 Drafted: The Vision"}
                            {currentStep === 2 && "Chapter 2 Drafted: Structure"}
                            {currentStep === 3 && "Chapter 3 Drafted: Visuals"}
                        </h2>


                        <div className="prose prose-invert prose-lg max-w-none min-h-[500px] max-h-[70vh] overflow-y-auto bg-neutral-900/80 p-10 rounded-xl mb-8 border border-neutral-700 shadow-2xl custom-scrollbar leading-relaxed">
                            {currentStep === 1 && <ReactMarkdown remarkPlugins={[remarkGfm]}>{context.textual}</ReactMarkdown>}
                            {currentStep === 2 && <ReactMarkdown remarkPlugins={[remarkGfm]}>{context.structure}</ReactMarkdown>}
                            {currentStep === 3 && (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        img: ({ node, ...props }) => {
                                            let src = props.src || "";
                                            if (src && !src.startsWith("http") && repoDetails) {
                                                const branch = repoDetails.default_branch || "main";
                                                // Handle potential leading slash
                                                const cleanSrc = src.startsWith("/") ? src.slice(1) : src;
                                                src = `https://raw.githubusercontent.com/${repoDetails.owner.login}/${repoDetails.name}/${branch}/${cleanSrc}`;
                                            }
                                            return <img {...props} src={src} className="rounded-lg shadow-lg border border-gray-700 max-w-full h-auto my-4" />;
                                        }
                                    }}
                                >
                                    {context.visuals}
                                </ReactMarkdown>
                            )}
                        </div>

                        {currentStep === 3 && hasImageTags && (
                            <button
                                onClick={generateImages}
                                className="w-full mb-4 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-purple-500/25"
                            >
                                <BrainCircuit className="w-6 h-6 animate-pulse" />
                                Generate AI Diagrams (Architecture & DFD)
                            </button>
                        )}

                        {currentStep === 2 && (
                            <div className="mb-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <ImageIcon className="text-blue-400" />
                                    Visual Assets Configuration
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Upload & Select Custom Images for Documentation
                                        </label>
                                        <FileUploadDemo onSelectionChange={setCustomImages} />
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-lg border border-gray-700">
                                        <input
                                            type="checkbox"
                                            id="skipAI"
                                            checked={skipAIImages}
                                            onChange={(e) => setSkipAIImages(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-800"
                                        />
                                        <label htmlFor="skipAI" className="text-gray-200 cursor-pointer select-none">
                                            Skip AI Image Generation (Use only my uploaded images)
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleNextStep}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-1"
                        >
                            {currentStep === 1 && "Start Architecture Analysis"}
                            {currentStep === 2 && "Generate Diagrams & Visuals"}
                            {currentStep === 3 && "Compile & Bind Book"}
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {mainStatus === "done" && finalBook && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center justify-center gap-2 text-green-400 mb-8 p-4 bg-green-900/20 rounded-full w-fit mx-auto border border-green-900/50">
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-semibold text-lg">Book Generated Successfully</span>
                    </div>
                    <BookViewer bookData={finalBook} repoDetails={repoDetails} />
                </motion.div>
            )}
        </div>
    );
}
