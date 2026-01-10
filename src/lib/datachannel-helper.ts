// Helper to properly handle data channel events
export const setupDataChannelHandlers = (
    dc: RTCDataChannel,
    setTranscript: (fn: (prev: string[]) => string[]) => void,
    setFeedback: (text: string) => void,
    setStatus: (status: string) => void,
    currentStatus: string
) => {
    dc.onopen = () => {
        console.log("✅ Data channel opened");
    };

    dc.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log("📨 Data channel event:", message.type);

            // Capture various transcript event types from OpenAI Realtime API
            if (message.type === "response.audio_transcript.done") {
                const text = message.transcript || "";
                if (text) {
                    console.log("📝 Transcript:", text);
                    setTranscript(prev => [...prev, text]);
                }
            }

            // Alternative transcript event type
            if (message.type === "conversation.item.created") {
                const item = message.item;
                if (item?.role === "assistant" && item?.content) {
                    item.content.forEach((content: any) => {
                        if (content.transcript) {
                            console.log("📝 Assistant transcript:", content.transcript);
                            setTranscript(prev => [...prev, content.transcript]);
                        }
                    });
                }
            }

            // Capture feedback when in generating_feedback state
            if (message.type === "response.done") {
                console.log("✅ Response done:", message);

                // Extract all transcripts from the response
                let allText = "";
                if (message.response?.output) {
                    message.response.output.forEach((output: any) => {
                        if (output.content) {
                            output.content.forEach((content: any) => {
                                if (content.transcript) {
                                    allText += content.transcript + " ";
                                }
                            });
                        }
                    });
                }

                // If we're waiting for feedback, use this as feedback
                if (currentStatus === "generating_feedback" && allText.trim()) {
                    console.log("💬 Feedback received:", allText.trim());
                    setFeedback(allText.trim());
                    setStatus("ended");
                }
            }
        } catch (e) {
            console.error("❌ Data channel parse error:", e);
        }
    };

    dc.onerror = (error) => {
        console.error("❌ Data channel error:", error);
    };

    dc.onclose = () => {
        console.log("🔒 Data channel closed");
    };
};
