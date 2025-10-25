import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { PressScale } from './animations/PressScale';

interface Exercise {
	id: string; // temporary ID for React keys
	exercise_name: string;
	sets: number;
	target_reps: number | null;
	target_weight: number | null;
	order_index: number;
}

interface TemplateBuilderProps {
	templateId?: string | null;
	onSave: () => void;
	onCancel: () => void;
}

export function TemplateBuilder({
	templateId,
	onSave,
	onCancel,
}: TemplateBuilderProps) {
	const [templateName, setTemplateName] = useState('');
	const [description, setDescription] = useState('');
	const [exercises, setExercises] = useState<Exercise[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (templateId) {
			loadTemplate();
		}
	}, [templateId]);

	const loadTemplate = async () => {
		if (!templateId) return;

		setIsLoading(true);
		setError(null);
		try {
			// Fetch template
			const { data: template, error: templateError } = await supabase
				.from('workout_templates')
				.select('*')
				.eq('id', templateId)
				.single();

			if (templateError) throw templateError;

			// Fetch exercises
			const { data: exercisesData, error: exercisesError } = await supabase
				.from('template_exercises')
				.select('*')
				.eq('template_id', templateId)
				.order('order_index');

			if (exercisesError) throw exercisesError;

			setTemplateName(template.name);
			setDescription(template.description || '');
			setExercises(
				(exercisesData || []).map((ex) => ({
					id: ex.id,
					exercise_name: ex.exercise_name,
					sets: ex.sets,
					target_reps: ex.target_reps,
					target_weight: ex.target_weight,
					order_index: ex.order_index,
				}))
			);
		} catch (err) {
			console.error('Error loading template:', err);
			setError('Failed to load template. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const addExercise = () => {
		haptics.buttonPress();
		const newExercise: Exercise = {
			id: `temp-${Date.now()}`,
			exercise_name: '',
			sets: 3,
			target_reps: null,
			target_weight: null,
			order_index: exercises.length,
		};
		setExercises([...exercises, newExercise]);
	};

	const removeExercise = (index: number) => {
		haptics.warning();
		const updated = exercises.filter((_, i) => i !== index);
		// Update order indices
		updated.forEach((ex, i) => {
			ex.order_index = i;
		});
		setExercises(updated);
	};

	const moveExerciseUp = (index: number) => {
		if (index === 0) return;
		haptics.buttonPress();
		const updated = [...exercises];
		[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
		// Update order indices
		updated.forEach((ex, i) => {
			ex.order_index = i;
		});
		setExercises(updated);
	};

	const moveExerciseDown = (index: number) => {
		if (index === exercises.length - 1) return;
		haptics.buttonPress();
		const updated = [...exercises];
		[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
		// Update order indices
		updated.forEach((ex, i) => {
			ex.order_index = i;
		});
		setExercises(updated);
	};

	const updateExercise = (index: number, field: keyof Exercise, value: any) => {
		const updated = [...exercises];
		updated[index] = { ...updated[index], [field]: value };
		setExercises(updated);
	};

	const handleSave = async () => {
		if (!templateName.trim()) {
			setError('Template name is required');
			return;
		}

		if (exercises.length === 0) {
			setError('Add at least one exercise');
			return;
		}

		// Validate exercises
		for (let i = 0; i < exercises.length; i++) {
			if (!exercises[i].exercise_name.trim()) {
				setError(`Exercise ${i + 1} needs a name`);
				return;
			}
			if (exercises[i].sets < 1) {
				setError(`Exercise ${i + 1} needs at least 1 set`);
				return;
			}
		}

		setIsSaving(true);
		setError(null);

		try {
			let finalTemplateId = templateId;

			if (templateId) {
				// Update existing template
				const { error: updateError } = await supabase
					.from('workout_templates')
					.update({
						name: templateName.trim(),
						description: description.trim() || null,
					})
					.eq('id', templateId);

				if (updateError) throw updateError;

				// Delete old exercises
				const { error: deleteError } = await supabase
					.from('template_exercises')
					.delete()
					.eq('template_id', templateId);

				if (deleteError) throw deleteError;
			} else {
				// Create new template
				const { data: newTemplate, error: createError } = await supabase
					.from('workout_templates')
					.insert({
						name: templateName.trim(),
						description: description.trim() || null,
					})
					.select()
					.single();

				if (createError) throw createError;
				finalTemplateId = newTemplate.id;
			}

			// Insert exercises
			const exercisesToInsert = exercises.map((ex) => ({
				template_id: finalTemplateId,
				exercise_name: ex.exercise_name.trim(),
				sets: ex.sets,
				target_reps: ex.target_reps,
				target_weight: ex.target_weight,
				order_index: ex.order_index,
			}));

			const { error: exercisesError } = await supabase
				.from('template_exercises')
				.insert(exercisesToInsert);

			if (exercisesError) throw exercisesError;

			haptics.success();
			onSave();
		} catch (err) {
			console.error('Error saving template:', err);
			setError('Failed to save template. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background p-4 sm:p-6 pb-24 flex items-center justify-center">
				<p className="text-muted-foreground">Loading template...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-4 sm:p-6 pb-24">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex items-center gap-3 mb-6"
				>
					<motion.div whileTap={{ scale: 0.9 }}>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => {
								haptics.buttonPress();
								onCancel();
							}}
						>
							<ArrowLeft className="h-6 w-6" />
						</Button>
					</motion.div>
					<h1 className="text-2xl sm:text-3xl font-bold flex-1">
						{templateId ? 'Edit Template' : 'Create Template'}
					</h1>
				</motion.div>

				{error && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6"
					>
						{error}
					</motion.div>
				)}

				{/* Template Info */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="space-y-4 mb-6"
				>
					<Card>
						<CardContent className="p-6 space-y-4">
							<div className="space-y-2">
								<Label htmlFor="template-name" className="text-base">
									Template Name *
								</Label>
								<Input
									id="template-name"
									placeholder="e.g., Upper Body Day"
									value={templateName}
									onChange={(e) => setTemplateName(e.target.value)}
									className="h-12 text-base"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description" className="text-base">
									Description
								</Label>
								<Input
									id="description"
									placeholder="Optional description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="h-12 text-base"
								/>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Exercises */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="space-y-4 mb-6"
				>
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold">Exercises</h2>
						<PressScale>
							<Button onClick={addExercise} size="sm">
								<Plus className="h-4 w-4 mr-2" />
								Add Exercise
							</Button>
						</PressScale>
					</div>

					<AnimatePresence>
						{exercises.length === 0 ? (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="text-center py-12 bg-muted rounded-lg border-2 border-dashed border-border"
							>
								<p className="text-4xl mb-2">💪</p>
								<p className="text-sm text-muted-foreground">
									No exercises yet. Click "Add Exercise" to get started!
								</p>
							</motion.div>
						) : (
							exercises.map((exercise, index) => (
								<motion.div
									key={exercise.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ delay: index * 0.05 }}
								>
									<Card className="border-2">
										<CardContent className="p-4">
											<div className="flex items-start gap-3">
												{/* Reorder controls */}
												<div className="flex flex-col gap-1 pt-2">
													<button
														onClick={() => moveExerciseUp(index)}
														disabled={index === 0}
														className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
													>
														<GripVertical className="h-4 w-4" />
													</button>
													<span className="text-sm font-bold text-primary text-center">
														{index + 1}
													</span>
													<button
														onClick={() => moveExerciseDown(index)}
														disabled={index === exercises.length - 1}
														className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
													>
														<GripVertical className="h-4 w-4" />
													</button>
												</div>

												{/* Exercise form */}
												<div className="flex-1 space-y-3">
													<Input
														placeholder="Exercise name"
														value={exercise.exercise_name}
														onChange={(e) =>
															updateExercise(
																index,
																'exercise_name',
																e.target.value
															)
														}
														className="text-base font-semibold"
													/>

													<div className="grid grid-cols-3 gap-3">
														<div className="space-y-1">
															<Label className="text-xs text-muted-foreground">
																Sets *
															</Label>
															<Input
																type="number"
																min="1"
																value={exercise.sets}
																onChange={(e) =>
																	updateExercise(
																		index,
																		'sets',
																		parseInt(e.target.value) || 1
																	)
																}
																className="h-10"
															/>
														</div>
														<div className="space-y-1">
															<Label className="text-xs text-muted-foreground">
																Reps
															</Label>
															<Input
																type="number"
																min="0"
																placeholder="Optional"
																value={exercise.target_reps || ''}
																onChange={(e) =>
																	updateExercise(
																		index,
																		'target_reps',
																		e.target.value
																			? parseInt(e.target.value)
																			: null
																	)
																}
																className="h-10"
															/>
														</div>
														<div className="space-y-1">
															<Label className="text-xs text-muted-foreground">
																Weight (lbs)
															</Label>
															<Input
																type="number"
																min="0"
																step="0.5"
																placeholder="Optional"
																value={exercise.target_weight || ''}
																onChange={(e) =>
																	updateExercise(
																		index,
																		'target_weight',
																		e.target.value
																			? parseFloat(e.target.value)
																			: null
																	)
																}
																className="h-10"
															/>
														</div>
													</div>
												</div>

												{/* Delete button */}
												<motion.div whileTap={{ scale: 0.9 }}>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => removeExercise(index)}
														className="hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
													>
														<Trash2 className="h-5 w-5" />
													</Button>
												</motion.div>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							))
						)}
					</AnimatePresence>
				</motion.div>

				{/* Action Buttons */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="flex gap-3"
				>
					<PressScale className="flex-1">
						<Button
							variant="outline"
							onClick={() => {
								haptics.buttonPress();
								onCancel();
							}}
							className="w-full h-12 text-base"
							disabled={isSaving}
						>
							Cancel
						</Button>
					</PressScale>
					<PressScale className="flex-1">
						<Button
							onClick={handleSave}
							className="w-full h-12 text-base font-semibold"
							disabled={isSaving}
						>
							{isSaving ? (
								<span className="flex items-center gap-2">
									<motion.span
										animate={{ rotate: 360 }}
										transition={{
											duration: 1,
											repeat: Infinity,
											ease: 'linear',
										}}
									>
										⚡
									</motion.span>
									Saving...
								</span>
							) : (
								<>
									<Save className="mr-2 h-5 w-5" />
									Save Template
								</>
							)}
						</Button>
					</PressScale>
				</motion.div>
			</div>
		</div>
	);
}
