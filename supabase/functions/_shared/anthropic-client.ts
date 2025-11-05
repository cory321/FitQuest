export async function callClaude(
	apiKey: string,
	messages: Array<{ role: string; content: string }>,
	systemPrompt: string
): Promise<{
	content: string;
	usage: { input_tokens: number; output_tokens: number };
}> {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
		},
		body: JSON.stringify({
			model: 'claude-sonnet-4-5-20250929',
			max_tokens: 1024,
			system: systemPrompt,
			messages: messages,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Claude API error: ${response.status} - ${errorText}`);
	}

	const data = await response.json();
	return {
		content: data.content[0].text,
		usage: data.usage,
	};
}
