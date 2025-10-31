import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import type { ReactNode } from 'react';

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
	};
	children?: ReactNode;
	compact?: boolean;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	secondaryAction,
	children,
	compact = false,
}: EmptyStateProps) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3 }}
			className={`text-center ${compact ? 'py-8' : 'py-12'} px-4`}
		>
			<motion.div
				animate={{
					y: [0, -10, 0],
				}}
				transition={{
					duration: 2,
					repeat: Infinity,
					ease: 'easeInOut',
				}}
				className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full mb-4"
			>
				<Icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
			</motion.div>

			<h3 className="text-lg sm:text-xl font-bold mb-2">{title}</h3>
			<p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-6">
				{description}
			</p>

			{children}

			{(action || secondaryAction) && (
				<div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
					{action && (
						<motion.div whileTap={{ scale: 0.95 }}>
							<Button onClick={action.onClick} size="lg" className="min-w-[200px]">
								{action.label}
							</Button>
						</motion.div>
					)}
					{secondaryAction && (
						<motion.div whileTap={{ scale: 0.95 }}>
							<Button
								onClick={secondaryAction.onClick}
								variant="outline"
								size="lg"
								className="min-w-[200px]"
							>
								{secondaryAction.label}
							</Button>
						</motion.div>
					)}
				</div>
			)}
		</motion.div>
	);
}
