import { generateText } from 'ai';
import { createMistral } from '@ai-sdk/mistral';

export async function generateAIReview(codeDiff: string, mistralApiKey: string): Promise<string | null> {
	const prompt = `
Review the following code changes (diff format) for potential issues, style inconsistencies, and adherence to best practices. 
Focus on potential security vulnerabilities, performance bottlenecks, and coding conventions. 
Provide concise review comments referencing files and lines if possible.
Follow the following recommendations: 
- Avoid big components, prefer small components
- Avoid long, confusing names, prefer short/descriptive names
- Avoid smart components, prefer dumb components
- Avoid Higher-Order Components (HOCs), prefer hooks, props or children
- Avoid named props for content, prefer children
- Avoid repetition, prefer map()
- Avoid inlining/declaring functions inside JSX, prefer named functions
- Avoid unnecessary wrapper elements, prefer unwrapped elements or fragments
- Avoid start/end tags, prefer self-closing components (where possible)
- Avoid React states, prefer alternatives
	- Avoid controlled inputs, prefer using the state of the element itself
  - Avoid managing state of interactive elements, prefer native states
	- Avoid managing styling via JavaScript, prefer CSS
	- Avoid validation via JavaScript, prefer browser-native validation
- Avoid useState/useReducer/useContext for shared states, prefer extracting your state from your components
- Avoid coupling rendering to state, prefer decoupled rendering/state management
- Avoid higher-order functions, prefer normal functions
- Avoid useEffect, prefer normal functions.
- If you can’t avoid an effect, extract it into a named hook.


\n\n${codeDiff}`;

	const model = createMistral({
		apiKey: mistralApiKey,
	})('codestral-latest');

	try {
		const { text } = await generateText({
			model,
			prompt,
		});

		return text;
	} catch (error) {
		console.error('Error getting AI review:', error);
		return null;
	}
}
