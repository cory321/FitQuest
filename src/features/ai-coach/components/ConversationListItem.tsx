import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { haptics } from '@/lib/haptics';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListItemProps {
	id: string;
	title: string | null;
	updatedAt: string;
	isActive: boolean;
	onSelect: () => void;
	onRename: (newTitle: string) => void;
	onDelete: () => void;
}

export function ConversationListItem({
	title,
	updatedAt,
	isActive,
	onSelect,
	onRename,
	onDelete,
}: ConversationListItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(title || 'Untitled');

	const displayTitle = title || 'Untitled Conversation';
	const truncatedTitle =
		displayTitle.length > 40
			? displayTitle.substring(0, 40) + '...'
			: displayTitle;

	const formattedDate = formatDistanceToNow(new Date(updatedAt), {
		addSuffix: true,
	});

	const handleRenameSubmit = () => {
		if (editValue.trim()) {
			haptics.buttonPress();
			onRename(editValue.trim());
			setIsEditing(false);
		}
	};

	const handleRenameCancel = () => {
		haptics.buttonPress();
		setEditValue(title || 'Untitled');
		setIsEditing(false);
	};

	const handleDeleteClick = () => {
		haptics.warning();
		// Simple confirmation
		if (window.confirm('Are you sure you want to delete this conversation?')) {
			onDelete();
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, x: -100 }}
			className={`group relative ${
				isActive ? 'bg-primary/10 border-primary' : 'bg-card border-border'
			} border rounded-xl overflow-hidden transition-colors`}
		>
			{isEditing ? (
				// Edit Mode
				<div className="p-4 space-y-3">
					<Input
						value={editValue}
						onChange={(e) => setEditValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleRenameSubmit();
							if (e.key === 'Escape') handleRenameCancel();
						}}
						autoFocus
						className="text-base"
						placeholder="Conversation title"
					/>
					<div className="flex gap-2">
						<Button
							onClick={handleRenameSubmit}
							size="sm"
							className="flex-1"
							disabled={!editValue.trim()}
						>
							<Check className="h-4 w-4 mr-2" />
							Save
						</Button>
						<Button
							onClick={handleRenameCancel}
							variant="outline"
							size="sm"
							className="flex-1"
						>
							<X className="h-4 w-4 mr-2" />
							Cancel
						</Button>
					</div>
				</div>
			) : (
				// Normal Mode
				<div className="flex items-center gap-3 p-4 min-h-[72px]">
					{/* Main Content - Clickable */}
					<button
						onClick={(e) => {
							e.stopPropagation();
							haptics.buttonPress();
							onSelect();
						}}
						className="flex-1 text-left min-w-0 touch-manipulation"
					>
						<h3 className="font-semibold text-base line-clamp-1 mb-1">
							{truncatedTitle}
						</h3>
						<p className="text-sm text-muted-foreground">{formattedDate}</p>
					</button>

					{/* Action Buttons */}
					<div className="flex-shrink-0 flex gap-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.stopPropagation();
								haptics.buttonPress();
								setIsEditing(true);
							}}
							className="h-10 w-10 hover:bg-primary/10 touch-manipulation"
						>
							<Pencil className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.stopPropagation();
								handleDeleteClick();
							}}
							className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive touch-manipulation"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</motion.div>
	);
}

