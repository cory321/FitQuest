import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		'Missing Supabase environment variables. Please check your .env file.'
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Workout = {
	id: string;
	workout_date: string;
	workout_name: string;
	reps: number | null;
	weight_lbs: number | null;
	created_at: string;
};

export type WorkoutTemplate = {
	id: string;
	name: string;
	description: string | null;
	created_at: string;
};

export type TemplateExercise = {
	id: string;
	template_id: string;
	exercise_name: string;
	target_reps: number | null;
	target_weight: number | null;
	sets: number;
	order_index: number;
	created_at: string;
};

export type WorkoutSession = {
	id: string;
	workout_date: string;
	template_id: string;
	template_name: string;
	created_at: string;
};

export type SessionExercise = {
	id: string;
	session_id: string;
	exercise_name: string;
	target_reps: number | null;
	target_weight: number | null;
	actual_reps: number | null;
	actual_weight: number | null;
	completed: boolean;
	set_number: number;
	total_sets: number;
	order_index: number;
	created_at: string;
};
