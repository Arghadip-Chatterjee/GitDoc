import { NextResponse } from "next/server";
import { octokit } from "@/lib/github";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const path = searchParams.get("path");

    if (!owner || !repo || !path) {
        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
        });

        if (Array.isArray(data) || data.type !== "file") {
            return NextResponse.json({ error: "Path is not a file" }, { status: 400 });
        }

        // GitHub API returns content in base64
        const content = Buffer.from(data.content, "base64").toString("utf-8");

        return NextResponse.json({
            content,
            path,
            sha: data.sha,
        });

    } catch (error: any) {
        console.error("GitHub API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch file content" },
            { status: 500 }
        );
    }
}
