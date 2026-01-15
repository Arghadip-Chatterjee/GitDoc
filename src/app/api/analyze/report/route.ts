import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { v2 as cloudinary } from 'cloudinary';
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkCredits, consumeCredit } from "@/lib/credits";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
    try {
        const { repoUrl, fileAnalyses, step, context, customImages, skipAIImages, selectedDiagrams, existingDiagrams, generatedDiagrams } = await request.json();
        console.log(`Step ${step} Request. Repo URL: ${repoUrl || 'undefined'}`);

        // Get user session and enforce authentication
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized. Please login to use this feature." }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Basic validation
        // Repo name is optional for intermediate steps if we just want generation
        if (!repoUrl && step === 1) {
            return NextResponse.json({ error: "Repository name is required for initialization" }, { status: 400 });
        }

        if (!fileAnalyses && step === 1) {
            return NextResponse.json({ error: "Invalid file analyses data" }, { status: 400 });
        }

        const aggregatedContext = fileAnalyses ? fileAnalyses.map((item: any) => `
### File: ${item.path}
${item.analysis}
`).join("\n\n") : "";

        let analysis = null;

        // Step 1: Initialize Repository and Analysis
        if (step === 1) {
            // Check if user has document credits available
            const creditCheck = await checkCredits(userId, "document");

            if (!creditCheck.hasCredits) {
                const timeUntilReset = creditCheck.resetAt
                    ? Math.ceil((creditCheck.resetAt.getTime() - Date.now()) / (1000 * 60 * 60))
                    : 0;

                return NextResponse.json({
                    error: "No document generation credits available",
                    creditsExhausted: true,
                    timeUntilReset: timeUntilReset,
                    resetAt: creditCheck.resetAt
                }, { status: 403 });
            }

            // Parse repository information from user input
            let owner = 'unknown';
            let repo = 'unknown';
            let originalUrl = repoUrl || ''; // Store the exact input from user

            // Extract owner/repo from different URL formats WITHOUT REGEX
            if (repoUrl) {
                // Remove trailing slashes and .git
                const cleanUrl = repoUrl.trim().replace(/\.git$/, '').replace(/\/$/, '');

                if (cleanUrl.includes('github.com')) {
                    // Full URL format: https://github.com/owner/repo
                    // Split by 'github.com/' and take the part after it
                    const afterGithub = cleanUrl.split('github.com/')[1];
                    if (afterGithub) {
                        const parts = afterGithub.split('/');
                        if (parts.length >= 2) {
                            owner = parts[0];
                            repo = parts[1].split('?')[0].split('#')[0]; // Remove query params and hash
                        } else if (parts.length === 1) {
                            repo = parts[0];
                        }
                    }
                    originalUrl = repoUrl; // Keep the full URL as entered
                } else if (cleanUrl.includes('/') && !cleanUrl.includes('http')) {
                    // Format: owner/repo (without http/https)
                    const parts = cleanUrl.split('/');
                    owner = parts[0];
                    repo = parts[1] || 'unknown';
                    originalUrl = `https://github.com/${owner}/${repo}`;
                } else {
                    // Just repo name
                    repo = cleanUrl;
                    originalUrl = `https://github.com/unknown/${repo}`;
                }
            }

            // Create or find Repository - store the ORIGINAL URL
            const repository = await prisma.repository.upsert({
                where: {
                    url: originalUrl // Use URL as unique identifier
                },
                update: {
                    name: repo // Update name if URL exists
                },
                create: {
                    name: repo,
                    url: originalUrl // Store the original URL as entered by user
                }
            });

            // Create new Analysis for this repository (linked to user if authenticated)
            analysis = await prisma.analysis.create({
                data: {
                    repositoryId: repository.id,
                    userId: userId, // Link to authenticated user
                    status: "processing",
                    step: 1,
                    fileContext: JSON.stringify(fileAnalyses) // Store as JSON array for resume functionality
                }
            });

            // Consume a document credit after successful analysis creation
            await consumeCredit(userId, "document");


        } else {
            // Steps 2-4: Find existing Analysis without touching Repository
            // We need to find the most recent active analysis
            // Ideally, frontend should pass analysisId, but for now we use this heuristic

            if (repoUrl) {
                // Try to find repository by URL
                const repository = await prisma.repository.findUnique({
                    where: {
                        url: repoUrl
                    }
                });

                if (repository) {
                    analysis = await prisma.analysis.findFirst({
                        where: {
                            repositoryId: repository.id,
                            status: { in: ["pending", "processing"] }
                        },
                        orderBy: { updatedAt: 'desc' }
                    });
                }
            } else {
                // Fallback: Find most recent analysis
                analysis = await prisma.analysis.findFirst({
                    where: {
                        status: { in: ["pending", "processing"] }
                    },
                    orderBy: { updatedAt: 'desc' }
                });
            }

            // Update existing analysis if found
            if (analysis) {
                analysis = await prisma.analysis.update({
                    where: { id: analysis.id },
                    data: {
                        step: step,
                        architectureContext: step >= 2 && context
                            ? (typeof context === 'string' ? context : JSON.stringify(context))
                            : analysis.architectureContext
                    }
                });
            } else {
                console.warn(`No active analysis found for step ${step}. Proceeding without DB update.`);
            }
        }

        let systemPrompt = "You are a senior technical writer.";
        let userPrompt = "";

        switch (step) {
            case 1: // Textual Analysis (Broad)
                systemPrompt = "You are a technical author writing a best-selling book on software architecture.";
                userPrompt = `
Repository Name: ${repoUrl}

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
Repository Name: ${repoUrl}

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
                        const diagramUrl = typeof generatedDiagrams[section] === 'string'
                            ? generatedDiagrams[section]
                            : generatedDiagrams[section].url;
                        visualInventory += `- [AI Diagram] ${section}: ![${section}](${diagramUrl})\n`;
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
Repository Name: ${repoUrl}

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
Repository Name: ${repoUrl}

Your task is to compile the previous chapters into a final JSON structure for our Book Reader application.

**Inputs:**
- Chapter 1 Data: \`\`\`${context.textual}\`\`\`
- Chapter 2 Data: \`\`\`${context.structure}\`\`\`
- Chapter 3 Data: \`\`\`${context.visuals}\`\`\`

**Output Requirement:**
Return ONLY a valid JSON object. Do not include markdown formatting around the JSON.
Structure:
{
  "title": "The Semantic Architecture of ${repoUrl}",
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

        // Store diagrams in database (Step 3 - Visuals)
        if (step === 3 && analysis) {
            // 1. Store custom user-uploaded images
            if (customImages && Array.isArray(customImages)) {
                for (const customImage of customImages) {
                    await prisma.diagram.create({
                        data: {
                            analysisId: analysis.id,
                            type: customImage.tag || "Custom Upload",
                            tag: customImage.tag || "user-upload",
                            mermaidCode: "",
                            imageUrl: customImage.url
                        }
                    });
                }
            }

            // 2. Store AI-generated diagrams with mermaid code
            if (generatedDiagrams) {
                // generatedDiagrams is an object/map, not an array
                const diagramEntries = Object.entries(generatedDiagrams || {});

                for (const [type, diagramData] of diagramEntries) {
                    // Extract URL and code from object structure
                    const imageUrl = typeof diagramData === 'string' ? diagramData : (diagramData as any).url;
                    const mermaidCode = typeof diagramData === 'string' ? "" : ((diagramData as any).code || "");

                    await prisma.diagram.create({
                        data: {
                            analysisId: analysis.id,
                            type: type,
                            tag: type,
                            mermaidCode: mermaidCode,
                            imageUrl: imageUrl
                        }
                    });
                }
            }
        }

        // Store Step 1, 2, and 3 results in architectureContext for resume functionality
        if ((step === 1 || step === 2 || step === 3) && analysis && result) {
            // Get existing context or create new one
            let existingContext = { textual: "", structure: "", visuals: "" };

            if (analysis.architectureContext) {
                try {
                    existingContext = JSON.parse(analysis.architectureContext);
                } catch (e) {
                    console.error("Failed to parse existing context:", e);
                }
            }

            // Update the appropriate field
            if (step === 1) {
                existingContext.textual = result;
            } else if (step === 2) {
                existingContext.structure = result;
            } else if (step === 3) {
                existingContext.visuals = result;
            }

            // Save back to database
            await prisma.analysis.update({
                where: { id: analysis.id },
                data: {
                    architectureContext: JSON.stringify(existingContext)
                }
            });
        }

        // Store final report in database (Step 4 - Book)
        if (step === 4 && analysis && result) {
            await prisma.report.create({
                data: {
                    analysisId: analysis.id,
                    markdown: result
                }
            });

            // Mark analysis as completed
            await prisma.analysis.update({
                where: { id: analysis.id },
                data: {
                    status: "completed",
                    completedAt: new Date()
                }
            });
        }

        return NextResponse.json({ result: result });

    } catch (error: any) {
        console.error("Analysis Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate report" },
            { status: 500 }
        );
    }
}
