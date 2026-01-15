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
    const repoUrl = searchParams.get("url");

    if (!repoUrl) {
        return NextResponse.json({ error: "Missing repo URL" }, { status: 400 });
    }

    // Parse owner and repo from URL
    // Expected format: https://github.com/owner/repo
    const parts = repoUrl.split("github.com/");
    if (parts.length < 2) {
        return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
    }

    const [owner, repo] = parts[1].split("/").filter(Boolean);

    if (!owner || !repo) {
        return NextResponse.json({ error: "Invalid repository format" }, { status: 400 });
    }

    try {
        // 1. Get Repo Details (to find default branch)
        const { data: repoData } = await octokit.rest.repos.get({
            owner,
            repo,
        });

        const defaultBranch = repoData.default_branch;

        // 2. Get the Git Tree recursively
        const { data: treeData } = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: defaultBranch,
            recursive: "1",
        });

        // Filter for files only (not directories) and maybe some ignore patterns
        const files = treeData.tree.filter((item) => {
            return item.type === "blob"; // blobs are files
        }).map(item => ({
            path: item.path,
            size: item.size,
            url: item.url, // Git blob URL
        }));

        return NextResponse.json({
            repo: repoData.full_name,
            description: repoData.description,
            defaultBranch,
            files,
            owner: repoData.owner.login,
            name: repoData.name
        });

    } catch (error: any) {
        console.error("GitHub API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch repository" },
            { status: 500 }
        );
    }
}
