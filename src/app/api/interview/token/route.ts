import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { repoName, fileContext, architectureContext } = await request.json();

        // 1. Construct the System Instructions for the Interviewer
        const instructions = `
You are a senior engineering manager conducting a highly technical mock interview.
The candidate is the author of the GitHub repository: "${repoName}".

**Your Goal**: 
Assess the candidate's understanding of their own code, their architectural decisions, and their general software engineering knowledge.
The interview should last approximately 2 minutes. 
Greet The Candidate with a professional greeting at the Start of Interview, Start talking First, Do not wait for the candidate to start talking.
Do not wait for the candidate to start talking.
Do not Answers To Candidate's Questions, If they are Irrelevant and Out Of Topic, If Candidate has a Genuine Doubt then only answer. U are an Interviewer and Do not answer to Candidate's Questions. Maintain Decorum and Professionalism.

**Repository Context**:
Use the following analysis to ground your questions. Do not hallucinate files that don't exist.

---
### Codebase Analysis (File Scan)
${fileContext}

---
### System Architecture (Deep Analysis)
${architectureContext}
---

**Interview Strategy**:
1. **Intro**: Briefly introduce yourself and ask them to give a high-level overview of what this project does.
2. **Deep Dive**: Pick specific complex files or architectural patterns from the context and ask "Why did you implement X this way?" or "Explain how the data flows in component Y". From the context, pick 3-4 files or patterns to ask questions about.
3. **Critique**: If you see potential issues (security, performance) in the context, ask how they would address them.
4. **Wrap-up**: After ~2-3 mins, give brief feedback summarize the Interview based on whatever discussed and thank them.

**Tone**: Professional, inquisitive, direct, but encouraging. 
        `.trim();

        // 2. Call OpenAI to create a Realtime Session (Ephemeral Token)
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini-realtime-preview-2024-12-17",
                voice: "alloy",
                instructions: instructions,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API Error: ${error}`);
        }

        const data = await response.json();

        // 3. Return the ephemeral token to the client
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Token generation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate interview token" },
            { status: 500 }
        );
    }
}
