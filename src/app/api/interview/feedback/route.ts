import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: Request) {
    try {
        const { transcript, repoName } = await request.json();

        if (!transcript || !Array.isArray(transcript)) {
            return NextResponse.json({ error: "Invalid transcript data" }, { status: 400 });
        }

        const consolidatedTranscript = transcript.join("\n");

        const systemPrompt = "You are a senior technical interviewer experienced in evaluating software engineering candidates.";
        const userPrompt = `
Context: Use the following interview transcript to evaluate the candidate's performance. The interview was regarding the repository: "${repoName}".

Transcript:
${consolidatedTranscript}

Task:
Provide a detailed structured feedback report in clean, readable Markdown format.
Use bold headers, bullet points, and code blocks where necessary to make it easy to read.
Include the following sections:
1. **Overall Assessment**: A brief, encouraging summary of how the interview went.
2. **Technical Strengths**: Key technical concepts the candidate explained well.
3. **Areas for Improvement**: Specific gaps in knowledge or communication.
4. **Communication Style**: Clarity, conciseness, and confidence.
5. **Final Rating**: A score out of 10 with a brief justification.
`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "gpt-4o-mini",
        });

        const feedback = completion.choices[0].message.content;

        return NextResponse.json({ result: feedback });

    } catch (error: any) {
        console.error("Feedback Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate feedback" },
            { status: 500 }
        );
    }
}
