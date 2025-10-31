import { motion } from 'framer-motion';
import { Check, Loader2, CheckCircle2, Plus, Minus } from 'lucide-react';
import type { SessionExercise } from '@/lib/supabase';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ExerciseCardProps {
	exercise: SessionExercise;
	index: number;
	onToggleComplete: () => void;
	onUpdateReps: (value: string) => void;
	onUpdateWeight: (value: string) => void;
	onAdjustReps: (delta: number) => void;
	onAdjustWeight: (delta: number) => void;
	savingFields: Set<string>;
	savedFields: Set<string>;
}

// Common preset weights for quick selection
const PRESET_WEIGHTS = [45, 95, 135, 185, 225, 275];

export function ExerciseCard({
	exercise,
	index,
	onToggleComplete,
	onUpdateReps,
	onUpdateWeight,
	onAdjustReps,
	onAdjustWeight,
	savingFields,
	savedFields,
}: ExerciseCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: 20 }}
			transition={{ delay: index * 0.05 }}
			className={`border-2 rounded-lg p-4 transition-colors bg-card ${
				exercise.completed
					? 'border-emerald-400 dark:border-emerald-700 shadow-md bg-emerald-50 dark:bg-emerald-950/40'
					: 'border-border shadow-sm'
			}`}
		>
			<div className="flex items-start gap-3">
				{/* Checkbox */}
				<motion.button
					whileTap={{ scale: 0.9 }}
					onClick={onToggleComplete}
					disabled={savingFields.has(`${exercise.id}-completed`)}
					className={`flex-shrink-0 mt-1 w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${
						exercise.completed
							? 'bg-emerald-600 border-emerald-600 dark:bg-emerald-700 dark:border-emerald-700'
							: 'bg-card border-border hover:border-emerald-500 dark:hover:border-emerald-600'
					} ${
						savingFields.has(`${exercise.id}-completed`)
							? 'opacity-50 cursor-not-allowed'
							: ''
					}`}
				>
					{savingFields.has(`${exercise.id}-completed`) ? (
						<Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
					) : exercise.completed ? (
						<motion.div
							initial={{ scale: 0, rotate: -180 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ type: 'spring', stiffness: 400, damping: 15 }}
						>
							<Check className="h-5 w-5 text-white dark:text-gray-100 stroke-[3]" />
						</motion.div>
					) : null}
				</motion.button>

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
								{exercise.target_reps && ` ${exercise.target_reps} reps`}
								{exercise.target_reps && exercise.target_weight && ', '}
								{exercise.target_weight && ` ${exercise.target_weight} lbs`}
								{!exercise.target_reps && !exercise.target_weight && ' -'}
							</div>
						</div>
					</div>

					{/* Actual Input Fields with Quick Adjust */}
					<div className="space-y-3 ml-7">
						<div className="grid grid-cols-2 gap-3">
							{/* Reps */}
							<div className="relative">
								<Label
									htmlFor={`actual-reps-${exercise.id}`}
									className="text-sm font-semibold mb-2 block"
								>
									Actual Reps
								</Label>
								<div className="flex items-center gap-1">
									<motion.button
										whileTap={{ scale: 0.9 }}
										onClick={() => onAdjustReps(-1)}
										className="flex-shrink-0 w-8 h-8 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
									>
										<Minus className="h-4 w-4" />
									</motion.button>
									<div className="relative flex-1">
										<Input
											id={`actual-reps-${exercise.id}`}
											type="number"
											inputMode="numeric"
											placeholder="0"
											value={exercise.actual_reps || ''}
											onChange={(e) => onUpdateReps(e.target.value)}
											className="h-9 text-base pr-8 text-center"
											min="0"
										/>
										<div className="absolute right-2 top-1/2 -translate-y-1/2">
											{savingFields.has(`${exercise.id}-reps`) && (
												<Loader2 className="h-4 w-4 animate-spin text-primary" />
											)}
											{savedFields.has(`${exercise.id}-reps`) && (
												<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
													<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
												</motion.div>
											)}
										</div>
									</div>
									<motion.button
										whileTap={{ scale: 0.9 }}
										onClick={() => onAdjustReps(1)}
										className="flex-shrink-0 w-8 h-8 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
									>
										<Plus className="h-4 w-4" />
									</motion.button>
								</div>
							</div>

							{/* Weight */}
							<div className="relative">
								<Label
									htmlFor={`actual-weight-${exercise.id}`}
									className="text-sm font-semibold mb-2 block"
								>
									Weight (lbs)
								</Label>
								<div className="flex items-center gap-1">
									<motion.button
										whileTap={{ scale: 0.9 }}
										onClick={() => onAdjustWeight(-5)}
										className="flex-shrink-0 w-8 h-8 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
									>
										<Minus className="h-4 w-4" />
									</motion.button>
									<div className="relative flex-1">
										<Input
											id={`actual-weight-${exercise.id}`}
											type="number"
											inputMode="decimal"
											step="0.1"
											placeholder="0"
											value={exercise.actual_weight || ''}
											onChange={(e) => onUpdateWeight(e.target.value)}
											className="h-9 text-base pr-8 text-center"
											min="0"
										/>
										<div className="absolute right-2 top-1/2 -translate-y-1/2">
											{savingFields.has(`${exercise.id}-weight`) && (
												<Loader2 className="h-4 w-4 animate-spin text-primary" />
											)}
											{savedFields.has(`${exercise.id}-weight`) && (
												<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
													<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
												</motion.div>
											)}
										</div>
									</div>
									<motion.button
										whileTap={{ scale: 0.9 }}
										onClick={() => onAdjustWeight(5)}
										className="flex-shrink-0 w-8 h-8 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
									>
										<Plus className="h-4 w-4" />
									</motion.button>
								</div>
							</div>
						</div>

						{/* Preset Weight Buttons */}
						<div className="col-span-2">
							<div className="flex items-center gap-1.5 flex-wrap">
								<span className="text-xs text-muted-foreground font-medium mr-1">
									Quick:
								</span>
								{PRESET_WEIGHTS.map((weight) => (
									<motion.button
										key={weight}
										whileTap={{ scale: 0.95 }}
										onClick={() => onUpdateWeight(weight.toString())}
										className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
											exercise.actual_weight === weight
												? 'bg-primary text-primary-foreground'
												: 'bg-muted hover:bg-muted/80 text-foreground'
										}`}
									>
										{weight}
									</motion.button>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
