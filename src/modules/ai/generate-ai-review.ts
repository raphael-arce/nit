import { generateText } from 'ai';
import { createMistral } from '@ai-sdk/mistral';

export async function generateAIReview(codeDiff: string, mistralApiKey: string): Promise<string | null> {
	const prompt = `
Prompt for AI Code Reviewing GitHub App

Objective: Improve code quality.

Instructions:

	Scope: Review the code with an emphasis on readability and simplicity. Ensure that the code is easy to understand and maintain.
	
	Standards and Guidelines: Follow the Airbnb JavaScript Style Guide.
	
	Feedback Format:
			Provide feedback in the following format: { body: string, comments: { path: string, position: number, body: string }[] }
			Only return a JSON object. 
			Provide specific suggestions for improvement on specific lines of code via a comment object in the comment array.
			If you can, provide an example on how to improve the code.
			Don't repeat the original code. Keep explanations very short and concise.
			DO NOT MAKE SUMMARIES, DO NOT PROVIDE A GENERAL OVERVIEW.
			If there are no suggestions, respond with: LGTM 👍
	
	Examples of Common Issues to Look For:
			Avoid big components; prefer small components.
			Avoid long, confusing names; prefer short/descriptive names.
			Avoid smart components; prefer dumb components.
			Avoid Higher-Order Components (HOCs); prefer hooks, props, or children.
			Avoid useEffect; prefer normal functions.
					If you can’t avoid an effect, extract it into a _named hook_: useEffect(() => { ... }, []); -> useNamedHook()
			Avoid named props for content; prefer children.
			Avoid repetition; prefer map().
			Avoid inlining/declaring functions inside JSX; prefer named functions.
			Avoid React states; prefer alternatives:
					Avoid controlled inputs; prefer using the state of the element itself.
					Avoid managing state of interactive elements; prefer native states.
					Avoid managing styling via JavaScript; prefer CSS/Tailwind.
					Avoid validation via JavaScript; prefer browser-native validation.
			Avoid useState/useReducer/useContext for shared states; prefer extracting your state from your components.
			Avoid coupling rendering to state; prefer decoupled rendering/state management.
			Avoid higher-order functions; prefer normal functions.
	
	Context: Consider the broader context of the project, including dependencies, project structure, and integration with other services.
	
	Tone: Use the tone of a senior/staff software engineer reviewing a PR. Be polite (suggest, don't order), professional, concise, and constructive.

Code Diff:
${codeDiff}`;

	console.log(`Prompt: ${prompt}`);

	const model = createMistral({
		apiKey: mistralApiKey,
	})('codestral-latest');

	try {
		const { text } = await generateText({
			model,
			prompt,
		});

		const sanitizedText = text.replaceAll('```json', '').replaceAll('```', '');

		return sanitizedText;
	} catch (error) {
		console.error('Error getting AI review:', error);
		return null;
	}
}
