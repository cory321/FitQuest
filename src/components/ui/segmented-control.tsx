import { motion } from 'framer-motion';
import { haptics } from '@/lib/haptics';

export interface SegmentedControlOption {
	value: string;
	label: string;
}

interface SegmentedControlProps {
	options: SegmentedControlOption[];
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export function SegmentedControl({
	options,
	value,
	onChange,
	className = '',
}: SegmentedControlProps) {
	const selectedIndex = options.findIndex((option) => option.value === value);

	return (
		<div
			className={`relative inline-flex items-center bg-muted/50 rounded-lg p-1 ${className}`}
			style={{ minHeight: '44px' }}
		>
			{/* Animated background indicator */}
			<motion.div
				className="absolute h-[calc(100%-8px)] bg-card rounded-md shadow-sm border border-border"
				initial={false}
				animate={{
					x: `calc(${selectedIndex * 100}% + ${selectedIndex * 4}px)`,
					width: `calc(${100 / options.length}% - 4px)`,
				}}
				transition={{
					type: 'spring',
					stiffness: 400,
					damping: 30,
				}}
				style={{
					left: '4px',
				}}
			/>

			{/* Option buttons */}
			{options.map((option) => {
				const isSelected = option.value === value;
				return (
					<button
						key={option.value}
						onClick={() => {
							if (value !== option.value) {
								haptics.buttonPress();
								onChange(option.value);
							}
						}}
						className={`relative z-10 px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md ${
							isSelected
								? 'text-foreground'
								: 'text-muted-foreground hover:text-foreground/80'
						}`}
						style={{
							minWidth: '80px',
							minHeight: '36px',
							WebkitTapHighlightColor: 'transparent',
						}}
					>
						<motion.span
							initial={false}
							animate={{
								scale: isSelected ? 1 : 0.95,
							}}
							transition={{
								type: 'spring',
								stiffness: 400,
								damping: 25,
							}}
						>
							{option.label}
						</motion.span>
					</button>
				);
			})}
		</div>
	);
}

