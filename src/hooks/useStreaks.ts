import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
	calculateStreak,
	calculateLongestStreak,
	getWeeklyWorkoutCount,
	formatDateLocal,
} from '@/lib/utils';

export interface StreakData {
	currentStreak: number;
	longestStreak: number;
	weeklyCount: number;
	totalWorkouts: number;
	lastWorkoutDate: string | null;
	isStreakActive: boolean;
}

export function useStreaks() {
	const [streakData, setStreakData] = useState<StreakData>({
		currentStreak: 0,
		longestStreak: 0,
		weeklyCount: 0,
		totalWorkouts: 0,
		lastWorkoutDate: null,
		isStreakActive: false,
	});
	const [isLoading, setIsLoading] = useState(true);

	const fetchStreakData = useCallback(async () => {
		setIsLoading(true);
		try {
			// Fetch all workout dates (from both workouts and sessions)
			const { data: workouts, error: workoutsError } = await supabase
				.from('workouts')
				.select('workout_date');

			if (workoutsError) throw workoutsError;

			const { data: sessions, error: sessionsError } = await supabase
				.from('workout_sessions')
				.select('workout_date');

			if (sessionsError) throw sessionsError;

			// Combine and get unique dates
			const allDates = [
				...(workouts?.map((w) => w.workout_date) || []),
				...(sessions?.map((s) => s.workout_date) || []),
			];

			const uniqueDates = [...new Set(allDates)];

			// Calculate streak data
			const currentStreak = calculateStreak(uniqueDates);
			const longestStreak = calculateLongestStreak(uniqueDates);
			const weeklyCount = getWeeklyWorkoutCount(uniqueDates);

			// Get last workout date
			const sortedDates = uniqueDates.sort((a, b) => b.localeCompare(a));
			const lastWorkoutDate = sortedDates[0] || null;

			// Check if streak is active (worked out today or yesterday)
			const today = formatDateLocal(new Date());
			const yesterday = formatDateLocal(new Date(Date.now() - 86400000));
			const isStreakActive =
				lastWorkoutDate === today || lastWorkoutDate === yesterday;

			setStreakData({
				currentStreak,
				longestStreak,
				weeklyCount,
				totalWorkouts: uniqueDates.length,
				lastWorkoutDate,
				isStreakActive,
			});
		} catch (error) {
			console.error('Error fetching streak data:', error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchStreakData();
	}, [fetchStreakData]);

	return { streakData, isLoading, refetch: fetchStreakData };
}
