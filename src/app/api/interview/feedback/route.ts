import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { openai } from "@/lib/openai";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { transcript, repoName, interviewId } = await request.json();

        if (!transcript || !Array.isArray(transcript)) {
            return NextResponse.json({ error: "Invalid transcript data" }, { status: 400 });
        }

        if (!interviewId) {
            return NextResponse.json({ error: "Interview ID is required" }, { status: 400 });
        }

        const userId = (session.user as any).id;

        // 1. Verify interview exists and belongs to the user
        const interview = await prisma.interview.findFirst({
            where: {
                id: interviewId,
                userId: userId // Ensure user owns this interview
            }
        });

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
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

        // 2. Generate feedback
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "gpt-4o-mini",
        });

        const feedback = completion.choices[0].message.content;

        // 3. Store feedback and update interview status
        await prisma.interviewFeedback.create({
            data: {
                interviewId: interviewId,
                feedback: feedback || ""
            }
        });

        // Calculate duration
        const duration = Math.floor((new Date().getTime() - interview.createdAt.getTime()) / 1000);

        await prisma.interview.update({
            where: { id: interviewId },
            data: {
                status: "completed",
                completedAt: new Date(),
                duration: duration
            }
        });

        return NextResponse.json({ result: feedback });

    } catch (error: any) {
        console.error("Feedback Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate feedback" },
            { status: 500 }
        );
    }
}
