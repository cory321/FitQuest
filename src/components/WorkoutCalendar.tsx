import { useState, useEffect, useCallback, useMemo } from 'react';
import {
	format,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	addMonths,
	subMonths,
	addWeeks,
	subWeeks,
	addDays,
	subDays,
} from 'date-fns';
import { supabase, type Workout, type WorkoutSession } from '@/lib/supabase';
import { WorkoutDialog } from './WorkoutDialog';
import { ThemeToggle } from './ThemeToggle';
import { StreakDisplay } from './StreakDisplay';
import { formatDateLocal } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { haptics } from '@/lib/haptics';
import {
	RefreshCw,
	ChevronUp,
	Dumbbell,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { SegmentedControl } from './ui/segmented-control';
import { MonthView } from './calendar/MonthView';
import { WeekView } from './calendar/WeekView';
import { DayView } from './calendar/DayView';

type CalendarView = 'month' | 'week' | 'day';

const VIEW_OPTIONS = [
	{ value: 'month', label: 'Month' },
	{ value: 'week', label: 'Week' },
	{ value: 'day', label: 'Day' },
];

// Custom Toolbar for calendar navigation
const CustomToolbar = ({
	date,
	view,
	onNavigate,
}: {
	date: Date;
	view: CalendarView;
	onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
}) => {
	const goToBack = () => {
		haptics.buttonPress();
		onNavigate('PREV');
	};

	const goToNext = () => {
		haptics.buttonPress();
		onNavigate('NEXT');
	};

	const goToToday = () => {
		haptics.buttonPress();
		onNavigate('TODAY');
	};

	const getDisplayText = () => {
		switch (view) {
			case 'month':
				return format(date, 'MMM yyyy');
			case 'week':
				const weekStart = startOfWeek(date);
				const weekEnd = endOfWeek(date);
				return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
			case 'day':
				return format(date, 'EEEE, MMM d, yyyy');
		}
	};

	return (
		<div className="flex items-center justify-between mb-4 px-2">
			<motion.div whileTap={{ scale: 0.95 }}>
				<Button
					onClick={goToBack}
					variant="outline"
					size="icon"
					className="h-11 w-11"
				>
					<ChevronLeft className="h-5 w-5" />
				</Button>
			</motion.div>

			<div className="flex-1 text-center px-2">
				<h2 className="text-lg sm:text-2xl font-bold line-clamp-2">
					{getDisplayText()}
				</h2>
			</div>

			<div className="flex items-center gap-2">
				<motion.div whileTap={{ scale: 0.95 }}>
					<Button
						onClick={goToToday}
						variant="outline"
						className="h-11 px-3 text-sm font-medium"
					>
						Today
					</Button>
				</motion.div>
				<motion.div whileTap={{ scale: 0.95 }}>
					<Button
						onClick={goToNext}
						variant="outline"
						size="icon"
						className="h-11 w-11"
					>
						<ChevronRight className="h-5 w-5" />
					</Button>
				</motion.div>
			</div>
		</div>
	);
};

export function WorkoutCalendar() {
	// Get initial view from localStorage
	const getInitialView = (): CalendarView => {
		const saved = localStorage.getItem('calendar-view-preference');
		if (saved === 'month' || saved === 'week' || saved === 'day') {
			return saved;
		}
		return 'month';
	};

	const [workouts, setWorkouts] = useState<Workout[]>([]);
	const [sessions, setSessions] = useState<WorkoutSession[]>([]);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [currentDate, setCurrentDate] = useState(new Date());
	const [view, setView] = useState<CalendarView>(getInitialView());
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pullToRefresh, setPullToRefresh] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [streakRefreshTrigger, setStreakRefreshTrigger] = useState(0);

	// Save view preference to localStorage
	useEffect(() => {
		localStorage.setItem('calendar-view-preference', view);
	}, [view]);

	const fetchWorkouts = useCallback(
		async (date: Date, currentView: CalendarView) => {
			setIsLoading(true);
			setError(null);
			try {
				let startDate: string;
				let endDate: string;

				// Determine date range based on view
				switch (currentView) {
					case 'month':
						startDate = formatDateLocal(startOfMonth(date));
						endDate = formatDateLocal(endOfMonth(date));
						break;
					case 'week':
						startDate = formatDateLocal(startOfWeek(date));
						endDate = formatDateLocal(endOfWeek(date));
						break;
					case 'day':
						// Fetch a few days before and after for smooth navigation
						startDate = formatDateLocal(subDays(date, 3));
						endDate = formatDateLocal(addDays(date, 3));
						break;
				}

				// Fetch individual workouts
				const { data: workoutsData, error: workoutsError } = await supabase
					.from('workouts')
					.select('*')
					.gte('workout_date', startDate)
					.lte('workout_date', endDate)
					.order('workout_date', { ascending: false });

				if (workoutsError) {
					console.error('Supabase error:', workoutsError);
					throw workoutsError;
				}

				// Fetch workout sessions
				const { data: sessionsData, error: sessionsError } = await supabase
					.from('workout_sessions')
					.select('*')
					.gte('workout_date', startDate)
					.lte('workout_date', endDate)
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
		},
		[]
	);

	useEffect(() => {
		fetchWorkouts(currentDate, view);
	}, [currentDate, view, fetchWorkouts]);

	const handleDateClick = (date: Date) => {
		if (view === 'month' || view === 'week') {
			// Switch to day view when clicking a date from month or week view
			setCurrentDate(date);
			setView('day');
		} else {
			// In day view, open dialog for adding workout
			setSelectedDate(date);
			setDialogOpen(true);
		}
	};

	const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
		setCurrentDate((prevDate) => {
			if (action === 'TODAY') return new Date();

			switch (view) {
				case 'month':
					return action === 'PREV'
						? subMonths(prevDate, 1)
						: addMonths(prevDate, 1);
				case 'week':
					return action === 'PREV'
						? subWeeks(prevDate, 1)
						: addWeeks(prevDate, 1);
				case 'day':
					return action === 'PREV' ? subDays(prevDate, 1) : addDays(prevDate, 1);
			}
		});
	};

	const handleWorkoutAdded = () => {
		fetchWorkouts(currentDate, view);
		// Trigger streak refresh when workouts change
		setStreakRefreshTrigger((prev) => prev + 1);
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		haptics.trigger('medium');
		await fetchWorkouts(currentDate, view);
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

	// Swipe gesture for navigation
	const swipeBind = useGesture({
		onDrag: ({ movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
			// Require significant swipe
			if (Math.abs(mx) > 100 && Math.abs(vx) > 0.5) {
				haptics.buttonPress();
				if (dx > 0) {
					// Swipe right - previous
					handleNavigate('PREV');
				} else {
					// Swipe left - next
					handleNavigate('NEXT');
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

	// Scroll to top on view/date change
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
						<h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-2">
							<Dumbbell className="h-7 w-7 sm:h-9 sm:w-9 text-primary" />
							FitQuest Workout Tracker
						</h1>
						<p className="text-sm sm:text-base text-muted-foreground mt-1">
							{view === 'day'
								? 'View and manage your workouts'
								: 'Tap any day to view workouts'}
						</p>
					</div>
					<ThemeToggle />
				</motion.div>

				{/* Streak Display */}
				<div className="mb-4">
					<StreakDisplay refreshTrigger={streakRefreshTrigger} />
				</div>

				{/* View Selector */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className="flex justify-center mb-4"
				>
					<SegmentedControl
						options={VIEW_OPTIONS}
						value={view}
						onChange={(newView) => setView(newView as CalendarView)}
					/>
				</motion.div>

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
							onClick={() => fetchWorkouts(currentDate, view)}
							className="mt-3 px-4 py-2 bg-red-700 dark:bg-red-600 text-white dark:text-gray-100 rounded-md text-sm font-medium hover:bg-red-800 dark:hover:bg-red-700 active:scale-95 transition-all"
						>
							Try again
						</button>
					</motion.div>
				)}

				{/* Calendar View with swipe gesture */}
				<div {...swipeBind()}>
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3 }}
						className="bg-card rounded-lg shadow-lg p-3 sm:p-6 relative overflow-hidden"
					>
						{/* Loading progress bar */}
						{isLoading && (
							<motion.div
								initial={{ scaleX: 0 }}
								animate={{ scaleX: 1 }}
								transition={{ duration: 0.3 }}
								className="absolute top-0 left-0 right-0 h-1 bg-primary origin-left z-50"
							>
								<motion.div
									animate={{ x: ['0%', '100%'] }}
									transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
									className="h-full w-1/3 bg-primary-foreground/30"
								/>
							</motion.div>
						)}

						{/* Navigation Toolbar */}
						<CustomToolbar
							date={currentDate}
							view={view}
							onNavigate={handleNavigate}
						/>

						{/* Render appropriate view */}
						<motion.div
							key={view}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.2 }}
						>
							{view === 'month' && (
								<MonthView
									currentDate={currentDate}
									workouts={workouts}
									sessions={sessions}
									onDateClick={handleDateClick}
								/>
							)}
							{view === 'week' && (
								<WeekView
									currentDate={currentDate}
									workouts={workouts}
									sessions={sessions}
									onDateClick={handleDateClick}
									selectedDate={currentDate}
								/>
							)}
							{view === 'day' && (
								<DayView
									currentDate={currentDate}
									workouts={workouts}
									onWorkoutAdded={handleWorkoutAdded}
								/>
							)}
						</motion.div>
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
					style={{ minWidth: '48px', minHeight: '48px' }}
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
