import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface SendMessageResponse {
	conversationId: string;
	message: string;
	remainingRequests: number;
}

export function useSendMessage() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const sendMessage = useCallback(
		async (
			message: string,
			conversationId: string | null
		): Promise<SendMessageResponse | null> => {
			setIsLoading(true);
			setError(null);

			try {
				// Get auth session
				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();
				if (sessionError || !session) {
					throw new Error('Not authenticated');
				}

				// Get user's current local time
				const userLocalTime = new Date().toISOString();
				const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

				// Call Edge Function
				const response = await fetch(
					`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-coach`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${session.access_token}`,
						},
						body: JSON.stringify({
							message,
							conversationId,
							userLocalTime,
							userTimezone,
						}),
					}
				);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Failed to send message');
				}

				const data = await response.json();
				return data;
			} catch (err: any) {
				console.error('Error sending message:', err);
				setError(err.message || 'Failed to send message');
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	return { sendMessage, isLoading, error };
}
