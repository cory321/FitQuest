import { useState, useCallback, useEffect } from 'react';
import { useChatMessages } from './useChatMessages';
import { useSendMessage } from './useSendMessage';
import type { ChatMessage } from '../types';

export function useChat(initialConversationId?: string | null) {
	const [conversationId, setConversationId] = useState<string | null>(
		initialConversationId || null
	);
	const {
		messages,
		addMessage,
		clearMessages,
		refetchMessages,
		isLoading: messagesLoading,
	} = useChatMessages(conversationId);
	const {
		sendMessage: sendToAPI,
		isLoading: sendingLoading,
		error,
	} = useSendMessage();

	// Update conversation ID when prop changes
	useEffect(() => {
		if (initialConversationId !== undefined) {
			setConversationId(initialConversationId);
		}
	}, [initialConversationId]);

	const sendMessage = useCallback(
		async (content: string) => {
			// Optimistically add user message
			const userMessage: ChatMessage = {
				id: `temp-${Date.now()}`,
				role: 'user',
				content,
				created_at: new Date().toISOString(),
			};
			addMessage(userMessage);

			// Send to API
			const response = await sendToAPI(content, conversationId);

			if (response) {
				// Update conversation ID if it's a new conversation
				if (!conversationId) {
					setConversationId(response.conversationId);
				}

				// Refetch messages from DB to get real IDs and ensure consistency
				await refetchMessages();
			}
		},
		[conversationId, addMessage, sendToAPI, refetchMessages]
	);

	const loadConversation = useCallback((newConversationId: string) => {
		setConversationId(newConversationId);
	}, []);

	const startNewConversation = useCallback(() => {
		setConversationId(null);
		clearMessages();
	}, [clearMessages]);

	return {
		messages,
		sendMessage,
		loadConversation,
		startNewConversation,
		currentConversationId: conversationId,
		isLoading: messagesLoading || sendingLoading,
		error,
	};
}
