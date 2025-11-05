import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';
import { logAIInteraction } from '../_shared/audit-logger.ts';
import { retrieveUserContext } from '../_shared/context-retriever.ts';
import { callClaude } from '../_shared/anthropic-client.ts';
import { buildSystemPrompt } from './prompts.ts';

serve(async (req) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	const startTime = Date.now();

	try {
		// Get Supabase client with user's JWT
		const supabaseClient = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_ANON_KEY') ?? '',
			{
				global: {
					headers: { Authorization: req.headers.get('Authorization')! },
				},
			}
		);

		// Verify user is authenticated
		const {
			data: { user },
			error: userError,
		} = await supabaseClient.auth.getUser();
		if (userError || !user) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Check rate limit
		const rateLimit = await checkRateLimit(supabaseClient, user.id);
		if (!rateLimit.allowed) {
			return new Response(
				JSON.stringify({
					error: 'Rate limit exceeded. Please try again later.',
					remainingRequests: 0,
				}),
				{
					status: 429,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				}
			);
		}

		// Parse request body
		const { message, conversationId, userLocalTime, userTimezone } =
			await req.json();

		if (!message || typeof message !== 'string') {
			return new Response(JSON.stringify({ error: 'Message is required' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Get or create conversation
		let currentConversationId = conversationId;
		if (!currentConversationId) {
			const { data: newConversation, error: conversationError } =
				await supabaseClient
					.from('chat_conversations')
					.insert({ user_id: user.id, title: message.substring(0, 50) })
					.select()
					.single();

			if (conversationError) throw conversationError;
			currentConversationId = newConversation.id;
		}

		// Save user message
		await supabaseClient.from('chat_messages').insert({
			conversation_id: currentConversationId,
			user_id: user.id,
			role: 'user',
			content: message,
		});

		// Retrieve user context
		const userContext = await retrieveUserContext(supabaseClient, user.id);

		// Build conversation history
		const { data: messageHistory } = await supabaseClient
			.from('chat_messages')
			.select('role, content')
			.eq('conversation_id', currentConversationId)
			.order('created_at', { ascending: true })
			.limit(10); // Last 10 messages for context

		// Build system prompt with user context
		const systemPrompt = buildSystemPrompt(
			userContext,
			userLocalTime,
			userTimezone
		);

		// Call Claude API
		const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
		if (!anthropicApiKey) {
			throw new Error('ANTHROPIC_API_KEY not configured');
		}

		const claudeResponse = await callClaude(
			anthropicApiKey,
			messageHistory || [],
			systemPrompt
		);

		// Save assistant response
		await supabaseClient.from('chat_messages').insert({
			conversation_id: currentConversationId,
			user_id: user.id,
			role: 'assistant',
			content: claudeResponse.content,
		});

		// Update conversation timestamp
		await supabaseClient
			.from('chat_conversations')
			.update({ updated_at: new Date().toISOString() })
			.eq('id', currentConversationId);

		// Log interaction
		await logAIInteraction(supabaseClient, {
			userId: user.id,
			conversationId: currentConversationId,
			queryType: 'chat',
			inputSummary: message.substring(0, 100),
			responseSummary: claudeResponse.content.substring(0, 100),
			executionTimeMs: Date.now() - startTime,
			tokensUsed:
				claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens,
		});

		// Return response
		return new Response(
			JSON.stringify({
				conversationId: currentConversationId,
				message: claudeResponse.content,
				remainingRequests: rateLimit.remainingRequests,
			}),
			{
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	} catch (error: any) {
		console.error('Error:', error);

		return new Response(
			JSON.stringify({ error: error.message || 'Internal server error' }),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	}
});
