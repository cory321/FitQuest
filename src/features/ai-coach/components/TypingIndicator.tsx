import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
	return (
		<div className="flex gap-3 px-4 py-3">
			<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
				<Bot className="h-5 w-5 text-primary" />
			</div>

			<div className="max-w-[75%] rounded-2xl px-4 py-3 bg-muted">
				<div className="flex gap-1.5">
					{[0, 1, 2].map((i) => (
						<motion.div
							key={i}
							className="w-2 h-2 rounded-full bg-muted-foreground/50"
							animate={{ scale: [1, 1.2, 1] }}
							transition={{
								duration: 0.6,
								repeat: Infinity,
								delay: i * 0.15,
							}}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
