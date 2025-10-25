import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import {
	format,
	parse,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	getDay,
	addMonths,
	subMonths,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase, type Workout, type WorkoutSession } from '@/lib/supabase';
import { WorkoutDialog } from './WorkoutDialog';
import { ThemeToggle } from './ThemeToggle';
import { StreakDisplay } from './StreakDisplay';
import { formatDateLocal, getWorkoutIntensity } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { haptics } from '@/lib/haptics';
import { RefreshCw, ChevronUp } from 'lucide-react';

const locales = {
	'en-US': enUS,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: () => startOfWeek(new Date()),
	getDay,
	locales,
});

// Custom component to display workout count on calendar dates
const CustomDateHeader = ({
	date,
	label,
	workoutCounts,
	onDateClick,
}: {
	date: Date;
	label: string;
	workoutCounts: Record<string, number>;
	onDateClick: (date: Date) => void;
}) => {
	const dateStr = formatDateLocal(date);
	const count = workoutCounts[dateStr] || 0;
	const intensity = getWorkoutIntensity(count);

	// Generate heat map color
	const getHeatMapColor = () => {
		if (count === 0) return 'transparent';
		const alpha = 0.2 + intensity * 0.6;
		return `rgba(224, 93, 56, ${alpha})`;
	};

	return (
		<motion.div
			whileTap={{ scale: 0.95 }}
			className="flex flex-col items-center justify-center h-full py-1 cursor-pointer rounded relative overflow-hidden"
			onClick={(e) => {
				e.stopPropagation();
				haptics.buttonPress();
				onDateClick(date);
			}}
			onTouchStart={(e) => {
				e.stopPropagation();
			}}
			onTouchEnd={(e) => {
				e.preventDefault();
				e.stopPropagation();
				haptics.buttonPress();
				onDateClick(date);
			}}
			style={{
				WebkitTapHighlightColor: 'transparent',
				backgroundColor: getHeatMapColor(),
			}}
		>
			<span className="text-sm sm:text-base font-medium relative z-10">
				{label}
			</span>
			{count > 0 && (
				<motion.span
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: 'spring', stiffness: 400, damping: 15 }}
					className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs font-bold text-primary-foreground bg-primary rounded-full mt-0.5 sm:mt-1 shadow-md relative z-10"
				>
					{count}
				</motion.span>
			)}
		</motion.div>
	);
};

export function WorkoutCalendar() {
	const [workouts, setWorkouts] = useState<Workout[]>([]);
	const [sessions, setSessions] = useState<WorkoutSession[]>([]);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pullToRefresh, setPullToRefresh] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [streakRefreshTrigger, setStreakRefreshTrigger] = useState(0);

	const fetchWorkouts = useCallback(async (date: Date) => {
		setIsLoading(true);
		setError(null);
		try {
			const monthStart = formatDateLocal(startOfMonth(date));
			const monthEnd = formatDateLocal(endOfMonth(date));

			// Fetch individual workouts
			const { data: workoutsData, error: workoutsError } = await supabase
				.from('workouts')
				.select('*')
				.gte('workout_date', monthStart)
				.lte('workout_date', monthEnd)
				.order('workout_date', { ascending: false });

			if (workoutsError) {
				console.error('Supabase error:', workoutsError);
				throw workoutsError;
			}

			// Fetch workout sessions
			const { data: sessionsData, error: sessionsError } = await supabase
				.from('workout_sessions')
				.select('*')
				.gte('workout_date', monthStart)
				.lte('workout_date', monthEnd)
				.order('workout_date', { ascending: false });

			if (sessionsError) {
				console.error('Supabase error:', sessionsError);
				throw sessionsError;
			}

			setWorkouts(workoutsData || []);
			setSessions(sessionsData || []);
		} catch (err) {
			console.error('Error fetching workouts:', err);
			setError('Failed to load workouts. Please try refreshing the page.');
			setWorkouts([]);
			setSessions([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchWorkouts(currentMonth);
	}, [currentMonth, fetchWorkouts]);

	const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
		setSelectedDate(slotInfo.start);
		setDialogOpen(true);
	};

	const handleDateClick = (date: Date) => {
		setSelectedDate(date);
		setDialogOpen(true);
	};

	const handleNavigate = (date: Date) => {
		setCurrentMonth(date);
	};

	const handleWorkoutAdded = () => {
		fetchWorkouts(currentMonth);
		// Trigger streak refresh when workouts change
		setStreakRefreshTrigger((prev) => prev + 1);
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		haptics.trigger('medium');
		await fetchWorkouts(currentMonth);
		setTimeout(() => {
			setIsRefreshing(false);
			setPullToRefresh(0);
		}, 500);
	};

	// Pull to refresh gesture
	const bind = useGesture({
		onDrag: ({ movement: [, my], direction: [, dy], cancel }) => {
			// Only allow pull down from top
			if (my < 0) {
				cancel();
				return;
			}

			// Cap the pull distance
			const pullDistance = Math.min(my, 100);
			setPullToRefresh(pullDistance);

			// Trigger refresh if pulled far enough
			if (pullDistance > 70 && dy > 0 && !isRefreshing) {
				handleRefresh();
				cancel();
			}
		},
		onDragEnd: () => {
			if (!isRefreshing) {
				setPullToRefresh(0);
			}
		},
	});

	// Swipe gesture for month navigation
	const swipeBind = useGesture({
		onDrag: ({ movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
			// Require significant swipe
			if (Math.abs(mx) > 100 && Math.abs(vx) > 0.5) {
				haptics.buttonPress();
				if (dx > 0) {
					// Swipe right - previous month
					setCurrentMonth(subMonths(currentMonth, 1));
				} else {
					// Swipe left - next month
					setCurrentMonth(addMonths(currentMonth, 1));
				}
				cancel();
			}
		},
	});

	// Listen for FAB click
	useEffect(() => {
		const handleFABClick = () => {
			setSelectedDate(new Date());
			setDialogOpen(true);
		};
		window.addEventListener('fab-add-workout', handleFABClick);
		return () => window.removeEventListener('fab-add-workout', handleFABClick);
	}, []);

	// Scroll to top on month change
	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
		haptics.buttonPress();
	};

	// Track scroll for "scroll to top" button
	useEffect(() => {
		const handleScroll = () => {
			setShowScrollTop(window.scrollY > 300);
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Calculate workout counts by date (including both individual workouts and sessions)
	const workoutCounts = workouts.reduce(
		(acc, workout) => {
			acc[workout.workout_date] = (acc[workout.workout_date] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	// Add session counts to workout counts
	sessions.forEach((session) => {
		workoutCounts[session.workout_date] =
			(workoutCounts[session.workout_date] || 0) + 1;
	});

	return (
		<div className="min-h-screen pb-24 relative" {...bind()}>
			{/* Pull to refresh indicator */}
			<motion.div
				initial={{ opacity: 0, y: -50 }}
				animate={{
					opacity: pullToRefresh > 20 ? 1 : 0,
					y: pullToRefresh > 0 ? pullToRefresh - 50 : -50,
				}}
				className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-card/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-border"
			>
				<RefreshCw
					className={`h-5 w-5 text-primary ${
						isRefreshing ? 'animate-spin' : ''
					}`}
				/>
			</motion.div>

			<div className="p-2 sm:p-4">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-3 sm:mb-4 flex items-start justify-between"
				>
					<div>
						<h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight">
							FitQuest Workout Tracker
						</h1>
						<p className="text-sm sm:text-base text-muted-foreground mt-1">
							Tap any day to add or view workouts
						</p>
					</div>
					<ThemeToggle />
				</motion.div>

				{/* Streak Display */}
				<div className="mb-4">
					<StreakDisplay refreshTrigger={streakRefreshTrigger} />
				</div>

				{error && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-700 text-red-900 dark:text-red-100 px-4 py-3 rounded-lg mb-4 shadow-sm"
					>
						<p className="font-semibold text-base">Error</p>
						<p className="text-sm sm:text-base mt-1">{error}</p>
						<button
							onClick={() => fetchWorkouts(currentMonth)}
							className="mt-3 px-4 py-2 bg-red-700 dark:bg-red-600 text-white dark:text-gray-100 rounded-md text-sm font-medium hover:bg-red-800 dark:hover:bg-red-700 active:scale-95 transition-all"
						>
							Try again
						</button>
					</motion.div>
				)}

				{isLoading && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-center py-4"
					>
						<p className="text-muted-foreground">Loading workouts...</p>
					</motion.div>
				)}

				{/* Calendar with swipe gesture */}
				<div {...swipeBind()}>
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3 }}
						className="bg-card rounded-lg shadow-lg p-2 sm:p-4"
						style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}
					>
						<Calendar
							localizer={localizer}
							events={[]}
							startAccessor="start"
							endAccessor="end"
							onSelectSlot={handleSelectSlot}
							onNavigate={handleNavigate}
							selectable
							views={['month']}
							defaultView="month"
							components={{
								month: {
									dateHeader: ({
										date,
										label,
									}: {
										date: Date;
										label: string;
									}) => (
										<CustomDateHeader
											date={date}
											label={label}
											workoutCounts={workoutCounts}
											onDateClick={handleDateClick}
										/>
									),
								},
							}}
						/>
					</motion.div>
				</div>
			</div>

			{/* Scroll to top button */}
			{showScrollTop && (
				<motion.button
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0, opacity: 0 }}
					whileTap={{ scale: 0.9 }}
					onClick={scrollToTop}
					className="fixed bottom-24 left-6 z-40 w-12 h-12 bg-card border-2 border-border text-foreground rounded-full shadow-lg flex items-center justify-center hover:shadow-xl active:shadow-md transition-shadow"
				>
					<ChevronUp className="h-5 w-5" />
				</motion.button>
			)}

			<WorkoutDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				selectedDate={selectedDate}
				workouts={workouts}
				onWorkoutAdded={handleWorkoutAdded}
			/>
		</div>
	);
}
