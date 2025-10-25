import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ScaleInProps {
	children: ReactNode;
	delay?: number;
	className?: string;
}

export function ScaleIn({ children, delay = 0, className }: ScaleInProps) {
	return (
		<motion.div
			initial={{ scale: 0, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			exit={{ scale: 0, opacity: 0 }}
			transition={{
				type: 'spring',
				stiffness: 260,
				damping: 20,
				delay,
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}
