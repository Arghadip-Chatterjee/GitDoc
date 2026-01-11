import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mic, MicOff, PhoneOff, Play, Loader2, Clock, Volume2, Radio, CheckCircle, BrainCircuit } from "lucide-react";
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
        if (peerConnectionRef.current) peerConnectionRef.current.close();
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        if (dataChannelRef.current) dataChannelRef.current.close();
        onEnd();
    };

    return (
        <div className="flex flex-col h-full bg-neutral-900/50 backdrop-blur-xl border border-white/10 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

            {/* End Confirmation Modal */}
            <AnimatePresence>
                {showEndModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowEndModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4"
                        >
                            <h3 className="text-xl font-bold text-white">End Interview?</h3>
                            <p className="text-neutral-400">
                                Are you sure you want to end the interview session? You can generate detailed feedback afterwards.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEndModal(false)}
                                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-colors border border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmEndSession}
                                    className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold rounded-xl transition-colors"
                                >
                                    End Session
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="relative z-10 p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                        Mock Interview
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium">
                            BETA
                        </span>
                    </h2>
                    <p className="text-sm text-neutral-400 mt-1 max-w-[300px] truncate">
                        {repoName}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${status === 'active' || status === 'summarizing'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${status === 'active' || status === 'summarizing' ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`} />
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            {status === 'active' ? 'Live' : status === 'summarizing' ? 'Summarizing' : status === 'ended' ? 'Finished' : 'Offline'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Visualizer Area */}
            <div className={`flex-1 relative flex flex-col p-4 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent`}>
                {status === "active" || status === "summarizing" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        {/* Centered Orb - Always in center */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative flex flex-col items-center"
                        >
                            {/* Glowing Orb Animation */}
                            <div className="relative w-48 h-48 flex items-center justify-center">
                                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                                <div className="absolute inset-4 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-full opacity-20 animate-spin-slow blur-md" />
                                <div className="relative w-32 h-32 bg-black rounded-full border border-blue-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-b from-blue-900/50 to-black overflow-hidden flex items-center justify-center relative">
                                        <div className="space-y-1 flex items-center justify-center gap-1">
                                            {[...Array(3)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-1.5 bg-blue-400 rounded-full"
                                                    animate={{ height: [10, 24, 10] }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 1,
                                                        delay: i * 0.2,
                                                        ease: "easeInOut"
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-blue-200/50 text-sm mt-8 font-mono animate-pulse">
                                {status === "summarizing" ? "AI is summarizing..." : "AI is listening..."}
                            </p>
                        </motion.div>

                        {/* Live Transcript - Fixed at Bottom */}
                        {transcript.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute bottom-4 left-4 right-4 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-lg p-3 max-h-32 overflow-y-auto shadow-2xl"
                            >
                                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/10">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    <h4 className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">Live Transcript</h4>
                                </div>
                                <div className="space-y-1">
                                    {transcript.slice(-3).map((text, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-neutral-300 text-[11px] leading-snug"
                                        >
                                            {text}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                ) : status === "generating_feedback" ? (
                    <div className="m-auto text-center space-y-6 max-w-md">
                        <Loader2 className="w-16 h-16 mx-auto text-blue-400 animate-spin" />
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Generating Feedback...</h3>
                            <p className="text-neutral-400 text-sm">
                                The AI is analyzing your performance and preparing detailed feedback.
                            </p>
                        </div>
                    </div>
                ) : status === "ended" ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-2xl space-y-6 m-auto flex-shrink-0"
                    >
                        <div className="text-center mb-2">
                            <h3 className="text-2xl font-bold text-white mb-2">Interview Complete!</h3>
                            <p className="text-neutral-400 text-sm">
                                {feedback ? "Here's your performance feedback" : "You can now generate a detailed report."}
                            </p>
                        </div>

                        {/* Transcript Display */}
                        {transcript.length > 0 && (
                            <div className="bg-neutral-800/50 border border-white/5 rounded-xl p-6 space-y-3">
                                <h4 className="text-base font-semibold text-purple-400">Conversation Transcript</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-700">
                                    {transcript.map((text, idx) => (
                                        <p key={idx} className="text-neutral-300 text-xs leading-relaxed border-l-2 border-purple-500/20 pl-3">
                                            {text}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Feedback Display */}
                        {feedback && (
                            <div className="bg-neutral-800/50 border border-white/5 rounded-xl p-6 space-y-3 animate-in fade-in slide-in-from-bottom-5">
                                <h4 className="text-base font-semibold text-blue-400 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> AI Feedback
                                </h4>
                                <div className="prose prose-invert prose-sm max-w-none text-neutral-300">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4">
                            {!feedback && (
                                <button
                                    onClick={handleGenerateReport}
                                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                >
                                    <BrainCircuit className="w-5 h-5" />
                                    Generate Detailed Report
                                </button>
                            )}
                            <button
                                onClick={closeSession}
                                className={`py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all text-sm ${feedback ? 'w-full' : 'w-1/3'}`}
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="text-center space-y-6 max-w-sm">
                        <div className="w-24 h-24 mx-auto bg-neutral-800/50 rounded-full flex items-center justify-center border border-white/5">
                            <Radio className="w-10 h-10 text-neutral-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Ready to Start</h3>
                            <p className="text-neutral-400 text-sm">
                                The AI has analyzed your repository context. Click "Start Interview" to begin your 5-minute technical screening.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Controls */}
            {status !== "ended" && (
                <div className="p-6 bg-neutral-900/80 backdrop-blur-xl border-t border-white/5">
                    <div className="max-w-md mx-auto w-full space-y-6">
                        {/* Timer */}
                        {status !== "generating_feedback" && status !== "summarizing" && (
                            <div className="flex items-center justify-center gap-2 text-neutral-400 font-mono text-sm">
                                <Clock className="w-4 h-4" />
                                <span className={timeLeft < 60 ? "text-red-400 font-bold" : ""}>
                                    {formatTime(timeLeft)} remaining
                                </span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-4">
                            {status === "idle" ? (
                                <button
                                    onClick={startSession}
                                    className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all transform hover:scale-[1.02] shadow-xl"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    Start Interview
                                </button>
                            ) : status === "getting_token" || status === "connecting" ? (
                                <button disabled className="w-full py-4 bg-neutral-800 text-neutral-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-white/5">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Establishing Secure Connection...
                                </button>
                            ) : status === "summarizing" ? (
                                <button disabled className="w-full py-4 bg-purple-500/10 text-purple-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-purple-500/20">
                                    <div className="flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                                    </div>
                                    Summarizing Conversation...
                                </button>
                            ) : status === "generating_feedback" ? (
                                <button disabled className="w-full py-4 bg-neutral-800 text-neutral-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-white/5">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating Feedback...
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={toggleMute}
                                        className={`px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isMuted
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-white/10'
                                            }`}
                                    >
                                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={handleEndSession}
                                        className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                                    >
                                        <PhoneOff className="w-5 h-5" />
                                        End Session
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Audio Element for Output */}
            <audio ref={audioRef} className="hidden" />
        </div>
    );
}
