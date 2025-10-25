import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { supabase, type SessionExercise } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { WorkoutComplete } from './celebrations/WorkoutComplete';
import { ExerciseCard } from './ExerciseCard';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/lib/haptics';

export function SessionWorkoutPage() {
	const navigate = useNavigate();
	const { sessionId } = useParams();
	const [searchParams] = useSearchParams();
	const sessionName = searchParams.get('name') || 'Workout Session';

	const [exercises, setExercises] = useState<SessionExercise[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [savingFields, setSavingFields] = useState<Set<string>>(new Set());
	const [savedFields, setSavedFields] = useState<Set<string>>(new Set());
	const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
		new Map()
	);
	const [showCelebration, setShowCelebration] = useState(false);
	const [lastCompletedCount, setLastCompletedCount] = useState(0);

	useEffect(() => {
		if (sessionId) {
			fetchExercises();
		}
	}, [sessionId]);

	const fetchExercises = async () => {
		if (!sessionId) return;

		setIsLoading(true);
		setError(null);
		try {
			const { data, error: fetchError } = await supabase
				.from('session_exercises')
				.select('*')
				.eq('session_id', sessionId)
				.order('order_index');

			if (fetchError) throw fetchError;
			setExercises(data || []);
		} catch (err) {
			console.error('Error fetching exercises:', err);
			setError('Failed to load exercises');
		} finally {
			setIsLoading(false);
		}
	};

	const updateExercise = async (
		exerciseId: string,
		fieldKey: string,
		updates: Partial<SessionExercise>
	) => {
		// Add to saving state
		setSavingFields((prev) => new Set(prev).add(fieldKey));
		// Remove from saved state if it was showing
		setSavedFields((prev) => {
			const newSet = new Set(prev);
			newSet.delete(fieldKey);
			return newSet;
		});
		setError(null);

		try {
			const { error: updateError } = await supabase
				.from('session_exercises')
				.update(updates)
				.eq('id', exerciseId);

			if (updateError) throw updateError;

			// Update local state
			setExercises((prev) =>
				prev.map((ex) => (ex.id === exerciseId ? { ...ex, ...updates } : ex))
			);

			// Remove from saving, add to saved
			setSavingFields((prev) => {
				const newSet = new Set(prev);
				newSet.delete(fieldKey);
				return newSet;
			});
			setSavedFields((prev) => new Set(prev).add(fieldKey));

			// Clear saved indicator after 2 seconds
			setTimeout(() => {
				setSavedFields((prev) => {
					const newSet = new Set(prev);
					newSet.delete(fieldKey);
					return newSet;
				});
			}, 2000);
		} catch (err) {
			console.error('Error updating exercise:', err);
			setError('Failed to update exercise');
			setSavingFields((prev) => {
				const newSet = new Set(prev);
				newSet.delete(fieldKey);
				return newSet;
			});
		}
	};

	const debouncedUpdate = useCallback(
		(
			exerciseId: string,
			fieldKey: string,
			updates: Partial<SessionExercise>
		) => {
			// Clear existing timer for this field
			const existingTimer = debounceTimers.current.get(fieldKey);
			if (existingTimer) {
				clearTimeout(existingTimer);
			}

			// Set new timer
			const timer = setTimeout(() => {
				updateExercise(exerciseId, fieldKey, updates);
				debounceTimers.current.delete(fieldKey);
			}, 500); // 500ms delay

			debounceTimers.current.set(fieldKey, timer);
		},
		[]
	);

	const toggleCompleted = (exercise: SessionExercise) => {
		const fieldKey = `${exercise.id}-completed`;
		const newCompleted = !exercise.completed;

		// Haptic feedback
		if (newCompleted) {
			haptics.success();
		} else {
			haptics.buttonPress();
		}

		updateExercise(exercise.id, fieldKey, { completed: newCompleted });
	};

	const updateActualReps = (exercise: SessionExercise, value: string) => {
		const reps = value ? parseInt(value) : null;

		// Update local state immediately for responsive UI
		setExercises((prev) =>
			prev.map((ex) =>
				ex.id === exercise.id ? { ...ex, actual_reps: reps } : ex
			)
		);

		// Debounce the API call
		const fieldKey = `${exercise.id}-reps`;
		debouncedUpdate(exercise.id, fieldKey, { actual_reps: reps });
	};

	const updateActualWeight = (exercise: SessionExercise, value: string) => {
		const weight = value ? parseFloat(value) : null;

		// Update local state immediately for responsive UI
		setExercises((prev) =>
			prev.map((ex) =>
				ex.id === exercise.id ? { ...ex, actual_weight: weight } : ex
			)
		);

		// Debounce the API call
		const fieldKey = `${exercise.id}-weight`;
		debouncedUpdate(exercise.id, fieldKey, { actual_weight: weight });
	};

	const handleDeleteSession = async () => {
		if (!sessionId) return;
		if (!confirm('Delete this entire workout session?')) return;

		try {
			const { error: deleteError } = await supabase
				.from('workout_sessions')
				.delete()
				.eq('id', sessionId);

			if (deleteError) throw deleteError;

			// Navigate back to calendar
			navigate('/');
		} catch (err) {
			console.error('Error deleting session:', err);
			setError('Failed to delete workout session. Please try again.');
		}
	};

	const completedCount = exercises.filter((ex) => ex.completed).length;
	const totalCount = exercises.length;
	const progressPercentage =
		totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

	// Check for workout completion
	useEffect(() => {
		if (
			completedCount === totalCount &&
			totalCount > 0 &&
			completedCount > lastCompletedCount
		) {
			setShowCelebration(true);
			haptics.celebration();
		}
		setLastCompletedCount(completedCount);
	}, [completedCount, totalCount]);

	const adjustWeight = (exercise: SessionExercise, delta: number) => {
		const currentWeight = exercise.actual_weight || exercise.target_weight || 0;
		const newWeight = Math.max(0, currentWeight + delta);
		haptics.buttonPress();

		const fieldKey = `${exercise.id}-weight`;
		updateExercise(exercise.id, fieldKey, { actual_weight: newWeight });
	};

	const adjustReps = (exercise: SessionExercise, delta: number) => {
		const currentReps = exercise.actual_reps || exercise.target_reps || 0;
		const newReps = Math.max(0, currentReps + delta);
		haptics.buttonPress();

		const fieldKey = `${exercise.id}-reps`;
		updateExercise(exercise.id, fieldKey, { actual_reps: newReps });
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<p className="text-muted-foreground">Loading workout...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background pb-20">
			{/* Celebration Modal */}
			<WorkoutComplete
				show={showCelebration}
				exerciseCount={totalCount}
				onDismiss={() => setShowCelebration(false)}
			/>

			{/* Header */}
			<motion.div
				initial={{ y: -100 }}
				animate={{ y: 0 }}
				transition={{ type: 'spring', stiffness: 200, damping: 20 }}
				className="bg-card border-b sticky top-0 z-10 shadow-sm"
			>
				<div className="max-w-4xl mx-auto p-4">
					<div className="flex items-center gap-3 mb-3">
						<motion.div whileTap={{ scale: 0.9 }}>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									haptics.buttonPress();
									navigate('/');
								}}
								className="flex-shrink-0"
							>
								<ArrowLeft className="h-6 w-6" />
							</Button>
						</motion.div>
						<div className="flex-1 min-w-0">
							<h1 className="text-xl sm:text-3xl font-bold font-heading tracking-tight truncate">
								{sessionName}
							</h1>
						</div>
						<ThemeToggle />
						<motion.div whileTap={{ scale: 0.9 }}>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									haptics.warning();
									handleDeleteSession();
								}}
								className="flex-shrink-0 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
							>
								<Trash2 className="h-5 w-5" />
							</Button>
						</motion.div>
					</div>

					{/* Progress Bar */}
					<div>
						<div className="flex items-center justify-between text-sm mb-2">
							<span className="text-muted-foreground">Progress</span>
							<motion.span
								key={completedCount}
								initial={{ scale: 1.2 }}
								animate={{ scale: 1 }}
								className="font-semibold text-base"
							>
								{completedCount} / {totalCount} completed
							</motion.span>
						</div>
						<div className="w-full bg-muted rounded-full h-3 overflow-hidden">
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${progressPercentage}%` }}
								transition={{ duration: 0.5, ease: 'easeOut' }}
								className="bg-gradient-to-r from-primary to-orange-500 h-3 rounded-full relative overflow-hidden"
							>
								{/* Shimmer effect */}
								<motion.div
									animate={{
										x: ['-100%', '200%'],
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										ease: 'linear',
									}}
									className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
								/>
							</motion.div>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Content */}
			<div className="max-w-4xl mx-auto p-4">
				{error && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-4"
					>
						{error}
					</motion.div>
				)}

				{exercises.length === 0 ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-center py-12 text-muted-foreground"
					>
						No exercises in this session
					</motion.div>
				) : (
					<AnimatePresence>
						<div className="space-y-3">
							{exercises.map((exercise, index) => (
								<ExerciseCard
									key={exercise.id}
									exercise={exercise}
									index={index}
									onToggleComplete={() => toggleCompleted(exercise)}
									onUpdateReps={(value) => updateActualReps(exercise, value)}
									onUpdateWeight={(value) =>
										updateActualWeight(exercise, value)
									}
									onAdjustReps={(delta) => adjustReps(exercise, delta)}
									onAdjustWeight={(delta) => adjustWeight(exercise, delta)}
									savingFields={savingFields}
									savedFields={savedFields}
								/>
							))}
						</div>
					</AnimatePresence>
				)}
			</div>
		</div>
	);
}
