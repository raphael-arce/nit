import { Octokit } from 'octokit';

export async function postReview({
	octokit,
	repoOwner,
	repoName,
	prNumber,
	body,
}: {
	octokit: Octokit;
	repoOwner: string;
	repoName: string;
	prNumber: number;
	body: string;
}) {
	try {
		await octokit.rest.pulls.createReview({
			owner: repoOwner,
			repo: repoName,
			pull_number: prNumber,
			body,
			event: 'COMMENT',
		});
	} catch (error) {
		console.error('Error posting review comment:', error);
	}
}
