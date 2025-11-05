import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '../types';

export function useChatMessages(conversationId: string | null) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchMessages = useCallback(async () => {
		if (!conversationId) {
			setMessages([]);
			return;
		}

		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from('chat_messages')
				.select('*')
				.eq('conversation_id', conversationId)
				.order('created_at', { ascending: true });

			if (error) throw error;
			setMessages(data || []);
		} catch (err) {
			console.error('Error fetching messages:', err);
		} finally {
			setIsLoading(false);
		}
	}, [conversationId]);

	useEffect(() => {
		fetchMessages();
	}, [fetchMessages]);

	const addMessage = (message: ChatMessage) => {
		setMessages((prev) => [...prev, message]);
	};

	const clearMessages = () => {
		setMessages([]);
	};

	return {
		messages,
		addMessage,
		clearMessages,
		refetchMessages: fetchMessages,
		isLoading,
	};
}
