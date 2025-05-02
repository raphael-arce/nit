import { Octokit } from 'octokit';

export async function getCodeDiff({
	repoOwner,
	repoName,
	prNumber,
	octokit,
}: {
	repoOwner: string;
	repoName: string;
	prNumber: number;
	octokit: Octokit;
}): Promise<string | null> {
	try {
		// Get changed files.
		const { data: files } = await octokit.rest.pulls.listFiles({
			owner: repoOwner,
			repo: repoName,
			pull_number: prNumber,
		});

		const codeDiff = files
			.map((file) => `File: ${file.filename}\nPatch:\n${file.patch ?? 'No patch available'}`)
			.join('\n\n')
			.trim();

		return codeDiff;
	} catch (error) {
		console.error(`Error processing PR #${prNumber}:`, error);
		return null;
	}
}
