import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
	format,
	startOfWeek,
	endOfWeek,
	eachDayOfInterval,
	isToday,
	isSameDay,
} from 'date-fns';
import { formatDateLocal } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import type { Workout, WorkoutSession } from '@/lib/supabase';

interface WeekViewProps {
	currentDate: Date;
	workouts: Workout[];
	sessions: WorkoutSession[];
	onDateClick: (date: Date) => void;
	selectedDate?: Date;
}

export const WeekView = memo(function WeekView({
	currentDate,
	workouts,
	sessions,
	onDateClick,
	selectedDate,
}: WeekViewProps) {
	// Calculate workout counts by date
	const workoutCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		
		workouts.forEach((workout) => {
			counts[workout.workout_date] = (counts[workout.workout_date] || 0) + 1;
		});
		
		sessions.forEach((session) => {
			counts[session.workout_date] = (counts[session.workout_date] || 0) + 1;
		});
		
		return counts;
	}, [workouts, sessions]);
	
	// Track which dates have completed workouts
	const completedDates = useMemo(() => {
		const completed = new Set<string>();
		
		sessions.forEach((session) => {
			if (session.completed) {
				completed.add(session.workout_date);
			}
		});
		
		return completed;
	}, [sessions]);

	// Generate week days
	const weekDays = useMemo(() => {
		const weekStart = startOfWeek(currentDate);
		const weekEnd = endOfWeek(currentDate);
		return eachDayOfInterval({ start: weekStart, end: weekEnd });
	}, [currentDate]);

	return (
		<div className="w-full">
			<div className="grid grid-cols-7 gap-2">
			{weekDays.map((day) => {
				const dateStr = formatDateLocal(day);
				const count = workoutCounts[dateStr] || 0;
				const isTodayDate = isToday(day);
				const isSelected = selectedDate && isSameDay(day, selectedDate);
				const isCompleted = completedDates.has(dateStr);

				return (
					<motion.button
						key={dateStr}
						whileTap={{ scale: 0.92 }}
						onClick={() => {
							haptics.buttonPress();
							onDateClick(day);
						}}
						className={`
							relative flex flex-col items-center justify-center
							min-h-[80px] rounded-xl p-2
							transition-all duration-200
							${isSelected 
								? isCompleted
									? 'bg-emerald-500 dark:bg-lime-500 text-white shadow-lg'
									: 'bg-primary text-primary-foreground shadow-lg'
								: isTodayDate
								? 'bg-muted/70 ring-2 ring-primary'
								: isCompleted && count > 0
								? 'bg-emerald-50 dark:bg-lime-950/30 border-2 border-emerald-500/60 dark:border-lime-500/50 hover:bg-emerald-100 dark:hover:bg-lime-950/50'
								: 'bg-card border border-border hover:bg-muted/50'
							}
						`}
						style={{
							WebkitTapHighlightColor: 'transparent',
						}}
					>
						{/* Day abbreviation */}
						<span
							className={`text-xs font-medium mb-1 ${
								isSelected 
									? 'text-emerald-950 dark:text-gray-900' 
									: isCompleted && count > 0 
									? 'text-emerald-800 dark:text-lime-400' 
									: 'text-muted-foreground'
							}`}
						>
							{format(day, 'EEE')}
						</span>

						{/* Date number */}
						<span
							className={`text-xl font-bold ${
								isSelected 
									? 'text-emerald-950 dark:text-gray-900' 
									: isTodayDate 
									? 'text-primary' 
									: isCompleted && count > 0 
									? 'text-emerald-700 dark:text-lime-400' 
									: ''
							}`}
						>
							{format(day, 'd')}
						</span>

						{/* Workout indicator */}
						<div className="mt-1 flex items-center justify-center min-h-[20px]">
							{count > 0 && (
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ type: 'spring', stiffness: 400, damping: 15 }}
									className="flex items-center gap-0.5"
								>
									{count <= 3 ? (
										// Show dots for 1-3 workouts
										Array.from({ length: count }).map((_, i) => (
											<div
												key={i}
												className={`w-1.5 h-1.5 rounded-full ${
													isSelected
														? 'bg-emerald-950 dark:bg-gray-900'
														: isCompleted
														? 'bg-emerald-500 dark:bg-lime-500'
														: 'bg-primary'
												}`}
											/>
										))
									) : (
										// Show count badge for 4+ workouts
										<div
											className={`
												px-1.5 py-0.5 rounded-full text-[10px] font-bold
												${
													isSelected
														? 'bg-emerald-950 dark:bg-gray-900 text-white'
														: isCompleted
														? 'bg-emerald-500 dark:bg-lime-500 text-white'
														: 'bg-primary text-primary-foreground'
												}
											`}
										>
											{count}
										</div>
									)}
								</motion.div>
							)}
						</div>
					</motion.button>
				);
			})}
			</div>
		</div>
	);
});

