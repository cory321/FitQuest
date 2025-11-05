import { supabase } from '@/lib/supabase';
import type { ChatConversation } from '../types';

export interface ConversationWithPreview extends ChatConversation {
	message_count?: number;
}

/**
 * Fetch all conversations for the current user, sorted by most recent
 */
export async function fetchConversations(): Promise<ConversationWithPreview[]> {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) throw new Error('Not authenticated');

	const { data, error } = await supabase
		.from('chat_conversations')
		.select('*')
		.eq('user_id', user.id)
		.order('updated_at', { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Create a new conversation
 */
export async function createConversation(
	title?: string
): Promise<ChatConversation> {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) throw new Error('Not authenticated');

	const { data, error } = await supabase
		.from('chat_conversations')
		.insert({
			user_id: user.id,
			title: title || 'New Conversation',
		})
		.select()
		.single();

	if (error) throw error;
	return data;
}

/**
 * Delete a conversation (messages will cascade delete via DB constraint)
 */
export async function deleteConversation(
	conversationId: string
): Promise<void> {
	const { error } = await supabase
		.from('chat_conversations')
		.delete()
		.eq('id', conversationId);

	if (error) throw error;
}

/**
 * Update conversation title (rename)
 */
export async function updateConversationTitle(
	conversationId: string,
	title: string
): Promise<void> {
	const { error } = await supabase
		.from('chat_conversations')
		.update({ title, updated_at: new Date().toISOString() })
		.eq('id', conversationId);

	if (error) throw error;
}

/**
 * Update conversation timestamp (touch updated_at)
 */
export async function updateConversationTimestamp(
	conversationId: string
): Promise<void> {
	const { error } = await supabase
		.from('chat_conversations')
		.update({ updated_at: new Date().toISOString() })
		.eq('id', conversationId);

	if (error) throw error;
}

