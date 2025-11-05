import { motion } from 'framer-motion';
import { MessageCircle, Sparkles } from 'lucide-react';

export function EmptyState() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col items-center justify-center py-16 px-4"
		>
			<div className="relative">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
					className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-2xl rounded-full"
				/>
				<div className="relative w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
					<MessageCircle className="h-10 w-10 text-primary" />
				</div>
			</div>

			<h2 className="mt-6 text-2xl font-bold text-center">
				Your AI Fitness Coach
			</h2>
			<p className="mt-2 text-muted-foreground text-center max-w-md">
				Ask me anything about your workouts, progress, or get personalized
				recommendations!
			</p>

			<div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
				<Sparkles className="h-4 w-4 text-primary" />
				<span>Powered by Claude AI</span>
			</div>
		</motion.div>
	);
}
