import { useState } from 'react';
import { MessageCircle, ArrowLeft, History } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChatInterface } from './ChatInterface';
import { ConversationBottomSheet } from './ConversationBottomSheet';
import { ConversationList } from './ConversationList';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';
import { useChat } from '../hooks/useChat';

export function CoachPage() {
	const navigate = useNavigate();
	const [isConversationListOpen, setIsConversationListOpen] = useState(false);

	const {
		messages,
		sendMessage,
		loadConversation,
		startNewConversation,
		currentConversationId,
		isLoading,
		error,
	} = useChat();

	const handleOpenConversationList = () => {
		haptics.buttonPress();
		setIsConversationListOpen(true);
	};

	const handleSelectConversation = (conversationId: string) => {
		haptics.buttonPress();
		loadConversation(conversationId);
		setIsConversationListOpen(false);
	};

	const handleNewConversation = () => {
		haptics.buttonPress();
		startNewConversation();
		setIsConversationListOpen(false);
	};

	return (
		<div className="h-screen bg-background flex flex-col overflow-hidden">
			{/* Header */}
			<div className="bg-card border-b z-10 shadow-sm flex-shrink-0">
				<div className="max-w-4xl mx-auto p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									haptics.buttonPress();
									navigate('/');
								}}
							>
								<ArrowLeft className="h-5 w-5" />
							</Button>
							<div>
								<h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
									<MessageCircle className="h-7 w-7 sm:h-9 sm:w-9 text-primary" />
									AI Fitness Coach
								</h1>
								<p className="text-sm sm:text-base text-muted-foreground mt-1">
									Your personalized workout assistant
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="icon"
								onClick={handleOpenConversationList}
								className="h-10 w-10 touch-manipulation"
							>
								<History className="h-5 w-5" />
							</Button>
							<ThemeToggle />
						</div>
					</div>
				</div>
			</div>

			{/* Chat Interface */}
			<div className="flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden">
				<ChatInterface
					messages={messages}
					isLoading={isLoading}
					error={error}
					onSendMessage={sendMessage}
				/>
			</div>

			{/* Conversation List Bottom Sheet */}
			<ConversationBottomSheet
				isOpen={isConversationListOpen}
				onClose={() => setIsConversationListOpen(false)}
				title="Conversations"
			>
				<ConversationList
					currentConversationId={currentConversationId}
					onSelectConversation={handleSelectConversation}
					onNewConversation={handleNewConversation}
				/>
			</ConversationBottomSheet>
		</div>
	);
}
