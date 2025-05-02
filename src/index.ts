import { App } from 'octokit';
import { handleWebhookEvent } from './modules/webhooks/handle-webhook-event';

export default {
	async fetch(request: Request, env, _ctx): Promise<Response> {
		const appId = env.GITHUB_APP_ID;
		const webhookSecret = env.GITHUB_APP_WEBHOOK_SECRET;
		const privateKey = env.GITHUB_APP_PRIVATE_KEY;
		const mistralApiKey = env.MISTRAL_API_KEY;

		if (!appId || !webhookSecret || !privateKey || !mistralApiKey) {
			return new Response('Missing required environment variables.', { status: 500 });
		}

		const url = new URL(request.url);

		if (request.method === 'GET' && url.pathname === '/') {
			return new Response('{"message": "hello"}', { status: 200, headers: { 'Content-Type': 'application/json' } });
		}

		const octokitApp = new App({
			appId,
			privateKey,
			webhooks: {
				secret: webhookSecret,
			},
		});

		const eventName = request.headers.get('x-github-event') || '';

		if (request.method === 'POST' && url.pathname === '/') {
			const unparsedPayload = await request.text();
			let payload;

			try {
				await octokitApp.webhooks.verifyAndReceive({
					id: request.headers.get('x-github-delivery') || '',
					name: eventName,
					signature: request.headers.get('x-hub-signature-256') || '',
					payload: unparsedPayload,
				});

				payload = JSON.parse(unparsedPayload);
			} catch (error) {
				console.error(error);
				return new Response('Invalid payload.', { status: 400 });
			}

			await handleWebhookEvent({ eventName, payload, octokitApp, mistralApiKey });

			return new Response(null, { status: 204 });
		}

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
