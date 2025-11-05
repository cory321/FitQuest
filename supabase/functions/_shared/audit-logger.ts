import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function logAIInteraction(
	supabaseClient: SupabaseClient,
	params: {
		userId: string;
		conversationId?: string;
		queryType: string;
		inputSummary?: string;
		responseSummary?: string;
		executionTimeMs?: number;
		tokensUsed?: number;
		error?: string;
	}
) {
	await supabaseClient.from('ai_audit_logs').insert({
		user_id: params.userId,
		conversation_id: params.conversationId,
		query_type: params.queryType,
		input_summary: params.inputSummary,
		response_summary: params.responseSummary,
		execution_time_ms: params.executionTimeMs,
		tokens_used: params.tokensUsed,
		error: params.error,
	});
}
