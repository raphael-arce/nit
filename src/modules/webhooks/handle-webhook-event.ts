import { App } from 'octokit';
import { postReview } from '../pull-requests/post-review';
import { generateAIReview } from '../ai/generate-ai-review';
import { getCodeDiff } from '../pull-requests/get-code-diff';
import { WebhookEventDefinition } from '@octokit/webhooks/types';

function isPullRequestEvent(eventName: string, payload: unknown): payload is WebhookEventDefinition<any> {
	return eventName === 'pull_request';
}

function isOpenedAction(action: string, payload: unknown): payload is WebhookEventDefinition<'pull-request-opened'> {
	return action === 'opened';
}

export async function handleWebhookEvent({
	eventName,
	payload,
	octokitApp,
	mistralApiKey,
}: {
	eventName: string;
	payload: unknown;
	octokitApp: App;
	mistralApiKey: string;
}) {
	if (!isPullRequestEvent(eventName, payload)) {
		console.log(`Received eventName: ${eventName}, ignoring.`);
		return;
	}

	const installationId = payload.installation?.id;

	if (!installationId) {
		console.error('Installation ID not found in payload.');
		return;
	}

	const octokit = await octokitApp.getInstallationOctokit(installationId);

	const action = payload.action;

	console.log(`Received ${action} event for PR #${payload.pull_request.number}`);

	if (!isOpenedAction(action, payload)) {
		console.log(`Ignoring action: ${payload.action}`);
		return;
	}

	const repoOwner = payload.repository.owner.login;
	const repoName = payload.repository.name;
	const prNumber = payload.pull_request.number;

	console.log(`Processing PR #${prNumber} in ${repoOwner}/${repoName}`);

	const codeDiff = await getCodeDiff({
		repoOwner,
		repoName,
		prNumber,
		octokit,
	});

	if (!codeDiff) {
		console.log(`No code diff found for PR #${prNumber}, skipping AI review.`);
		return;
	}

	const codeReview = await generateAIReview(codeDiff, mistralApiKey);

	if (!codeReview) {
		console.log(`No AI review generated for PR #${prNumber}, skipping posting review.`);
		return;
	}

	await postReview({
		octokit,
		repoOwner,
		repoName,
		prNumber,
		body: codeReview,
	});
}
