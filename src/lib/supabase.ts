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
	user_id: string;
	workout_date: string;
	workout_name: string;
	reps: number | null;
	weight_lbs: number | null;
	created_at: string;
};

export type WorkoutTemplate = {
	id: string;
	user_id: string;
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
	user_id: string;
	workout_date: string;
	template_id: string | null;
	template_name: string;
	completed: boolean;
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

// AI Coach Types
export type ChatConversation = {
	id: string;
	user_id: string;
	title: string | null;
	created_at: string;
	updated_at: string;
};

export type ChatMessage = {
	id: string;
	conversation_id: string;
	user_id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	created_at: string;
};

export type AIAuditLog = {
	id: string;
	user_id: string;
	conversation_id: string | null;
	query_type: string;
	input_summary: string | null;
	response_summary: string | null;
	execution_time_ms: number | null;
	tokens_used: number | null;
	error: string | null;
	created_at: string;
};

export type WorkoutHistory = {
	workout_date: string;
	workout_name: string;
	reps: number | null;
	weight_lbs: number | null;
};

export type ExerciseProgress = {
	workout_date: string;
	reps: number | null;
	weight_lbs: number | null;
};

export type TemplateUsageStats = {
	template_name: string;
	times_used: number;
	times_completed: number;
	completion_rate: number;
	last_used: string;
};

export type UserProfile = {
	id: string;
	user_id: string;
	name: string | null;
	gender: 'male' | 'female' | null;
	age: number | null;
	weight_lbs: number | null;
	height_unit: 'imperial' | 'metric';
	height_feet: number | null;
	height_inches: number | null;
	height_cm: number | null;
	activity_level: 'sedentary' | 'moderate' | 'athletic' | null;
	created_at: string;
	updated_at: string;
};

export type HydrationLog = {
	id: string;
	user_id: string;
	log_date: string;
	cups_filled: boolean[];
	total_cups: number;
	created_at: string;
	updated_at: string;
};
