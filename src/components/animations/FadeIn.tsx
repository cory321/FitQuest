import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FadeInProps {
	children: ReactNode;
	delay?: number;
	duration?: number;
	className?: string;
}

export function FadeIn({
	children,
	delay = 0,
	duration = 0.3,
	className,
}: FadeInProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{
				duration,
				delay,
				ease: [0.22, 1, 0.36, 1], // Custom easing
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}
