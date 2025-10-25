import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface StaggerChildrenProps {
	children: ReactNode;
	staggerDelay?: number;
	className?: string;
}

export function StaggerChildren({
	children,
	staggerDelay = 0.05,
	className,
}: StaggerChildrenProps) {
	return (
		<motion.div
			initial="hidden"
			animate="visible"
			variants={{
				visible: {
					transition: {
						staggerChildren: staggerDelay,
					},
				},
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}

export const staggerItemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: 'spring',
			stiffness: 100,
			damping: 12,
		},
	},
};
