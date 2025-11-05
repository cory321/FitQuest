import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessage as ChatMessageType } from '../types';

interface MessageListProps {
	messages: ChatMessageType[];
	isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	return (
		<div className="flex-1 overflow-y-auto">
			{messages.map((message) => (
				<ChatMessage key={message.id} message={message} />
			))}
			{isLoading && <TypingIndicator />}
			<div ref={messagesEndRef} />
		</div>
	);
}
