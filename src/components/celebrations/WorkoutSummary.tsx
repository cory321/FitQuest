import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, X, ArrowRight } from 'lucide-react';
import type { SessionExercise } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

interface WorkoutSummaryProps {
	show: boolean;
	currentExercises: SessionExercise[];
	previousExercises: SessionExercise[];
	onDismiss?: () => void;
}

interface ExerciseComparison {
	exerciseName: string;
	setNumber: number;
	totalSets: number;
	previous: {
		reps: number | null;
		weight: number | null;
	};
	current: {
		reps: number | null;
		weight: number | null;
	};
	improvement: number; // Percentage improvement
	improved: boolean;
}

const calculateVolume = (reps: number | null, weight: number | null): number => {
	return (reps || 0) * (weight || 0);
};

const calculateImprovement = (
	prevReps: number | null,
	prevWeight: number | null,
	currReps: number | null,
	currWeight: number | null
): { improvement: number; improved: boolean } => {
	const prevVolume = calculateVolume(prevReps, prevWeight);
	const currVolume = calculateVolume(currReps, currWeight);

	if (prevVolume === 0) {
		return { improvement: currVolume > 0 ? 100 : 0, improved: currVolume > 0 };
	}

	const improvement = ((currVolume - prevVolume) / prevVolume) * 100;
	return { improvement, improved: improvement > 0 };
};

export function WorkoutSummary({
	show,
	currentExercises,
	previousExercises,
	onDismiss,
}: WorkoutSummaryProps) {
	// Build comparisons - include ALL current exercises, even without previous data
	const comparisons: ExerciseComparison[] = currentExercises.map((current) => {
		const previous = previousExercises.find(
			(prev) =>
				prev.exercise_name === current.exercise_name &&
				prev.set_number === current.set_number
		);

		const { improvement, improved } = calculateImprovement(
			previous?.actual_reps || null,
			previous?.actual_weight || null,
			current.actual_reps,
			current.actual_weight
		);

		return {
			exerciseName: current.exercise_name,
			setNumber: current.set_number,
			totalSets: current.total_sets,
			previous: {
				reps: previous?.actual_reps || null,
				weight: previous?.actual_weight || null,
			},
			current: {
				reps: current.actual_reps,
				weight: current.actual_weight,
			},
			improvement,
			improved,
		};
	});

	// Calculate overall stats
	const improvementCount = comparisons.filter((c) => c.improved).length;
	const averageImprovement =
		comparisons.length > 0
			? comparisons.reduce((sum, c) => sum + (c.improved ? c.improvement : 0), 0) /
			  Math.max(improvementCount, 1)
			: 0;

	const hasComparisons = comparisons.length > 0;
	const hasPreviousData = previousExercises.length > 0;

	return (
		<AnimatePresence>
			{show && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
						onClick={onDismiss}
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0, y: 50 }}
							animate={{
								scale: 1,
								opacity: 1,
								y: 0,
							}}
							exit={{ scale: 0.8, opacity: 0, y: -50 }}
							transition={{
								type: 'spring',
								stiffness: 200,
								damping: 20,
							}}
							className="bg-card rounded-2xl p-6 max-w-2xl w-full shadow-2xl border-2 border-primary/30 my-8 max-h-[90vh] overflow-y-auto"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Header */}
							<div className="flex items-start justify-between mb-4">
								<div className="flex items-center gap-3">
									<Trophy className="h-10 w-10 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
									<div>
										<h2 className="text-2xl font-bold">Workout Complete!</h2>
										<p className="text-sm text-muted-foreground">
											{hasPreviousData
												? "Here's your progress"
												: 'Great first session!'}
										</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={onDismiss}
									className="flex-shrink-0"
								>
									<X className="h-5 w-5" />
								</Button>
							</div>

							{/* Overall Stats */}
							{hasPreviousData && improvementCount > 0 && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2 }}
									className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 rounded-xl p-4 mb-6 border-2 border-emerald-200 dark:border-emerald-800"
								>
									<div className="flex items-center justify-center gap-2 mb-2">
										<TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
										<span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
											+{averageImprovement.toFixed(1)}%
										</span>
									</div>
									<p className="text-center text-sm text-emerald-800 dark:text-emerald-200">
										Average improvement across {improvementCount} exercise
										{improvementCount !== 1 ? 's' : ''}
									</p>
								</motion.div>
							)}

							{/* First Time Message */}
							{!hasPreviousData && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="text-center py-4 mb-6 bg-muted/50 rounded-lg"
								>
									<p className="text-muted-foreground mb-1">
										Great job completing your workout!
									</p>
									<p className="text-sm text-muted-foreground">
										Next time you do this template, you'll see your progress comparisons below.
									</p>
								</motion.div>
							)}

							{/* Exercise-by-Exercise Comparison */}
							{hasComparisons && (
								<div className="space-y-3">
									<h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
										{hasPreviousData ? 'Exercise Comparison' : 'Your Workout'}
									</h3>
									{comparisons.map((comp, index) => (
										<motion.div
											key={`${comp.exerciseName}-${comp.setNumber}`}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: 0.3 + index * 0.05 }}
											className={`border rounded-lg p-4 ${
												comp.improved
													? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
													: 'bg-muted/50 border-border'
											}`}
										>
											{/* Exercise Name */}
											<div className="flex items-baseline justify-between mb-3">
												<div>
													<h4 className="font-semibold text-base">
														{comp.exerciseName}
													</h4>
													<p className="text-xs text-muted-foreground">
														Set {comp.setNumber} of {comp.totalSets}
													</p>
												</div>
												{comp.improved && (
													<div className="text-right">
														<span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
															+{comp.improvement.toFixed(1)}%
														</span>
													</div>
												)}
											</div>

											{/* Comparison */}
											<div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
												{/* Last Time */}
												<div className="text-center p-3 bg-muted rounded-lg">
													<p className="text-xs text-muted-foreground mb-1">
														Last Time
													</p>
													<div className="font-semibold text-sm">
														{comp.previous.weight || comp.previous.reps ? (
															<>
																{comp.previous.weight
																	? `${comp.previous.weight} lbs`
																	: '0 lbs'}
																{' × '}
																{comp.previous.reps ? `${comp.previous.reps}` : '0'}
															</>
														) : (
															<span className="text-muted-foreground">Not done</span>
														)}
													</div>
												</div>

												{/* Arrow */}
												<ArrowRight
													className={`h-5 w-5 flex-shrink-0 ${
														comp.improved
															? 'text-emerald-600 dark:text-emerald-400'
															: 'text-muted-foreground'
													}`}
												/>

												{/* This Time */}
												<div
													className={`text-center p-3 rounded-lg ${
														comp.improved
															? 'bg-emerald-100 dark:bg-emerald-900/30'
															: 'bg-muted'
													}`}
												>
													<p className="text-xs text-muted-foreground mb-1">
														This Time
													</p>
													<div
														className={`font-semibold text-sm ${
															comp.improved
																? 'text-emerald-700 dark:text-emerald-300'
																: ''
														}`}
													>
														{comp.current.weight || comp.current.reps ? (
															<>
																{comp.current.weight
																	? `${comp.current.weight} lbs`
																	: '0 lbs'}
																{' × '}
																{comp.current.reps ? `${comp.current.reps}` : '0'}
															</>
														) : (
															<span className="text-muted-foreground">Not done</span>
														)}
													</div>
												</div>
											</div>
										</motion.div>
									))}
								</div>
							)}

							{/* Dismiss Button */}
							<motion.div
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.5 }}
								className="mt-6"
							>
								<Button
									onClick={onDismiss}
									className="w-full h-12 text-base font-semibold"
									size="lg"
								>
									Done
								</Button>
							</motion.div>
						</motion.div>
					</motion.div>
				)}
		</AnimatePresence>
	);
}

