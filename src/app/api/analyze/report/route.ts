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
        const { repoName, fileAnalyses, step, context, customImages, skipAIImages, selectedDiagrams, existingDiagrams, generatedDiagrams } = await request.json();
        console.log(`Step ${step} Request.`);

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

            case 3: // Visuals (Pre-Generated Assets)
                systemPrompt = "You are a visual thinker and systems designer.";

                // Group user images by tag
                const userImagesByTag: Record<string, any[]> = {};
                if (customImages && Array.isArray(customImages)) {
                    customImages.forEach((img: any) => {
                        const tag = img.tag || "Other";
                        if (!userImagesByTag[tag]) userImagesByTag[tag] = [];
                        userImagesByTag[tag].push(img);
                    });
                }

                // Construct a unified "Visual Inventory" for the LLM
                let visualInventory = "### Visual Asset Inventory\n\n";

                // Get all unique sections (from keys of both generators)
                const allSections = new Set([
                    ...Object.keys(userImagesByTag),
                    ...Object.keys(generatedDiagrams || {})
                ]);

                allSections.forEach(section => {
                    visualInventory += `#### Section: ${section}\n`;

                    // 1. User Images first
                    if (userImagesByTag[section]) {
                        userImagesByTag[section].forEach((img: any) => {
                            visualInventory += `- [User Image] ${img.originalName}: ![${img.originalName}](${img.url})\n`;
                        });
                    }

                    // 2. AI Generated Diagrams
                    if (generatedDiagrams && generatedDiagrams[section]) {
                        visualInventory += `- [AI Diagram] ${section}: ![${section}](${generatedDiagrams[section]})\n`;
                    }
                    visualInventory += "\n";
                });

                if (allSections.size === 0) {
                    visualInventory += "(No visual assets present. Describe the architecture textually.)";
                }

                const visualInstructions = `
1. **Goal**: Write "Chapter 3: The Visuals".
2. **Usage**: Use the "Visual Asset Inventory" provided above.
3. **Structure**: 
   - Create a Markdown Header (##) for each Section present in the inventory.
   - Write a brief 2-3 sentence introduction for that diagram/visual.
   - **Embed the images** using the exact Markdown links provided in the inventory.
   - If a section has both User and AI images, display both and compare them or explain them sequentially.
   - **DO NOT** generate new Mermaid code. Use the provided images only.
`;

                userPrompt = `
Repository Name: ${repoName}

Write "Chapter 3: The Visuals".
This chapter uses diagrams to explain the system.

${visualInstructions}

${visualInventory}

Context:
${aggregatedContext}
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
        });

        const result = completion.choices[0].message.content;
        return NextResponse.json({ result: result });

    } catch (error: any) {
        console.error("Analysis Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate report" },
            { status: 500 }
        );
    }
}
