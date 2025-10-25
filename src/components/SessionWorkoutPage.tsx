import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase, type SessionExercise } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from './ThemeToggle';

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
	const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
		updateExercise(exercise.id, fieldKey, { completed: !exercise.completed });
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

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<p className="text-muted-foreground">Loading workout...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background pb-20">
			{/* Header */}
			<div className="bg-card border-b sticky top-0 z-10 shadow-sm">
				<div className="max-w-4xl mx-auto p-4">
					<div className="flex items-center gap-3 mb-3">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigate('/')}
							className="flex-shrink-0"
						>
							<ArrowLeft className="h-6 w-6" />
						</Button>
						<div className="flex-1 min-w-0">
							<h1 className="text-xl sm:text-2xl font-bold truncate">
								{sessionName}
							</h1>
						</div>
						<ThemeToggle />
						<Button
							variant="ghost"
							size="icon"
							onClick={handleDeleteSession}
							className="flex-shrink-0 hover:bg-red-50 hover:text-red-600"
						>
							<Trash2 className="h-5 w-5" />
						</Button>
					</div>

					{/* Progress Bar */}
					<div>
						<div className="flex items-center justify-between text-sm mb-2">
							<span className="text-muted-foreground">Progress</span>
							<span className="font-semibold text-base">
								{completedCount} / {totalCount} completed
							</span>
						</div>
						<div className="w-full bg-muted rounded-full h-3 overflow-hidden">
							<div
								className="bg-primary h-3 transition-all duration-300 rounded-full"
								style={{ width: `${progressPercentage}%` }}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-4xl mx-auto p-4">
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
						{error}
					</div>
				)}

				{exercises.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground">
						No exercises in this session
					</div>
				) : (
					<div className="space-y-3">
						{exercises.map((exercise, index) => (
							<div
								key={exercise.id}
								className={`border-2 rounded-lg p-4 transition-all ${
									exercise.completed
										? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800 shadow-sm'
										: 'bg-card border shadow-sm'
								}`}
							>
								<div className="flex items-start gap-3">
									{/* Checkbox */}
									<button
										onClick={() => toggleCompleted(exercise)}
										disabled={savingFields.has(`${exercise.id}-completed`)}
										className={`flex-shrink-0 mt-1 w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${
											exercise.completed
												? 'bg-green-600 border-green-600'
												: 'bg-card border-border hover:border-green-400 active:scale-95'
										} ${
											savingFields.has(`${exercise.id}-completed`)
												? 'opacity-50 cursor-not-allowed'
												: ''
										}`}
									>
										{savingFields.has(`${exercise.id}-completed`) ? (
											<Loader2 className="h-4 w-4 animate-spin text-gray-400" />
										) : exercise.completed ? (
											<Check className="h-5 w-5 text-white stroke-[3]" />
										) : null}
									</button>

									<div className="flex-1 min-w-0">
										{/* Exercise Name and Number */}
										<div className="flex items-start justify-between mb-3">
											<div className="flex-1">
												<div className="flex items-baseline gap-2">
													<span className="text-primary font-bold text-lg">
														{index + 1}.
													</span>
													<h3
														className={`font-bold text-lg ${
															exercise.completed
																? 'line-through text-muted-foreground'
																: ''
														}`}
													>
														{exercise.exercise_name}
													</h3>
												</div>
												{/* Set Number */}
												<div className="text-xs text-primary font-semibold mt-1 ml-7">
													Set {exercise.set_number} of {exercise.total_sets}
												</div>
												{/* Target */}
												<div className="text-sm text-muted-foreground mt-1 ml-7">
													<span className="font-semibold">Target:</span>
													{exercise.target_reps &&
														` ${exercise.target_reps} reps`}
													{exercise.target_reps &&
														exercise.target_weight &&
														', '}
													{exercise.target_weight &&
														` ${exercise.target_weight} lbs`}
													{!exercise.target_reps &&
														!exercise.target_weight &&
														' -'}
												</div>
											</div>
										</div>

										{/* Actual Input Fields */}
										<div className="grid grid-cols-2 gap-3 ml-7">
											<div className="relative">
												<Label
													htmlFor={`actual-reps-${exercise.id}`}
													className="text-sm font-semibold mb-2 block"
												>
													Actual Reps
												</Label>
												<div className="relative">
													<Input
														id={`actual-reps-${exercise.id}`}
														type="number"
														placeholder="0"
														value={exercise.actual_reps || ''}
														onChange={(e) =>
															updateActualReps(exercise, e.target.value)
														}
														className="h-11 text-base pr-10"
														min="0"
													/>
													<div className="absolute right-3 top-1/2 -translate-y-1/2">
														{savingFields.has(`${exercise.id}-reps`) && (
															<Loader2 className="h-4 w-4 animate-spin text-primary" />
														)}
														{savedFields.has(`${exercise.id}-reps`) && (
															<CheckCircle2 className="h-4 w-4 text-green-600" />
														)}
													</div>
												</div>
											</div>
											<div className="relative">
												<Label
													htmlFor={`actual-weight-${exercise.id}`}
													className="text-sm font-semibold mb-2 block"
												>
													Actual Weight (lbs)
												</Label>
												<div className="relative">
													<Input
														id={`actual-weight-${exercise.id}`}
														type="number"
														step="0.1"
														placeholder="0"
														value={exercise.actual_weight || ''}
														onChange={(e) =>
															updateActualWeight(exercise, e.target.value)
														}
														className="h-11 text-base pr-10"
														min="0"
													/>
													<div className="absolute right-3 top-1/2 -translate-y-1/2">
														{savingFields.has(`${exercise.id}-weight`) && (
															<Loader2 className="h-4 w-4 animate-spin text-primary" />
														)}
														{savedFields.has(`${exercise.id}-weight`) && (
															<CheckCircle2 className="h-4 w-4 text-green-600" />
														)}
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Completion Message */}
				{completedCount === totalCount && totalCount > 0 && (
					<div className="mt-6 p-6 bg-green-50 border-2 border-green-300 rounded-lg text-center">
						<p className="text-4xl mb-2">🎉</p>
						<p className="text-lg font-bold text-green-800 mb-1">
							Workout Complete!
						</p>
						<p className="text-sm text-green-700">
							Great job finishing all {totalCount} exercises!
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
