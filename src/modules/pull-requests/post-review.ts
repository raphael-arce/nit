import { Octokit } from 'octokit';

export async function postReview({
	octokit,
	repoOwner,
	repoName,
	prNumber,
	codeReview,
}: {
	octokit: Octokit;
	repoOwner: string;
	repoName: string;
	prNumber: number;
	codeReview: string;
}) {
	let parsedReview = undefined;

	try {
		parsedReview = JSON.parse(codeReview);
	} catch (error) {
		console.error('Error parsing review:', error);
	}

	const octokitReview = {
		owner: repoOwner,
		repo: repoName,
		pull_number: prNumber,
		event: 'COMMENT',
		body: parsedReview?.body ?? `_The AI returned an unparsable review. Here is the raw AI review:_ \n ${codeReview}`,
		comments: parsedReview?.comments ?? undefined,
	} as const;

	try {
		await octokit.rest.pulls.createReview(octokitReview);
	} catch (error) {
		console.error('Error posting review:', error);
		await octokit.rest.pulls.createReview({
			owner: repoOwner,
			repo: repoName,
			pull_number: prNumber,
			event: 'COMMENT',
			body: `_The AI review could not be posted due to an error. Here is the raw AI review:_ \n ${codeReview}`,
		});
	}
}
