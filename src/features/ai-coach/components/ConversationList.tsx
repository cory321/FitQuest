import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationListItem } from './ConversationListItem';
import { useConversations } from '../hooks/useConversations';
import { haptics } from '@/lib/haptics';
import type { ConversationWithPreview } from '../services/conversationService';

interface ConversationListProps {
	currentConversationId: string | null;
	onSelectConversation: (conversationId: string) => void;
	onNewConversation: () => void;
}

export function ConversationList({
	currentConversationId,
	onSelectConversation,
	onNewConversation,
}: ConversationListProps) {
	const {
		conversations,
		isLoading,
		error,
		deleteConversation,
		renameConversation,
	} = useConversations();

	const handleNewConversation = () => {
		haptics.buttonPress();
		onNewConversation();
	};

	if (isLoading) {
		return (
			<div className="p-6">
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-[72px] bg-muted/50 rounded-xl animate-pulse"
						/>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<div className="text-center py-8">
					<p className="text-destructive text-sm">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* New Conversation Button */}
			<div className="flex-shrink-0 p-6 pb-4">
				<Button
					onClick={handleNewConversation}
					className="w-full h-14 text-base font-semibold touch-manipulation"
					size="lg"
				>
					<Plus className="h-5 w-5 mr-2" />
					New Conversation
				</Button>
			</div>

			{/* Conversations List */}
			<div className="flex-1 overflow-y-auto px-6 pb-6">
				{conversations.length === 0 ? (
					// Empty State
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center py-12 px-4"
					>
						<div className="mb-4 flex justify-center">
							<div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
								<MessageCircle className="h-8 w-8 text-primary" />
							</div>
						</div>
						<h3 className="text-lg font-semibold mb-2">
							No conversations yet
						</h3>
						<p className="text-sm text-muted-foreground mb-6">
							Start a new conversation with your AI fitness coach
						</p>
					</motion.div>
				) : (
					// Conversations
					<div className="space-y-3">
						<AnimatePresence mode="popLayout">
							{conversations.map((conversation) => (
								<ConversationListItem
									key={conversation.id}
									id={conversation.id}
									title={conversation.title}
									updatedAt={conversation.updated_at}
									isActive={conversation.id === currentConversationId}
									onSelect={() => onSelectConversation(conversation.id)}
									onRename={(newTitle) =>
										renameConversation(conversation.id, newTitle)
									}
									onDelete={() => deleteConversation(conversation.id)}
								/>
							))}
						</AnimatePresence>
					</div>
				)}
			</div>
		</div>
	);
}

