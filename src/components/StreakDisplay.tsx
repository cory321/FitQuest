import React from 'react';
import { useStreaks } from '@/hooks/useStreaks';
import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar } from 'lucide-react';

interface StreakDisplayProps {
	refreshTrigger?: number;
}

export function StreakDisplay({ refreshTrigger }: StreakDisplayProps) {
	const { streakData, isLoading, refetch } = useStreaks();

	// Refetch streaks when workouts change
	React.useEffect(() => {
		if (refreshTrigger !== undefined && refreshTrigger > 0) {
			refetch();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshTrigger]);

	if (isLoading) {
		return (
			<div className="bg-white dark:bg-accent rounded-2xl p-4 border-2 border-border shadow-md">
				<div className="animate-pulse flex items-center gap-3">
					<div className="w-12 h-12 bg-muted rounded-full" />
					<div className="flex-1">
						<div className="h-4 bg-muted rounded w-24 mb-2" />
						<div className="h-3 bg-muted rounded w-32" />
					</div>
				</div>
			</div>
		);
	}

	const { currentStreak, weeklyCount, isStreakActive } = streakData;

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
			className="bg-white dark:bg-accent rounded-2xl p-5 border-2 border-border shadow-lg"
		>
			<div className="flex items-center gap-4">
				{/* Streak Flame */}
				<motion.div
					animate={{
						scale: isStreakActive ? [1, 1.1, 1] : 1,
						rotate: isStreakActive ? [0, 5, -5, 0] : 0,
					}}
					transition={{
						duration: 2,
						repeat: Infinity,
						repeatType: 'reverse',
					}}
					className="relative"
				>
					<div className="relative">
						<Flame
							className={`h-12 w-12 ${
								isStreakActive ? 'text-primary' : 'text-muted-foreground'
							}`}
							fill={isStreakActive ? 'currentColor' : 'none'}
						/>
						{isStreakActive && currentStreak >= 7 && (
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								className="absolute -top-1 -right-1"
							>
								<Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
							</motion.div>
						)}
					</div>
				</motion.div>

				{/* Streak Info */}
				<div className="flex-1">
					<div className="flex items-baseline gap-2">
						<motion.span
							key={currentStreak}
							initial={{ scale: 1.5, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ type: 'spring', stiffness: 200 }}
							className="text-3xl font-bold font-heading text-primary"
						>
							{currentStreak}
						</motion.span>
						<span className="text-sm font-semibold text-foreground">
							day streak
						</span>
					</div>
					<p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
						{isStreakActive ? (
							<>
								<Flame className="h-3 w-3 text-primary" />
								Keep it going!
							</>
						) : (
							<>
								<Calendar className="h-3 w-3" />
								Work out today to start a streak
							</>
						)}
					</p>
				</div>

				{/* Weekly Progress */}
				<div className="text-center">
					<div className="relative w-16 h-16">
						{/* Background circle */}
						<svg className="w-full h-full transform -rotate-90">
							<circle
								cx="32"
								cy="32"
								r="28"
								stroke="currentColor"
								strokeWidth="4"
								fill="none"
								className="text-muted"
							/>
							{/* Progress circle */}
							<motion.circle
								cx="32"
								cy="32"
								r="28"
								stroke="currentColor"
								strokeWidth="4"
								fill="none"
								strokeDasharray={`${2 * Math.PI * 28}`}
								initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
								animate={{
									strokeDashoffset: 2 * Math.PI * 28 * (1 - weeklyCount / 7),
								}}
								transition={{ duration: 1, ease: 'easeOut' }}
								className="text-primary"
								strokeLinecap="round"
							/>
						</svg>
						{/* Center text */}
						<div className="absolute inset-0 flex flex-col items-center justify-center">
							<span className="text-xl font-bold font-heading text-primary">
								{weeklyCount}
							</span>
							<span className="text-[8px] text-muted-foreground">/7</span>
						</div>
					</div>
					<p className="text-xs text-muted-foreground mt-1">This week</p>
				</div>
			</div>
		</motion.div>
	);
}
