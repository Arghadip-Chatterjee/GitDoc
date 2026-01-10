export const analyzeRepoFiles = async (
    repoData: any,
    onProgress: (file: string, progress: number) => void
) => {
    // Files to analyze filter
    const filesToAnalyze = repoData.files.filter((f: any) =>
    // Strict Programming Files only
    (f.path.endsWith('.ts') || f.path.endsWith('.tsx') || f.path.endsWith('.js') || f.path.endsWith('.jsx') ||
        f.path.endsWith('.py') || f.path.endsWith('.java') || f.path.endsWith('.go') || f.path.endsWith('.rs') ||
        f.path.endsWith('.md') || f.path.endsWith('.json') || f.path.endsWith('.css') || f.path.endsWith('.html') ||
        f.path.endsWith('.prisma') || f.path.endsWith('.sql') || f.path.endsWith('.sh') || f.path.endsWith('.yaml') || f.path.endsWith('.yml'))
    ).filter((f: any) =>
        !f.path.includes('node_modules') &&
        !f.path.includes('package-lock.json') &&
        !f.path.includes('yarn.lock') &&
        !f.path.includes('pnpm-lock.yaml') &&
        !f.path.includes('dist/') &&
        !f.path.includes('build/') &&
        !f.path.includes('.git/') &&
        !f.path.includes('.next/') &&
        !f.path.includes('coverage/') &&
        !f.path.includes('__pycache__') &&
        !f.path.includes('.venv') &&
        !f.path.includes('venv/') &&
        !f.path.includes('.idea/') &&
        !f.path.includes('.vscode/') &&
        !f.path.includes('.DS_Store') &&
        // User requested strict exclusions
        !f.path.includes('assets/') &&
        !f.path.includes('public/') &&
        !f.path.includes('components/ui/')
    ); // No slice limit

    const analyses = [];

    for (let i = 0; i < filesToAnalyze.length; i++) {
        const file = filesToAnalyze[i];

        // Notify progress
        onProgress(file.path, ((i + 1) / filesToAnalyze.length) * 100);

        try {
            const contentRes = await fetch(`/api/github/content?owner=${repoData.owner}&repo=${repoData.name}&path=${encodeURIComponent(file.path)}`);
            const contentData = await contentRes.json();

            if (contentRes.ok) {
                const analyzeRes = await fetch("/api/analyze/file", {
                    method: "POST",
                    body: JSON.stringify({
                        content: contentData.content,
                        path: file.path,
                        language: file.path.split('.').pop()
                    })
                });
                const analyzeData = await analyzeRes.json();
                if (analyzeRes.ok) {
                    analyses.push({ path: file.path, analysis: analyzeData.analysis });
                }
            }
        } catch (error) {
            console.error(`Error analyzing file ${file.path}:`, error);
        }
    }
    return analyses;
};
