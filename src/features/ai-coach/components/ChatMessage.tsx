import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType } from '../types';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
	message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
	const isUser = message.role === 'user';

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className={cn(
				'flex gap-3 px-4 py-3',
				isUser ? 'justify-end' : 'justify-start'
			)}
		>
			{!isUser && (
				<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
					<Bot className="h-5 w-5 text-primary" />
				</div>
			)}

			<div
				className={cn(
					'max-w-[75%] rounded-2xl px-4 py-3',
					isUser
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-foreground'
				)}
			>
				<div className="text-sm sm:text-base prose prose-sm dark:prose-invert max-w-none break-words">
					<ReactMarkdown
						components={{
							p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
							strong: ({ children }) => (
								<strong className="font-semibold">{children}</strong>
							),
							em: ({ children }) => <em className="italic">{children}</em>,
							ul: ({ children }) => (
								<ul className="list-disc ml-4 mb-2">{children}</ul>
							),
							ol: ({ children }) => (
								<ol className="list-decimal ml-4 mb-2">{children}</ol>
							),
							li: ({ children }) => <li className="mb-1">{children}</li>,
						}}
					>
						{message.content}
					</ReactMarkdown>
				</div>
			</div>

			{isUser && (
				<div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
					<User className="h-5 w-5 text-muted-foreground" />
				</div>
			)}
		</motion.div>
	);
}
