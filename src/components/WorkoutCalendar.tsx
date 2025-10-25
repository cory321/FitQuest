import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import {
	format,
	parse,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	getDay,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase, type Workout, type WorkoutSession } from '@/lib/supabase';
import { WorkoutDialog } from './WorkoutDialog';
import { ThemeToggle } from './ThemeToggle';
import { formatDateLocal } from '@/lib/utils';

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

	return (
		<div
			className="flex flex-col items-center justify-center h-full py-1 cursor-pointer active:bg-accent transition-colors rounded"
			onClick={(e) => {
				e.stopPropagation();
				onDateClick(date);
			}}
			onTouchStart={(e) => {
				e.stopPropagation();
			}}
			onTouchEnd={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onDateClick(date);
			}}
			style={{ WebkitTapHighlightColor: 'transparent' }}
		>
			<span className="text-sm sm:text-base font-medium">{label}</span>
			{count > 0 && (
				<span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs font-bold text-primary-foreground bg-primary rounded-full mt-0.5 sm:mt-1 shadow-sm">
					{count}
				</span>
			)}
		</div>
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
	};

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
		<div className="h-screen p-2 sm:p-4">
			<div className="mb-3 sm:mb-4 flex items-start justify-between">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold">
						FitQuest Workout Tracker
					</h1>
					<p className="text-sm sm:text-base text-muted-foreground">
						Tap any day to add or view workouts
					</p>
				</div>
				<ThemeToggle />
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 shadow-sm">
					<p className="font-semibold text-base">Error</p>
					<p className="text-sm sm:text-base mt-1">{error}</p>
					<button
						onClick={() => fetchWorkouts(currentMonth)}
						className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 active:scale-95 transition-all"
					>
						Try again
					</button>
				</div>
			)}

			{isLoading && (
				<div className="text-center py-4">
					<p className="text-muted-foreground">Loading workouts...</p>
				</div>
			)}

			<div
				className="bg-card rounded-lg shadow-lg p-2 sm:p-4"
				style={{ height: 'calc(100vh - 120px)' }}
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
							dateHeader: ({ date, label }: { date: Date; label: string }) => (
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
			</div>

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
