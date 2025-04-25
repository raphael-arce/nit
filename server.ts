import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import express from "express";
import { config } from "dotenv";
import OpenAI from "openai";
import fs from "fs";

// Load environment variables
config();

const GITHUB_APP_ID = process.env.GITHUB_APP_ID!;
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET!;
const GITHUB_PRIVATE_KEY_PATH = process.env.GITHUB_PRIVATE_KEY_PATH!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const PORT = process.env.PORT || 3000;

if (!GITHUB_APP_ID || !GITHUB_WEBHOOK_SECRET || !GITHUB_PRIVATE_KEY_PATH || !OPENAI_API_KEY) {
	throw new Error("Missing required environment variables.");
}

let privateKey: string;
try {
	privateKey = fs.readFileSync(GITHUB_PRIVATE_KEY_PATH, "utf8");
} catch (error) {
	console.error(`Error reading private key from ${GITHUB_PRIVATE_KEY_PATH}:`, error);
	process.exit(1);
}

// Initialize GitHub App authentication
const appAuth = new App({
	appId: GITHUB_APP_ID,
	privateKey: privateKey,
	webhooks: {
		secret: GITHUB_WEBHOOK_SECRET,
	},
});

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: OPENAI_API_KEY,
});

// Initialize Webhooks handler
const webhooks = new Webhooks({
	secret: GITHUB_WEBHOOK_SECRET,
});

// --- Webhook Event Handler ---

webhooks.on("pull_request.opened", handlePullRequest);
webhooks.on("pull_request.synchronize", handlePullRequest);

async function handlePullRequest({ payload }: any) {
	const repoOwner = payload.repository.owner.login;
	const repoName = payload.repository.name;
	const prNumber = payload.pull_request.number;
	const installationId = payload.installation?.id;

	if (!installationId) {
		console.error("Installation ID not found in webhook payload.");
		return;
	}

	console.log(`Processing PR #${prNumber} in ${repoOwner}/${repoName}`);

	try {
		// Authenticate as the app installation
		const octokit = await appAuth.getInstallationOctokit(installationId);

		// 1. Get changed files
		const { data: files } = await octokit.pulls.listFiles({
			owner: repoOwner,
			repo: repoName,
			pull_number: prNumber,
		});

		// 2. Prepare code for AI (combine patches or handle files individually)
		// Example: Combine patches into one string (adjust as needed)
		const codeDiff = files.map(file => `File: ${file.filename}\nPatch:\n${file.patch ?? 'No patch available'}`).join('\n\n');

		if (!codeDiff || codeDiff.trim() === '') {
			console.log(`No diff found for PR #${prNumber}. Skipping AI review.`);
			return;
		}

		// 3. Send to AI with custom prompt
		const customPrompt = `Review the following code changes (diff format) for potential issues, style inconsistencies, and adherence to best practices. Focus on [Your Specific Criteria Here, e.g., security vulnerabilities, performance bottlenecks]. Provide feedback as concise review comments suitable for a GitHub PR review. Format comments clearly, referencing the file and relevant lines if possible.\n\n${codeDiff}`;

		const aiResponse = await getAiReview(customPrompt);

		// 4. Post review comments
		if (aiResponse) {
			await postReview(octokit, repoOwner, repoName, prNumber, aiResponse);
			console.log(`Review posted for PR #${prNumber}`);
		} else {
			console.log(`No AI feedback generated for PR #${prNumber}`);
		}

	} catch (error) {
		console.error(`Error processing PR #${prNumber}:`, error);
	}
}

// --- Helper Functions ---

async function getAiReview(prompt: string): Promise<string | null> {
	try {
		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini", // Or your preferred model
			messages: [{ role: "user", content: prompt }],
			max_tokens: 500, // Adjust as needed
		});
		return completion.choices[0]?.message?.content?.trim() ?? null;
	} catch (error) {
		console.error("Error getting AI review:", error);
		return null;
	}
}

async function postReview(octokit: Octokit, owner: string, repo: string, pull_number: number, body: string) {
	try {
		await octokit.pulls.createReview({
			owner,
			repo,
			pull_number,
			body,
			event: 'COMMENT', // Or 'REQUEST_CHANGES' / 'APPROVE' based on logic
		});
	} catch (error) {
		console.error("Error posting review comment:", error);
	}
}

// --- Express Server Setup ---

const app = express();

// Use the webhooks middleware
app.use("/api/webhook", createNodeMiddleware(webhooks, { path: "/" }));

// Basic root route for health check
app.get("/", (req, res) => {
	res.send("GitHub App AI Reviewer is running!");
});

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});