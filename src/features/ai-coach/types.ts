export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	created_at: string;
}

export interface ChatConversation {
	id: string;
	user_id: string;
	title: string | null;
	created_at: string;
	updated_at: string;
}
