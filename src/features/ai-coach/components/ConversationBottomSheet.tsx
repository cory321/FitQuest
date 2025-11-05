import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';

interface ConversationBottomSheetProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	title: string;
}

export function ConversationBottomSheet({
	isOpen,
	onClose,
	children,
	title,
}: ConversationBottomSheetProps) {
	// Lock body scroll when sheet is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	const handleDragEnd = (
		_event: MouseEvent | TouchEvent | PointerEvent,
		info: { offset: { y: number }; velocity: { y: number } }
	) => {
		// Close if dragged down more than 100px or velocity is high
		if (info.offset.y > 100 || info.velocity.y > 500) {
			haptics.buttonPress();
			onClose();
		}
	};

	const handleBackdropClick = () => {
		haptics.buttonPress();
		onClose();
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
						onClick={handleBackdropClick}
					/>

					{/* Bottom Sheet */}
					<motion.div
						initial={{ y: '100%' }}
						animate={{ y: 0 }}
						exit={{ y: '100%' }}
						transition={{
							type: 'spring',
							damping: 30,
							stiffness: 300,
						}}
						className="fixed bottom-0 left-0 right-0 z-[101] bg-card rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]"
					>
						{/* Drag Handle */}
						<motion.div
							drag="y"
							dragConstraints={{ top: 0, bottom: 0 }}
							dragElastic={{ top: 0, bottom: 0.5 }}
							onDragEnd={handleDragEnd}
							className="flex-shrink-0 py-3 flex justify-center cursor-grab active:cursor-grabbing"
						>
							<div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
						</motion.div>

						{/* Header */}
						<div className="flex-shrink-0 px-6 pb-4 flex items-center justify-between border-b">
							<h2 className="text-2xl font-bold font-heading">{title}</h2>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									haptics.buttonPress();
									onClose();
								}}
								className="h-10 w-10 touch-manipulation"
							>
								<X className="h-5 w-5" />
							</Button>
						</div>

						{/* Content */}
						<div className="flex-1 overflow-y-auto overscroll-contain">
							{children}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

