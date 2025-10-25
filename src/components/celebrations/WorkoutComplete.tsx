import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { ConfettiEffect } from './ConfettiEffect';

interface WorkoutCompleteProps {
	show: boolean;
	exerciseCount: number;
	onDismiss?: () => void;
}

const motivationalMessages = [
	'Beast Mode Activated!',
	'Crushing It!',
	'Unstoppable!',
	'Strong Work!',
	'You Did It!',
	'Legendary Session!',
	'Absolute Unit!',
	'Gains Incoming!',
];

export function WorkoutComplete({
	show,
	exerciseCount,
	onDismiss,
}: WorkoutCompleteProps) {
	const message =
		motivationalMessages[
			Math.floor(Math.random() * motivationalMessages.length)
		];

	return (
		<>
			<ConfettiEffect active={show} />
			<AnimatePresence>
				{show && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
						onClick={onDismiss}
					>
						<motion.div
							initial={{ scale: 0.5, opacity: 0, y: 100 }}
							animate={{
								scale: 1,
								opacity: 1,
								y: 0,
							}}
							exit={{ scale: 0.5, opacity: 0, y: -100 }}
							transition={{
								type: 'spring',
								stiffness: 200,
								damping: 20,
							}}
							className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/95 dark:to-green-950/95 rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-emerald-400 dark:border-emerald-700"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Trophy Icon */}
							<motion.div
								initial={{ scale: 0, rotate: -180 }}
								animate={{ scale: 1, rotate: 0 }}
								transition={{
									delay: 0.2,
									type: 'spring',
									stiffness: 200,
								}}
								className="flex justify-center mb-4"
							>
								<div className="relative">
									<Trophy className="h-20 w-20 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
									<motion.div
										animate={{
											scale: [1, 1.2, 1],
											rotate: [0, 10, -10, 0],
										}}
										transition={{
											duration: 2,
											repeat: Infinity,
											repeatType: 'reverse',
										}}
										className="absolute -top-2 -right-2"
									>
										<Star className="h-8 w-8 text-amber-500 dark:text-amber-300 fill-amber-500 dark:fill-amber-300" />
									</motion.div>
								</div>
							</motion.div>

							{/* Message */}
							<motion.h2
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								className="text-3xl font-bold text-center text-emerald-900 dark:text-emerald-100 mb-2"
							>
								{message}
							</motion.h2>

							<motion.p
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.4 }}
								className="text-center text-emerald-800 dark:text-emerald-200 text-lg mb-6"
							>
								Workout Complete!
							</motion.p>

							{/* Stats */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5 }}
								className="bg-white/60 dark:bg-black/30 rounded-xl p-4 mb-6"
							>
								<div className="flex items-center justify-center gap-2 text-emerald-900 dark:text-emerald-100">
									<TrendingUp className="h-5 w-5" />
									<span className="text-2xl font-bold">{exerciseCount}</span>
									<span className="text-sm">exercises completed</span>
								</div>
							</motion.div>

							{/* Dismiss Button */}
							<motion.button
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.6 }}
								whileTap={{ scale: 0.95 }}
								onClick={onDismiss}
								className="w-full bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white dark:text-gray-100 font-bold py-3 px-6 rounded-xl shadow-lg transition-colors"
							>
								Awesome!
							</motion.button>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
