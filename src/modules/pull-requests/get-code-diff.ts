import { Octokit } from 'octokit';

function addLineNumbers(patch: string | undefined) {
	return patch
		?.split('\n')
		.map((line, index) => `${index}: ${line}`)
		.join('\n');
}

function toConcatenatedDiff(file: { filename: string; patch?: string }) {
	const patchWithLineNumbers = addLineNumbers(file.patch);
	return `File: ${file.filename}\nPatch:\n${patchWithLineNumbers ?? 'No patch available'}`;
}

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

		const codeDiff = files.map(toConcatenatedDiff).join('\n\n').trim();

		return codeDiff;
	} catch (error) {
		console.error(`Error processing PR #${prNumber}:`, error);
		return null;
	}
}
