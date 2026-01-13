import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { openai } from "@/lib/openai";

export async function POST(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content, path, language } = await request.json();

        if (!content || !path) {
            return NextResponse.json({ error: "Missing content or path" }, { status: 400 });
        }

        // Logic to skip analysis for common asset folders
        const excludedFolders = ['public/', 'assets/', 'images/', 'static/', 'locales/'];
        const isExcluded = excludedFolders.some(folder => path.toLowerCase().includes(folder));

        if (isExcluded) {
            return NextResponse.json({
                analysis: `**[Skipped Asset]**: This file is located in an asset directory (${path}) and was excluded from deep AI analysis to optimize processing.`
            });
        }

        const prompt = `
You are an expert code reviewer and documentation writer.
Analyze the following code file from a GitHub repository.
File Path: ${path}
Language: ${language || "Unknown"}

Please provide a concise analysis in markdown format including:
1. **Purpose**: What does this file do?
2. **Key Components**: Important functions, classes, or logic.
3. **Observations**: Any notable patterns, best practices, or potential issues.

Code Content:
\`\`\`${language || ""}
${content.slice(0, 30000)}
\`\`\`
`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are an expert code reviewer and documentation writer." },
                { role: "user", content: prompt }
            ],
            model: "gpt-4o-mini",
        });

        const analysis = completion.choices[0].message.content;

        return NextResponse.json({ analysis });

    } catch (error: any) {
        console.error("OpenAI Analysis Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to analyze file" },
            { status: 500 }
        );
    }
}
