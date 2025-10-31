import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
	format,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	eachDayOfInterval,
	isSameMonth,
	isToday,
} from 'date-fns';
import { formatDateLocal, getWorkoutIntensity } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import type { Workout, WorkoutSession } from '@/lib/supabase';

interface MonthViewProps {
	currentDate: Date;
	workouts: Workout[];
	sessions: WorkoutSession[];
	onDateClick: (date: Date) => void;
	onSwipe?: (direction: 'left' | 'right') => void;
}

export const MonthView = memo(function MonthView({
	currentDate,
	workouts,
	sessions,
	onDateClick,
}: MonthViewProps) {
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

	// Generate calendar grid
	const calendarDays = useMemo(() => {
		const monthStart = startOfMonth(currentDate);
		const monthEnd = endOfMonth(currentDate);
		const calendarStart = startOfWeek(monthStart);
		const calendarEnd = endOfWeek(monthEnd);

		return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
	}, [currentDate]);

	// Get heat map color based on workout count
	const getHeatMapColor = (count: number) => {
		if (count === 0) return 'transparent';
		const intensity = getWorkoutIntensity(count);
		const alpha = 0.2 + intensity * 0.6;
		return `rgba(224, 93, 56, ${alpha})`;
	};

	return (
		<div className="w-full">
			{/* Day headers */}
			<div className="grid grid-cols-7 gap-1 mb-2">
				{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
					<div
						key={day}
						className="text-center text-xs sm:text-sm font-semibold text-muted-foreground py-2"
					>
						{day}
					</div>
				))}
			</div>

			{/* Calendar grid */}
			<div className="grid grid-cols-7 gap-1">
				{calendarDays.map((day) => {
					const dateStr = formatDateLocal(day);
					const count = workoutCounts[dateStr] || 0;
					const isCurrentMonth = isSameMonth(day, currentDate);
					const isTodayDate = isToday(day);

					return (
						<motion.button
							key={dateStr}
							whileTap={{ scale: 0.92 }}
							onClick={() => {
								haptics.buttonPress();
								onDateClick(day);
							}}
							className={`
								relative aspect-square min-h-[44px] rounded-lg
								flex flex-col items-center justify-center
								transition-all duration-200
								${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40'}
								${isTodayDate ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
								hover:bg-muted/50
							`}
							style={{
								backgroundColor: getHeatMapColor(count),
								WebkitTapHighlightColor: 'transparent',
							}}
						>
							<span className={`text-sm sm:text-base font-medium ${isTodayDate ? 'font-bold' : ''}`}>
								{format(day, 'd')}
							</span>
							{count > 0 && (
								<motion.span
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ type: 'spring', stiffness: 400, damping: 15 }}
									className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-primary-foreground bg-primary rounded-full mt-0.5 shadow-sm"
								>
									{count}
								</motion.span>
							)}
						</motion.button>
					);
				})}
			</div>
		</div>
	);
});

