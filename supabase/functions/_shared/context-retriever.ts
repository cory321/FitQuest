import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function retrieveUserContext(
	supabaseClient: SupabaseClient,
	userId: string,
	options: {
		includeRecentWorkouts?: boolean;
		includeExerciseFrequency?: boolean;
		includeTemplateStats?: boolean;
		includeStreakData?: boolean;
		includeUserProfile?: boolean;
		includeHydrationData?: boolean;
	} = {}
) {
	const context: any = {};

	// Get user profile data
	if (options.includeUserProfile !== false) {
		const { data: profile } = await supabaseClient
			.from('user_profiles')
			.select('*')
			.eq('user_id', userId)
			.single();

		if (profile) {
			// Calculate BMI if height and weight are available
			let bmi: number | null = null;
			if (profile.weight_lbs) {
				let heightInInches = 0;
				if (profile.height_unit === 'imperial' && profile.height_feet) {
					heightInInches =
						profile.height_feet * 12 + (profile.height_inches || 0);
				} else if (profile.height_unit === 'metric' && profile.height_cm) {
					heightInInches = profile.height_cm / 2.54;
				}
				if (heightInInches > 0) {
					bmi = (profile.weight_lbs / (heightInInches * heightInInches)) * 703;
				}
			}

			context.userProfile = {
				name: profile.name,
				gender: profile.gender,
				age: profile.age,
				weight_lbs: profile.weight_lbs,
				height_unit: profile.height_unit,
				height_feet: profile.height_feet,
				height_inches: profile.height_inches,
				height_cm: profile.height_cm,
				activity_level: profile.activity_level,
				bmi: bmi ? Math.round(bmi * 10) / 10 : null,
			};
		}
	}

	// Get recent workouts (last 30 days)
	if (options.includeRecentWorkouts !== false) {
		const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0];
		const endDate = new Date().toISOString().split('T')[0];

		const { data: recentWorkouts } = await supabaseClient.rpc(
			'get_workout_history',
			{
				start_date: startDate,
				end_date: endDate,
				limit_count: 50,
			}
		);
		context.recentWorkouts = recentWorkouts || [];
	}

	// Get template usage stats
	if (options.includeTemplateStats !== false) {
		const { data: templateStats } = await supabaseClient.rpc(
			'get_template_usage_stats'
		);
		context.templateStats = templateStats || [];
	}

	// Get streak data
	if (options.includeStreakData !== false) {
		const { data: streakData } = await supabaseClient.rpc(
			'get_workout_streaks'
		);
		context.streakData = streakData || {};
	}

	// Get hydration data (last 30 days)
	if (options.includeHydrationData !== false) {
		const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0];
		const endDate = new Date().toISOString().split('T')[0];

		const { data: hydrationLogs } = await supabaseClient
			.from('hydration_logs')
			.select('log_date, cups_filled, total_cups')
			.eq('user_id', userId)
			.gte('log_date', startDate)
			.lte('log_date', endDate)
			.order('log_date', { ascending: false });

		// Calculate hydration adherence stats
		const logs = hydrationLogs || [];
		const totalDays = logs.length;
		const daysMetGoal = logs.filter((log) => log.total_cups >= 8).length;
		const adherenceRate =
			totalDays > 0 ? Math.round((daysMetGoal / totalDays) * 100) : 0;
		const avgCupsPerDay =
			totalDays > 0
				? Math.round(
						logs.reduce((sum, log) => sum + log.total_cups, 0) / totalDays
					)
				: 0;

		context.hydrationData = {
			recentLogs: logs.slice(0, 7), // Last 7 days
			totalDays,
			daysMetGoal,
			adherenceRate,
			avgCupsPerDay,
		};
	}

	return context;
}
