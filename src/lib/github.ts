import { Octokit } from "octokit";

if (!process.env.GITHUB_TOKEN) {
  console.warn("GITHUB_TOKEN is not set. GitHub API rate limits will be lower.");
}

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});
