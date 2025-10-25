import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Formats a date to 'yyyy-MM-dd' using local timezone.
 * This prevents timezone conversion issues when saving dates to the database.
 */
export function formatDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Parses a date string in 'yyyy-MM-dd' format as a local date.
 * This prevents timezone conversion issues when parsing dates.
 */
export function parseDateLocal(dateString: string): Date {
	const [year, month, day] = dateString.split('-').map(Number);
	return new Date(year, month - 1, day);
}

/**
 * Calculate the current streak of consecutive workout days
 * @param workoutDates - Array of workout dates in 'yyyy-MM-dd' format
 * @returns Current streak count
 */
export function calculateStreak(workoutDates: string[]): number {
	if (!workoutDates || workoutDates.length === 0) return 0;

	// Sort dates in descending order (most recent first)
	const sortedDates = [...workoutDates].sort((a, b) => b.localeCompare(a));

	const today = formatDateLocal(new Date());
	const yesterday = formatDateLocal(new Date(Date.now() - 86400000));

	// Check if streak is still active (workout today or yesterday)
	if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
		return 0;
	}

	let streak = 0;
	let currentDate = new Date();

	// Start checking from today or yesterday
	if (sortedDates[0] === yesterday) {
		currentDate = new Date(Date.now() - 86400000);
	}

	// Count consecutive days backwards
	for (let i = 0; i < 365; i++) {
		const dateStr = formatDateLocal(currentDate);
		if (sortedDates.includes(dateStr)) {
			streak++;
		} else {
			break;
		}
		currentDate.setDate(currentDate.getDate() - 1);
	}

	return streak;
}

/**
 * Calculate the longest streak of consecutive workout days
 */
export function calculateLongestStreak(workoutDates: string[]): number {
	if (!workoutDates || workoutDates.length === 0) return 0;

	const sortedDates = [...new Set(workoutDates)].sort((a, b) =>
		a.localeCompare(b)
	);

	let longestStreak = 1;
	let currentStreak = 1;

	for (let i = 1; i < sortedDates.length; i++) {
		const prevDate = parseDateLocal(sortedDates[i - 1]);
		const currDate = parseDateLocal(sortedDates[i]);

		const diffTime = currDate.getTime() - prevDate.getTime();
		const diffDays = diffTime / (1000 * 60 * 60 * 24);

		if (diffDays === 1) {
			currentStreak++;
			longestStreak = Math.max(longestStreak, currentStreak);
		} else {
			currentStreak = 1;
		}
	}

	return longestStreak;
}

/**
 * Get the count of workouts in the current week (Monday - Sunday)
 */
export function getWeeklyWorkoutCount(workoutDates: string[]): number {
	const now = new Date();
	const dayOfWeek = now.getDay();
	const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

	const monday = new Date(now);
	monday.setDate(now.getDate() + mondayOffset);
	monday.setHours(0, 0, 0, 0);

	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	sunday.setHours(23, 59, 59, 999);

	return workoutDates.filter((dateStr) => {
		const date = parseDateLocal(dateStr);
		return date >= monday && date <= sunday;
	}).length;
}

/**
 * Get workout intensity (0-1) based on workout count
 */
export function getWorkoutIntensity(count: number): number {
	if (count === 0) return 0;
	if (count === 1) return 0.3;
	if (count === 2) return 0.6;
	return 1;
}
