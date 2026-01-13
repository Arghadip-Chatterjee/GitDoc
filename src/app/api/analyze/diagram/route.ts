import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { repoName, context, diagramType } = await request.json();

        console.log(`Generating separate diagram: ${diagramType}`);

        if (!context || !diagramType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const safeRepoName = (repoName || "unknown_repo").replace(/[^a-zA-Z0-9-_]/g, '_');
        const safeDiagramType = (diagramType || "diagram").replace(/[^a-zA-Z0-9-_]/g, '_');

        const mermaidPrompt = `
Analyze the codebase context and generate a valid Mermaid.js diagram code for: **${diagramType}**.

Return ONLY a JSON object:
{
  "code": "graph TD..."
}
`;
        const mermaidRes = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a Mermaid.js expert. Generate ONLY valid mermaid code." },
                { role: "user", content: `Context:\n${context}\n\n${mermaidPrompt}` }
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }
        });

        const content = mermaidRes.choices[0].message.content || "{}";
        const mermaidJson = JSON.parse(content);
        const code = mermaidJson.code || mermaidJson[Object.keys(mermaidJson)[0]];

        if (!code) throw new Error("No code returned");

        // Clean up code
        const cleanCode = code.replace(/^```mermaid\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();

        // Base64 encode for mermaid.ink
        const base64Code = Buffer.from(cleanCode).toString('base64');
        const mermaidImageUrl = `https://mermaid.ink/img/${base64Code}?bgColor=FFFFFF`;

        console.log(`Uploading ${diagramType} to Cloudinary...`);

        // Upload to Cloudinary
        const uploadRes = await cloudinary.uploader.upload(mermaidImageUrl, {
            folder: "gitdoc_generated_diagrams",
            public_id: `${safeRepoName}_${safeDiagramType}_${Date.now()}`
        });

        return NextResponse.json({
            success: true,
            url: uploadRes.secure_url,
            code: cleanCode
        });

    } catch (error: any) {
        console.error("Diagram Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate diagram" },
            { status: 500 }
        );
    }
}
