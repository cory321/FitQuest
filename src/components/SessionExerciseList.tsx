import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { supabase, type SessionExercise } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SessionExerciseListProps {
	sessionId: string;
	sessionName: string;
	onExercisesUpdated: () => void;
}

export function SessionExerciseList({
	sessionId,
	sessionName,
	onExercisesUpdated,
}: SessionExerciseListProps) {
	const [exercises, setExercises] = useState<SessionExercise[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [updatingExerciseId, setUpdatingExerciseId] = useState<string | null>(
		null
	);

	useEffect(() => {
		fetchExercises();
	}, [sessionId]);

	const fetchExercises = async () => {
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
		updates: Partial<SessionExercise>
	) => {
		setUpdatingExerciseId(exerciseId);
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

			onExercisesUpdated();
		} catch (err) {
			console.error('Error updating exercise:', err);
			setError('Failed to update exercise');
		} finally {
			setUpdatingExerciseId(null);
		}
	};

	const toggleCompleted = (exercise: SessionExercise) => {
		updateExercise(exercise.id, { completed: !exercise.completed });
	};

	const updateActualReps = (exercise: SessionExercise, value: string) => {
		const reps = value ? parseInt(value) : null;
		updateExercise(exercise.id, { actual_reps: reps });
	};

	const updateActualWeight = (exercise: SessionExercise, value: string) => {
		const weight = value ? parseFloat(value) : null;
		updateExercise(exercise.id, { actual_weight: weight });
	};

	const completedCount = exercises.filter((ex) => ex.completed).length;
	const totalCount = exercises.length;
	const progressPercentage =
		totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

	if (isLoading) {
		return (
			<div className="text-center py-4">
				<p className="text-muted-foreground text-sm">Loading exercises...</p>
			</div>
		);
	}

	return (
		<Card className="border-2 border-blue-200">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="text-base flex items-center gap-2">
							<span className="text-blue-600">📋</span>
							{sessionName}
						</CardTitle>
						<div className="mt-2">
							<div className="flex items-center justify-between text-sm mb-1">
								<span className="text-muted-foreground">Progress</span>
								<span className="font-semibold">
									{completedCount} / {totalCount} completed
								</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
								<div
									className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
									style={{ width: `${progressPercentage}%` }}
								/>
							</div>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm mb-3">
						{error}
					</div>
				)}

				{exercises.map((exercise, index) => (
					<div
						key={exercise.id}
						className={`border rounded-lg p-3 transition-all ${
							exercise.completed
								? 'bg-green-50 border-green-300'
								: 'bg-white border-gray-200'
						}`}
					>
						<div className="flex items-start gap-3">
							{/* Checkbox */}
							<button
								onClick={() => toggleCompleted(exercise)}
								disabled={updatingExerciseId === exercise.id}
								className={`flex-shrink-0 mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
									exercise.completed
										? 'bg-green-600 border-green-600'
										: 'bg-white border-gray-300 hover:border-green-400'
								}`}
							>
								{exercise.completed && <Check className="h-4 w-4 text-white" />}
							</button>

							<div className="flex-1 min-w-0">
								{/* Exercise Name and Number */}
								<div className="flex items-start justify-between mb-2">
									<div className="flex-1">
										<div className="flex items-baseline gap-2">
											<span className="text-blue-600 font-semibold text-sm">
												{index + 1}.
											</span>
											<h4
												className={`font-semibold text-sm ${
													exercise.completed
														? 'line-through text-muted-foreground'
														: ''
												}`}
											>
												{exercise.exercise_name}
											</h4>
										</div>
										{/* Target */}
										<div className="text-xs text-muted-foreground mt-0.5 ml-5">
											Target:
											{exercise.target_reps && ` ${exercise.target_reps} reps`}
											{exercise.target_reps && exercise.target_weight && ', '}
											{exercise.target_weight &&
												` ${exercise.target_weight} lbs`}
											{!exercise.target_reps && !exercise.target_weight && ' -'}
										</div>
									</div>
								</div>

								{/* Actual Input Fields */}
								<div className="grid grid-cols-2 gap-2 ml-5">
									<div>
										<Label
											htmlFor={`actual-reps-${exercise.id}`}
											className="text-xs text-muted-foreground"
										>
											Actual Reps
										</Label>
										<Input
											id={`actual-reps-${exercise.id}`}
											type="number"
											placeholder="0"
											value={exercise.actual_reps || ''}
											onChange={(e) =>
												updateActualReps(exercise, e.target.value)
											}
											disabled={updatingExerciseId === exercise.id}
											className="h-8 text-sm"
											min="0"
										/>
									</div>
									<div>
										<Label
											htmlFor={`actual-weight-${exercise.id}`}
											className="text-xs text-muted-foreground"
										>
											Actual Weight (lbs)
										</Label>
										<Input
											id={`actual-weight-${exercise.id}`}
											type="number"
											step="0.1"
											placeholder="0"
											value={exercise.actual_weight || ''}
											onChange={(e) =>
												updateActualWeight(exercise, e.target.value)
											}
											disabled={updatingExerciseId === exercise.id}
											className="h-8 text-sm"
											min="0"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				))}

				{exercises.length === 0 && (
					<div className="text-center py-6 text-muted-foreground text-sm">
						No exercises in this session
					</div>
				)}
			</CardContent>
		</Card>
	);
}

