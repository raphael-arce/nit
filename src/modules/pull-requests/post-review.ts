import { Octokit } from 'octokit';

export async function postReview({
	octokit,
	repoOwner,
	repoName,
	prNumber,
	body,
	comments,
}: {
	octokit: Octokit;
	repoOwner: string;
	repoName: string;
	prNumber: number;
	body: string;
	comments?: { path: string; position?: number | undefined; body: string }[];
}) {
	try {
		await octokit.rest.pulls.createReview({
			owner: repoOwner,
			repo: repoName,
			pull_number: prNumber,
			event: 'COMMENT',
			body,
			comments,
		});
	} catch (error) {
		console.error('Error posting review comment:', error);
	}
}
