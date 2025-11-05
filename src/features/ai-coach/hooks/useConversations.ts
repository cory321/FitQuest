import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
	fetchConversations,
	deleteConversation,
	updateConversationTitle,
} from '../services/conversationService';
import type { ConversationWithPreview } from '../services/conversationService';

export function useConversations() {
	const [conversations, setConversations] = useState<
		ConversationWithPreview[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch conversations
	const loadConversations = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const data = await fetchConversations();
			setConversations(data);
		} catch (err: any) {
			console.error('Error fetching conversations:', err);
			setError(err.message || 'Failed to load conversations');
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Initial load
	useEffect(() => {
		loadConversations();
	}, [loadConversations]);

	// Subscribe to real-time updates
	useEffect(() => {
		const {
			data: { subscription: authSubscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_IN' && session) {
				loadConversations();
			} else if (event === 'SIGNED_OUT') {
				setConversations([]);
			}
		});

		// Subscribe to conversation changes
		const conversationSubscription = supabase
			.channel('conversations-changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'chat_conversations',
				},
				(payload) => {
					console.log('Conversation change detected:', payload);
					loadConversations();
				}
			)
			.subscribe();

		return () => {
			authSubscription.unsubscribe();
			conversationSubscription.unsubscribe();
		};
	}, [loadConversations]);

	// Delete a conversation
	const handleDelete = useCallback(
		async (conversationId: string) => {
			try {
				await deleteConversation(conversationId);
				// Optimistically update UI
				setConversations((prev) =>
					prev.filter((conv) => conv.id !== conversationId)
				);
			} catch (err: any) {
				console.error('Error deleting conversation:', err);
				setError(err.message || 'Failed to delete conversation');
				// Reload to ensure consistency
				loadConversations();
			}
		},
		[loadConversations]
	);

	// Rename a conversation
	const handleRename = useCallback(
		async (conversationId: string, newTitle: string) => {
			try {
				await updateConversationTitle(conversationId, newTitle);
				// Optimistically update UI
				setConversations((prev) =>
					prev.map((conv) =>
						conv.id === conversationId ? { ...conv, title: newTitle } : conv
					)
				);
			} catch (err: any) {
				console.error('Error renaming conversation:', err);
				setError(err.message || 'Failed to rename conversation');
				// Reload to ensure consistency
				loadConversations();
			}
		},
		[loadConversations]
	);

	return {
		conversations,
		isLoading,
		error,
		deleteConversation: handleDelete,
		renameConversation: handleRename,
		refreshConversations: loadConversations,
	};
}

