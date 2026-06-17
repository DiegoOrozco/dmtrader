
export interface RepoMetadata {
    commits: any[];
    fileTree: string[];
    languages: Record<string, number>;
}

export async function getRepoMetadata(repoUrl: string): Promise<RepoMetadata | null> {
    try {
        // Extract owner and repo from URL
        // Expected format: https://github.com/owner/repo
        const url = new URL(repoUrl);
        if (url.hostname !== "github.com") return null;

        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length < 2) return null;

        const owner = parts[0];
        const repo = parts[1];

        const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "DM-Trader-AI-Evaluator"
        };

        // Fetch commits
        const commitsRes = await fetch(`${baseUrl}/commits?per_page=5`, { headers });
        const commits = commitsRes.ok ? await commitsRes.json() : [];

        // Fetch languages
        const languagesRes = await fetch(`${baseUrl}/languages`, { headers });
        const languages = languagesRes.ok ? await languagesRes.json() : {};

        // Fetch file tree (top level for now)
        const contentsRes = await fetch(`${baseUrl}/contents`, { headers });
        const contents = contentsRes.ok ? await contentsRes.json() : [];
        const fileTree = Array.isArray(contents) ? contents.map((c: any) => c.name) : [];

        return {
            commits: Array.isArray(commits) ? commits.slice(0, 5).map((c: any) => ({
                message: c.commit.message,
                author: c.commit.author.name,
                date: c.commit.author.date
            })) : [],
            fileTree,
            languages
        };
    } catch (error) {
        console.error("Error fetching GitHub metadata:", error);
        return null;
    }
}
