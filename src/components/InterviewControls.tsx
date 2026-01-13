import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mic, MicOff, PhoneOff, Play, Loader2, Clock, Volume2, CheckCircle, BrainCircuit, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InterviewControlsProps {
    repoName: string;
    fileContext: string;
    architectureContext: string;
    onEnd: () => void;
}

export default function InterviewControls({ repoName, fileContext, architectureContext, onEnd }: InterviewControlsProps) {
    const [status, setStatus] = useState<"idle" | "getting_token" | "connecting" | "active" | "summarizing" | "ended" | "generating_feedback">("idle");
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
    const [isMuted, setIsMuted] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [transcript, setTranscript] = useState<string[]>([]);
    const [interviewId, setInterviewId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);


    const finalizeSession = useCallback(() => {
        setStatus("ended");
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
    }, []);

    const startSummarization = useCallback(() => {
        if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
            finalizeSession();
            return;
        }

        setStatus("summarizing");
        console.log("📝 Timer ended. Requesting summary...");

        try {
            // 1. Insert User Message: "Time is up..."
            const createItemEvent = {
                type: "conversation.item.create",
                item: {
                    type: "message",
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: "Our time is up. Please provide a concise summary of the interview now, highlighting what we discussed and your key feedback. Keep it brief."
                        }
                    ]
                }
            };
            dataChannelRef.current.send(JSON.stringify(createItemEvent));

            // 2. Force Response Generation
            const responseCreateEvent = {
                type: "response.create",
                response: {
                    modalities: ["audio", "text"],
                }
            };
            dataChannelRef.current.send(JSON.stringify(responseCreateEvent));

        } catch (e) {
            console.error("Failed to start summary:", e);
            finalizeSession();
        }
    }, [finalizeSession]);

    // Timer Logic
    useEffect(() => {
        if (status === "active" && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && status === "active") {
            // Timer ended - Start summarization automatically
            startSummarization();
        }
    }, [status, timeLeft, startSummarization]);

    // Summarization Timeout Logic
    useEffect(() => {
        if (status === "summarizing") {
            const timeout = setTimeout(() => {
                console.log("⚠️ Summarization timed out (10s limit). Ending session.");
                finalizeSession();
            }, 10000); // 10 seconds
            return () => clearTimeout(timeout);
        }
    }, [status, finalizeSession]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startSession = async () => {
        try {
            setStatus("getting_token");
            setTranscript([]);
            setFeedback("");

            // 1. Get Ephemeral Token
            // Pass the full context to the backend to prime the model
            const tokenRes = await fetch("/api/interview/token", {
                method: "POST",
                body: JSON.stringify({ repoName, fileContext, architectureContext }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await tokenRes.json();
            const EPHEMERAL_KEY = data.client_secret.value;

            // Store interview ID for later use
            if (data.interviewId) {
                setInterviewId(data.interviewId);
            }

            setStatus("connecting");

            // 2. Setup WebRTC
            const pc = new RTCPeerConnection();
            peerConnectionRef.current = pc;

            // Audio Element setup
            if (audioRef.current) {
                audioRef.current.autoplay = true;
                pc.ontrack = (e) => {
                    if (audioRef.current) audioRef.current.srcObject = e.streams[0];
                };
            }

            // User Mic
            const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = ms;
            pc.addTrack(ms.getTracks()[0]);

            // Data Channel (for events)
            const dc = pc.createDataChannel("oai-events");
            dataChannelRef.current = dc;

            dc.onopen = () => console.log("✅ Data channel opened");

            dc.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    // Log basic types to avoid spam
                    if (message.type === "response.audio_transcript.done" ||
                        message.type === "response.output_audio_transcript.done" ||
                        message.type === "conversation.item.created") {

                        // Capture transcripts
                        let text = "";
                        if (message.type === "response.audio_transcript.done") text = message.transcript;
                        if (message.type === "response.output_audio_transcript.done") text = message.transcript;
                        if (message.type === "conversation.item.created" && message.item?.content) {
                            message.item.content.forEach((c: any) => {
                                if (c.transcript) text = c.transcript;
                                if (c.text) text = c.text;
                            });
                        }

                        if (text) {
                            console.log("📝 Transcript:", text);
                            setTranscript(prev => [...prev, text]);
                        }
                    }

                    // Detect when the summary response is finished
                    if (message.type === "response.done" && status === "summarizing") {
                        console.log("✅ Summary finished. Ending session.");
                        finalizeSession();
                    }

                } catch (e) {
                    console.error("❌ Parse error:", e);
                }
            };

            dc.onerror = (err) => console.error("❌ DC error:", err);
            dc.onclose = () => console.log("🔒 DC closed");

            // 3. Create Offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // 4. Connect to OpenAI Realtime API
            const baseUrl = "https://api.openai.com/v1/realtime";
            const model = "gpt-4o-mini-realtime-preview-2024-12-17";

            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: "POST",
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${EPHEMERAL_KEY}`,
                    "Content-Type": "application/sdp"
                },
            });

            const answer = {
                type: "answer" as const,
                sdp: await sdpResponse.text(),
            };
            await pc.setRemoteDescription(answer);

            setStatus("active");

        } catch (err) {
            console.error("Session Start Failed:", err);
            // setError("Failed to start interview session. Please try again.");
            setStatus("idle");
        }
    };


    const handleGenerateReport = async () => {
        setStatus("generating_feedback");
        try {
            const res = await fetch("/api/interview/feedback", {
                method: "POST",
                body: JSON.stringify({
                    transcript: transcript,
                    repoName: repoName,
                    interviewId: interviewId
                })
            });
            const data = await res.json();
            if (data.result) {
                setFeedback(data.result);
            } else {
                setFeedback("Failed to generate detailed feedback.");
            }
        } catch (e) {
            console.error(e);
            setFeedback("Error generating feedback.");
        } finally {
            setStatus("ended"); // Return to ended state to show the result
        }
    };


    const handleEndSession = () => {
        if (status === "active") {
            setShowEndModal(true);
        } else {
            finalizeSession();
        }
    };


    const confirmEndSession = () => {
        // When user manually ends, don't generate feedback - just close
        setShowEndModal(false);
        setFeedback("Interview ended early. Please complete the full 5-minute interview to receive AI-generated feedback.");
        setStatus("ended");
        // Close connections immediately
        if (peerConnectionRef.current) peerConnectionRef.current.close();
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        if (dataChannelRef.current) dataChannelRef.current.close();
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks()[0].enabled = !localStreamRef.current.getAudioTracks()[0].enabled;
            setIsMuted(!isMuted);
        }
    };

    const forceExit = () => {
        if (peerConnectionRef.current) peerConnectionRef.current.close();
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        if (dataChannelRef.current) dataChannelRef.current.close();
        onEnd();
    };

    const closeSession = () => {
        setShowCloseModal(true);
    };

    const confirmCloseSession = () => {
        setShowCloseModal(false);
        if (peerConnectionRef.current) peerConnectionRef.current.close();
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        if (dataChannelRef.current) dataChannelRef.current.close();
        onEnd();
    };

    return (
        <div className="flex flex-col h-full bg-black border border-white/10 rounded-2xl relative overflow-hidden font-sans">
            {/* End Confirmation Modal */}
            <AnimatePresence>
                {showEndModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowEndModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-neutral-900 border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
                        >
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">End Interview?</h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    Are you sure you want to end the interview session? You can generate detailed feedback afterwards.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowEndModal(false)}
                                    className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors border border-white/10 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmEndSession}
                                    className="flex-1 py-2.5 bg-red-900/20 hover:bg-red-900/30 text-red-500 border border-red-900/40 font-medium rounded-lg transition-colors text-sm"
                                >
                                    End Session
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Close Confirmation Modal */}
            <AnimatePresence>
                {showCloseModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCloseModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-neutral-900 border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
                        >
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">Close Session?</h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    Are you sure you want to leave? Any unsaved progress will be lost.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowCloseModal(false)}
                                    className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors border border-white/10 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCloseSession}
                                    className="flex-1 py-2.5 bg-red-900/20 hover:bg-red-900/30 text-red-500 border border-red-900/40 font-medium rounded-lg transition-colors text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Application Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-lg font-bold text-white tracking-wide">Mock Interview</h2>
                        <span className="bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-600/30">BETA</span>
                    </div>
                    <p className="text-neutral-500 text-xs font-mono">{repoName}</p>
                </div>
                <div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${status === 'active'
                        ? 'bg-green-500/10 border-green-500/20 text-green-500'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`} />
                        {status === 'active' ? 'Live' : 'Offline'}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] opacity-10 pointer-events-none"></div>

                {status === "idle" ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center w-full max-w-md relative z-10"
                    >
                        {/* Signal Icon Circle */}
                        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center relative shadow-2xl">
                            <div className="absolute inset-0 rounded-full border border-white/5 scale-110 opacity-50"></div>
                            <div className="absolute inset-0 rounded-full border border-white/5 scale-125 opacity-20"></div>
                            <Wifi className="w-8 h-8 text-neutral-500" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3">Ready to Start</h3>
                        <p className="text-neutral-500 text-sm leading-relaxed mb-4">
                            The AI has analyzed your repository context. Click "Start Interview" to begin your 5-minute technical screening.
                        </p>
                    </motion.div>
                ) : status === "active" || status === "getting_token" || status === "connecting" || status === "summarizing" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center relative z-10">
                        {/* Active Visualizer */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative flex flex-col items-center"
                        >
                            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full animate-pulse" />

                                {/* Orbital Rings */}
                                <div className="absolute inset-0 border border-blue-500/20 rounded-full animate-[spin_8s_linear_infinite]" />
                                <div className="absolute inset-4 border border-blue-500/10 rounded-full animate-[spin_12s_linear_infinite_reverse]" />

                                {/* Center Core */}
                                <div className="relative w-24 h-24 bg-black rounded-full border border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                                    {status === "getting_token" || status === "connecting" ? (
                                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                                    ) : (
                                        <div className="flex gap-1 items-end h-8">
                                            {[...Array(5)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-1.5 bg-blue-500 rounded-full"
                                                    animate={{
                                                        height: [8, Math.random() * 24 + 8, 8],
                                                        opacity: [0.5, 1, 0.5]
                                                    }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 0.5,
                                                        delay: i * 0.1,
                                                        ease: "easeInOut"
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 text-center">
                                <h4 className="text-xl font-bold text-white">
                                    {status === "connecting" ? "Connecting..." :
                                        status === "summarizing" ? "Summarizing..." : "Interview in Progress"}
                                </h4>
                                <p className="text-neutral-500 text-sm font-mono">
                                    {status === "summarizing" ? "AI is generating feedback" : "AI is listening"}
                                </p>
                            </div>
                        </motion.div>

                        {/* Live Transcript Toast */}
                        <AnimatePresence>
                            {transcript.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-lg bg-neutral-900/90 backdrop-blur border border-white/10 rounded-t-xl p-4 shadow-2xl"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Live Transcript</span>
                                    </div>
                                    <p className="text-neutral-300 text-xs font-mono leading-relaxed line-clamp-2">
                                        {transcript[transcript.length - 1]}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-full flex flex-col md:flex-row gap-6 overflow-hidden"
                    >
                        {/* Left Side: Summary & Actions */}
                        <div className="md:w-1/3 flex flex-col gap-4 flex-shrink-0 min-h-0 overflow-y-auto">
                            <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6 text-center shadow-lg">
                                <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">Interview Complete</h3>
                                <p className="text-neutral-500 text-xs">Session recorded successfully</p>
                            </div>

                            <div className="flex-1 bg-neutral-900/50 border border-white/10 rounded-xl p-4 flex flex-col justify-center gap-3 shadow-lg">
                                {!feedback && status !== "generating_feedback" && (
                                    <button
                                        onClick={handleGenerateReport}
                                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group"
                                    >
                                        <BrainCircuit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        Generate AI Report
                                    </button>
                                )}
                                <button
                                    onClick={closeSession}
                                    className="w-full py-3 bg-neutral-800 text-white font-bold rounded-lg hover:bg-neutral-700 transition-colors text-sm border border-white/10"
                                >
                                    Return to Menu
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Feedback / Transcript */}
                        <div className="flex-1 bg-neutral-900/50 border border-white/10 rounded-xl p-6 min-h-0 overflow-hidden flex flex-col shadow-lg relative">
                            {/* Tabs / Header for Right Panel */}
                            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2 flex-shrink-0">
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    {status === "generating_feedback" ? (
                                        <><Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> Generating Analysis...</>
                                    ) : feedback ? (
                                        <><BrainCircuit className="w-4 h-4 text-purple-400" /> Analysis Report</>
                                    ) : (
                                        <><Mic className="w-4 h-4 text-blue-400" /> Transcript Preview</>
                                    )}
                                </h4>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-700">
                                {status === "generating_feedback" ? (
                                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                                        <div className="relative w-full max-w-xs">
                                            <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-blue-500"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 8, ease: "linear" }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-neutral-500 font-mono">
                                                <span>ANALYZING</span>
                                                <span>GENERATING</span>
                                            </div>
                                        </div>
                                        <p className="text-neutral-400 text-sm animate-pulse">
                                            Reviewing conversation context and generating technical feedback...
                                        </p>
                                    </div>
                                ) : feedback ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
                                    </div>
                                ) : transcript.length > 0 ? (
                                    <div className="space-y-3">
                                        {transcript.map((text, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-[10px] text-blue-400 font-mono">{idx + 1}</span>
                                                </div>
                                                <p className="text-neutral-300 text-xs leading-relaxed font-mono">
                                                    {text}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-2">
                                        <BrainCircuit className="w-12 h-12 opacity-20" />
                                        <p className="text-sm">Generate report to view insights</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Footer Control Bar */}
            <div className="border-t border-white/10 bg-neutral-900/30 p-6">
                <div className="flex flex-col items-center justify-center gap-6">
                    {/* Timer Display */}
                    {status !== "generating_feedback" && status !== "summarizing" && status !== "ended" && (
                        <div className="flex items-center gap-2 text-neutral-500 font-mono text-xs uppercase tracking-widest">
                            <Clock className="w-3.5 h-3.5" />
                            <span className={timeLeft < 30 ? "text-red-400" : ""}>{formatTime(timeLeft)} remaining</span>
                        </div>
                    )}

                    {/* Primary Button */}
                    <div className="w-full max-w-xs">
                        {status === "idle" ? (
                            <button
                                onClick={startSession}
                                className="w-full py-3.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
                            >
                                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                                Start Interview
                            </button>
                        ) : status === "active" ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={toggleMute}
                                    className={`p-3.5 rounded-lg border transition-all ${isMuted
                                        ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                        : 'bg-neutral-800 border-white/10 text-white hover:bg-neutral-700'
                                        }`}
                                >
                                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={handleEndSession}
                                    className="flex-1 py-3.5 bg-red-900/20 hover:bg-red-900/30 text-red-500 border border-red-900/30 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <PhoneOff className="w-4 h-4" />
                                    End Session
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Hidden Audio Element for Output */}
            <audio ref={audioRef} className="hidden" />
        </div>
    );
}
