import {
	createClient,
	SupabaseClient,
} from 'https://esm.sh/@supabase/supabase-js@2';

const RATE_LIMIT_WINDOW_MINUTES = 60;
const MAX_REQUESTS_PER_WINDOW = 100;

export async function checkRateLimit(
	supabaseClient: SupabaseClient,
	userId: string
): Promise<{ allowed: boolean; remainingRequests: number }> {
	const windowStart = new Date();
	windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

	// Get current rate limit record
	const { data: rateLimitData, error } = await supabaseClient
		.from('ai_rate_limits')
		.select('*')
		.eq('user_id', userId)
		.gte('window_start', windowStart.toISOString())
		.maybeSingle();

	if (error && error.code !== 'PGRST116') {
		// PGRST116 = no rows returned
		throw error;
	}

	if (!rateLimitData) {
		// Create new rate limit window
		await supabaseClient.from('ai_rate_limits').insert({
			user_id: userId,
			request_count: 1,
			window_start: new Date().toISOString(),
		});
		return { allowed: true, remainingRequests: MAX_REQUESTS_PER_WINDOW - 1 };
	}

	if (rateLimitData.request_count >= MAX_REQUESTS_PER_WINDOW) {
		return { allowed: false, remainingRequests: 0 };
	}

	// Increment counter
	await supabaseClient
		.from('ai_rate_limits')
		.update({ request_count: rateLimitData.request_count + 1 })
		.eq('id', rateLimitData.id);

	return {
		allowed: true,
		remainingRequests:
			MAX_REQUESTS_PER_WINDOW - rateLimitData.request_count - 1,
	};
}
