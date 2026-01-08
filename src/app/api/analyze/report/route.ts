import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
    try {
        const { repoName, fileAnalyses, step, context, customImages, skipAIImages } = await request.json();

        // Basic validation
        if (!fileAnalyses && step === 1) {
            return NextResponse.json({ error: "Invalid file analyses data" }, { status: 400 });
        }

        const aggregatedContext = fileAnalyses ? fileAnalyses.map((item: any) => `
### File: ${item.path}
${item.analysis}
`).join("\n\n") : "";

        let systemPrompt = "You are a senior technical writer.";
        let userPrompt = "";

        switch (step) {
            case 1: // Textual Analysis (Broad)
                systemPrompt = "You are a technical author writing a best-selling book on software architecture.";
                userPrompt = `
Repository Name: ${repoName}

Analyze the provided code context and write "Chapter 1: The Vision".
This chapter must be written in a broad, engaging, and narrative style, suitable for a technical book.

**Content Requirements:**
1.  **Introduction**: A compelling introduction to the project. What is it? Why does it exist?
2.  **Executive Summary**: High-level overview of the problem and solution.
3.  **Key Features**: A detailed, narrative breakdown of the core capabilities.
4.  **Tech Stack**: A discussion on the chosen technologies and why they might have been selected.
5.  **Conclusion**: A wrapping thought on the project's potential.

**Format**: Markdown. Do not include a main title (User interface handles the title). use standard headers.

Context:
${aggregatedContext}
`;
                break;

            case 2: // Structure & Tree (Deep Dive)
                systemPrompt = "You are a software architect explaining the system internals.";
                userPrompt = `
Repository Name: ${repoName}

Write "Chapter 2: The Structure".
This chapter focuses on the internal organization and architectural decisions.

**Content Requirements:**
1.  **Project Structure**: Generate a clean file tree structure using a markdown code block.
2.  **Architecture Deep Dive**: Explain how the components interact. Is it MVC? Serverless? Monolith?
3.  **Data Flow**: Describe how data moves through the application.
4.  **Component Analysis**: Pick the most critical 3-4 files and explain their specific role in depth.

**Format**: STRICT MARKDOWN. Use headers (##, ###), bullet points, and code blocks for readability. Do not output raw text blocks without formatting.

Context:
${aggregatedContext}
`;
                break;

            case 3: // Visuals (Mermaid & Images)
                systemPrompt = "You are a visual thinker and systems designer.";

                const hasCustomImages = customImages && customImages.length > 0;
                const shouldSkipAI = skipAIImages || hasCustomImages;

                // Context for custom images (always available if they exist)
                const customImagesContext = hasCustomImages
                    ? `\n**User Provided Images**: The following images were uploaded by the user. You MUST incorporate them into the documentation. Create a section called "## Gallery of User Assets" and display them:\n${customImages.map((url: string) => `- ![User Image](${url})`).join('\n')}\n`
                    : "";

                let visualInstructions = "";
                let generatedDiagramsContext = "";

                if (shouldSkipAI) {
                    // --- PATH A: USER ASSETS ONLY ---
                    visualInstructions = `
1. **User Assets Only**:
   - Use the "User Provided Images" listed below. Display them prominently.
   - **DO NOT** generate a Mermaid diagram.
   - **DO NOT** suggest new AI images.
   - **DO NOT** look for or include any images from the repository.
`;
                } else {
                    // --- PATH B: AI DIAGRAM GENERATION (Mermaid -> DALL-E -> Cloudinary) ---
                    try {
                        console.log("Generating Mermaid Code...");
                        // 1. Generate Mermaid Code
                        const mermaidPrompt = `
Analyze the codebase context and generate Mermaid.js code for two diagrams:
1. **System Architecture**: High-level component interaction.
2. **Data Flow Diagram (DFD)**: How data moves through the system.

Return ONLY a JSON object:
{
  "systemArchitecture": "graph TD...",
  "dataFlow": "graph TD..."
}
`;
                        const mermaidRes = await openai.chat.completions.create({
                            messages: [
                                { role: "system", content: "You are a Mermaid.js expert." },
                                { role: "user", content: `Context:\n${aggregatedContext}\n\n${mermaidPrompt}` }
                            ],
                            model: "gpt-4o-mini",
                            response_format: { type: "json_object" }
                        });

                        const mermaidJson = JSON.parse(mermaidRes.choices[0].message.content || "{}");
                        const diagrams = [
                            { type: "System Architecture", code: mermaidJson.systemArchitecture },
                            { type: "Data Flow Diagram", code: mermaidJson.dataFlow }
                        ];

                        const uploadedUrls: string[] = [];

                        console.log("Visualizing with DALL-E...");
                        // 2. Generate DALL-E Image & Upload to Cloudinary
                        for (const diag of diagrams) {
                            if (!diag.code) continue;

                            // DALL-E Prompt
                            const imagePrompt = `
Create a professional, high-fidelity technical diagram based on this structure. 
Type: ${diag.type}. 
Style: Clean, minimalist, white background, like a polished software architecture diagram. 
Structure details: ${diag.code.slice(0, 800)} 
(Visualize the nodes and connections described).
`;
                            // Using GPT-5 Responses API as requested
                            const imageRes: any = await (openai as any).responses.create({
                                model: "gpt-5",
                                input: imagePrompt,
                                tools: [{ type: "image_generation" }],
                            });

                            // Adapting extraction: User didn't specify return format. 
                            // Assuming it might be direct property or similar to previous. 
                            // Logging for debugging if it fails.
                            console.log("GPT-5 Image Response:", JSON.stringify(imageRes, null, 2));

                            // Trying to locate URL in likely paths
                            const dalleUrl = imageRes.image || imageRes.data?.[0]?.url || imageRes.output?.[0]?.image || imageRes.choices?.[0]?.message?.content;

                            if (dalleUrl) {
                                // 3. Upload to Cloudinary (DALL-E URLs expire, Cloudinary is perm)
                                const uploadRes = await cloudinary.uploader.upload(dalleUrl, {
                                    folder: "gitdoc_generated_diagrams",
                                    public_id: `${repoName.replace('/', '_')}_${diag.type.replace(/\s/g, '_')}_${Date.now()}`
                                });
                                uploadedUrls.push(`- **${diag.type}**:\n  ![${diag.type}](${uploadRes.secure_url})`);
                            }
                        }

                        if (uploadedUrls.length > 0) {
                            generatedDiagramsContext = `
\n**AI Generated System Diagrams**:
The following high-fidelity diagrams have been generated for you. You MUST display them in the "System Diagram" section.
${uploadedUrls.join('\n')}
`;
                            visualInstructions = `
1. **System Diagrams**:
   - Use the "AI Generated System Diagrams" provided below.
   - Display them prominently in a section called "## System Architecture & Design".
   - You do NOT need to write new Mermaid code, just embed these images.

2. **AI Image Generation Suggestions**:
   - Suggest 3 additional high-fidelity AI images (e.g. for marketing/cover).
   - **Tag Format**: \`[[GENERATE_IMAGE: Title | Detailed Prompt]]\`
`;
                        } else {
                            // Fallback if image gen fails
                            visualInstructions = "Failed to generate images. Please describe the architecture in text.";
                        }

                    } catch (err) {
                        console.error("AI Diagram Gen Error:", err);
                        visualInstructions = "Error generating diagrams. Please simply describe the system architecture textually.";
                    }
                }

                userPrompt = `
Repository Name: ${repoName}

Write "Chapter 3: The Blueprint".
This chapter visualizes the system.

**Requirements**:
${visualInstructions}

${generatedDiagramsContext}

${customImagesContext}

**Analysis Context**:
${aggregatedContext}

**CRITICAL FORMATTING RULES**:
- **ALWAYS** use Markdown Headers (##) for section titles.
- **Images**: Always use \`![Alt](url)\`.
- **Lists**: Use proper markdown lists.
`;
                break;

            case 4: // Combination (Book JSON)
                systemPrompt = "You are a book editor compiling the final manuscript.";
                // NOTE: We DO NOT include 'aggregatedContext' here to avoid token limits. 
                // We only need the previous chapters.
                userPrompt = `
Repository Name: ${repoName}

Your task is to compile the previous chapters into a final JSON structure for our Book Reader application.

**Inputs:**
- Chapter 1 Data: \`\`\`${context.textual}\`\`\`
- Chapter 2 Data: \`\`\`${context.structure}\`\`\`
- Chapter 3 Data: \`\`\`${context.visuals}\`\`\`

**Output Requirement:**
Return ONLY a valid JSON object. Do not include markdown formatting around the JSON.
Structure:
{
  "title": "The Semantic Architecture of ${repoName}",
  "chapters": [
    { "title": "The Vision", "content": "...content from Step 1..." },
    { "title": "The Structure", "content": "...content from Step 2..." },
    { "title": "The Blueprint", "content": "...content from Step 3..." }
  ]
}
`;
                break;

            default:
                return NextResponse.json({ error: "Invalid step" }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "gpt-4o-mini",
            response_format: step === 4 ? { type: "json_object" } : { type: "text" }
        });

        let result = completion.choices[0].message.content || "";

        // Cleanup: Remove markdown code blocks if the LLM wrapped the output
        if (step !== 4) {
            result = result.replace(/^```markdown\s*/, "").replace(/^```\s*/, "").replace(/```$/, "");
        }

        return NextResponse.json({ result });

    } catch (error: any) {
        console.error("Report Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate report" },
            { status: 500 }
        );
    }
}
