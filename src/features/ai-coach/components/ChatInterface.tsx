import { useState } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';
import { SuggestedPrompts } from './SuggestedPrompts';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInterfaceProps {
	messages: any[];
	isLoading: boolean;
	error: string | null;
	onSendMessage: (message: string) => Promise<void>;
}

export function ChatInterface({
	messages,
	isLoading,
	error,
	onSendMessage,
}: ChatInterfaceProps) {
	const [inputValue, setInputValue] = useState('');

	const handleSend = async (message: string) => {
		if (!message.trim() || isLoading) return;

		setInputValue('');
		await onSendMessage(message);
	};

	const handlePromptClick = (prompt: string) => {
		handleSend(prompt);
	};

	return (
		<div className="flex-1 flex flex-col h-full relative">
			{/* Messages */}
			<div className="flex-1 overflow-y-auto pb-32">
				<AnimatePresence mode="popLayout">
					{messages.length === 0 ? (
						<motion.div
							key="empty"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							<EmptyState />
							<SuggestedPrompts onPromptClick={handlePromptClick} />
						</motion.div>
					) : (
						<MessageList messages={messages} isLoading={isLoading} />
					)}
				</AnimatePresence>
			</div>

			{/* Sticky Input Container - positioned above bottom nav */}
			<motion.div
				initial={{ y: 100 }}
				animate={{ y: 0 }}
				transition={{ type: 'spring', stiffness: 300, damping: 30 }}
				className="fixed bottom-16 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border"
				style={{
					boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.1)',
				}}
			>
				{/* Error Display */}
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="px-4 pt-3 pb-1 mx-4 bg-red-50 dark:bg-red-950/40 border border-red-400 dark:border-red-700 rounded-lg text-sm text-red-900 dark:text-red-100"
					>
						{error}
					</motion.div>
				)}

				{/* Input */}
				<div className="max-w-4xl mx-auto px-4 py-3">
					<ChatInput
						value={inputValue}
						onChange={setInputValue}
						onSend={handleSend}
						disabled={isLoading}
					/>
				</div>
			</motion.div>
		</div>
	);
}
