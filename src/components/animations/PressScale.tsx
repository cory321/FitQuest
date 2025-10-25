import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PressScaleProps {
	children: ReactNode;
	className?: string;
	onPress?: () => void;
	scale?: number;
}

export function PressScale({
	children,
	className,
	onPress,
	scale = 0.95,
}: PressScaleProps) {
	return (
		<motion.div
			whileTap={{ scale }}
			transition={{ type: 'spring', stiffness: 400, damping: 17 }}
			className={className}
			onClick={onPress}
		>
			{children}
		</motion.div>
	);
}
