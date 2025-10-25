import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
	Dumbbell,
	ArrowLeft,
	ChevronRight,
	Edit,
	Trash2,
	Copy,
	Plus,
} from 'lucide-react';
import {
	supabase,
	type WorkoutTemplate,
	type TemplateExercise,
} from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from './ThemeToggle';
import { TemplateBuilder } from './TemplateBuilder';
import { formatDateLocal, parseDateLocal } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { PressScale } from './animations/PressScale';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

interface TemplateWithExercises extends WorkoutTemplate {
	exercises: TemplateExercise[];
}

export function TemplateSelector() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const dateParam = searchParams.get('date');
	const selectedDate = dateParam ? parseDateLocal(dateParam) : null;

	const [templates, setTemplates] = useState<TemplateWithExercises[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(
		null
	);
	const [showBuilder, setShowBuilder] = useState(false);
	const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
		null
	);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [templateToDelete, setTemplateToDelete] =
		useState<TemplateWithExercises | null>(null);
	const [usageCount, setUsageCount] = useState<number>(0);

	// Determine mode: browse (with date) or manage (without date)
	const isBrowseMode = !!selectedDate;

	useEffect(() => {
		fetchTemplates();
	}, []);

	const fetchTemplates = async () => {
		setIsLoading(true);
		setError(null);
		try {
			// Fetch all templates
			const { data: templatesData, error: templatesError } = await supabase
				.from('workout_templates')
				.select('*')
				.order('name');

			if (templatesError) throw templatesError;

			// Fetch all exercises for these templates
			const { data: exercisesData, error: exercisesError } = await supabase
				.from('template_exercises')
				.select('*')
				.order('order_index');

			if (exercisesError) throw exercisesError;

			// Combine templates with their exercises
			const templatesWithExercises: TemplateWithExercises[] = (
				templatesData || []
			).map((template) => ({
				...template,
				exercises: (exercisesData || []).filter(
					(ex) => ex.template_id === template.id
				),
			}));

			setTemplates(templatesWithExercises);
		} catch (err) {
			console.error('Error fetching templates:', err);
			setError('Failed to load templates. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleEditTemplate = (template: TemplateWithExercises) => {
		haptics.buttonPress();
		setEditingTemplateId(template.id);
		setShowBuilder(true);
	};

	const handleDuplicateTemplate = async (template: TemplateWithExercises) => {
		haptics.buttonPress();
		setError(null);

		try {
			// Create new template with " (Copy)" suffix
			const { data: newTemplate, error: createError } = await supabase
				.from('workout_templates')
				.insert({
					name: `${template.name} (Copy)`,
					description: template.description,
				})
				.select()
				.single();

			if (createError) throw createError;

			// Copy exercises
			const exercisesToInsert = template.exercises.map((ex) => ({
				template_id: newTemplate.id,
				exercise_name: ex.exercise_name,
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
			fetchTemplates();
		} catch (err) {
			console.error('Error duplicating template:', err);
			setError('Failed to duplicate template. Please try again.');
		}
	};

	const handleDeleteClick = async (template: TemplateWithExercises) => {
		haptics.warning();
		setTemplateToDelete(template);

		// Check how many workouts use this template
		try {
			const { count, error: countError } = await supabase
				.from('workout_sessions')
				.select('*', { count: 'exact', head: true })
				.eq('template_id', template.id);

			if (countError) throw countError;
			setUsageCount(count || 0);
		} catch (err) {
			console.error('Error counting template usage:', err);
			setUsageCount(0);
		}

		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!templateToDelete) return;

		setError(null);
		try {
			// Delete template exercises first (foreign key constraint)
			const { error: exercisesError } = await supabase
				.from('template_exercises')
				.delete()
				.eq('template_id', templateToDelete.id);

			if (exercisesError) throw exercisesError;

			// Delete template
			const { error: templateError } = await supabase
				.from('workout_templates')
				.delete()
				.eq('id', templateToDelete.id);

			if (templateError) throw templateError;

			haptics.success();
			setDeleteDialogOpen(false);
			setTemplateToDelete(null);
			fetchTemplates();
		} catch (err) {
			console.error('Error deleting template:', err);
			setError('Failed to delete template. Please try again.');
			setDeleteDialogOpen(false);
		}
	};

	const handleCreateNew = () => {
		haptics.buttonPress();
		setEditingTemplateId(null);
		setShowBuilder(true);
	};

	const handleBuilderSave = () => {
		setShowBuilder(false);
		setEditingTemplateId(null);
		fetchTemplates();
	};

	const handleBuilderCancel = () => {
		setShowBuilder(false);
		setEditingTemplateId(null);
	};

	const applyTemplate = async (template: TemplateWithExercises) => {
		if (!selectedDate) return;

		haptics.buttonPress();
		setApplyingTemplateId(template.id);
		setError(null);

		try {
			// Create a new workout session
			const { data: session, error: sessionError } = await supabase
				.from('workout_sessions')
				.insert({
					workout_date: formatDateLocal(selectedDate),
					template_id: template.id,
					template_name: template.name,
				})
				.select()
				.single();

			if (sessionError) throw sessionError;

			// Create session exercises (snapshot of template exercises)
			// For each exercise, create multiple rows based on the number of sets
			const sessionExercises: any[] = [];
			let orderIndex = 0;

			template.exercises.forEach((ex) => {
				for (let setNum = 1; setNum <= ex.sets; setNum++) {
					sessionExercises.push({
						session_id: session.id,
						exercise_name: ex.exercise_name,
						target_reps: ex.target_reps,
						target_weight: ex.target_weight,
						set_number: setNum,
						total_sets: ex.sets,
						order_index: orderIndex++,
						completed: false,
					});
				}
			});

			const { error: exercisesError } = await supabase
				.from('session_exercises')
				.insert(sessionExercises);

			if (exercisesError) throw exercisesError;

			// Success! Navigate back to calendar
			haptics.success();
			navigate('/');
		} catch (err) {
			console.error('Error applying template:', err);
			setError('Failed to apply template. Please try again.');
		} finally {
			setApplyingTemplateId(null);
		}
	};

	if (showBuilder) {
		return (
			<TemplateBuilder
				templateId={editingTemplateId}
				onSave={handleBuilderSave}
				onCancel={handleBuilderCancel}
			/>
		);
	}

	return (
		<div className="min-h-screen bg-background p-4 sm:p-6 pb-24">
			{/* Header */}
			<div className="max-w-4xl mx-auto">
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
								navigate('/');
							}}
							className="flex-shrink-0"
						>
							<ArrowLeft className="h-6 w-6" />
						</Button>
					</motion.div>
					<div className="flex-1">
						<h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
							<Dumbbell className="h-7 w-7 sm:h-9 sm:w-9 text-primary" />
							{isBrowseMode ? 'Workout Templates' : 'Manage Templates'}
						</h1>
						{selectedDate && (
							<p className="text-sm sm:text-base text-muted-foreground mt-1">
								Select a template for {format(selectedDate, 'MMMM d, yyyy')}
							</p>
						)}
					</div>
					<ThemeToggle />
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

				{isLoading ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-center py-12"
					>
						<p className="text-muted-foreground">Loading templates...</p>
					</motion.div>
				) : templates.length === 0 ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-center py-12"
					>
						<p className="text-muted-foreground">No templates available</p>
					</motion.div>
				) : (
					<div className="space-y-4">
						{/* Create New Button (only in manage mode) */}
						{!isBrowseMode && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
							>
								<PressScale>
									<Button
										onClick={handleCreateNew}
										className="w-full h-14 text-base font-semibold"
										size="lg"
									>
										<Plus className="mr-2 h-5 w-5" />
										Create New Template
									</Button>
								</PressScale>
							</motion.div>
						)}

						<AnimatePresence>
							{templates.map((template, index) => (
								<motion.div
									key={template.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ delay: index * 0.1 }}
								>
									<PressScale scale={0.98}>
										<Card className="hover:shadow-lg transition-all border-2 hover:border-primary/50">
											<CardHeader className="pb-4">
												<CardTitle className="text-xl flex items-center justify-between">
													<span>{template.name}</span>
													<motion.span
														initial={{ scale: 0 }}
														animate={{ scale: 1 }}
														transition={{ delay: index * 0.1 + 0.2 }}
														className="text-sm bg-primary/20 text-primary px-3 py-1.5 rounded-full font-normal"
													>
														{template.exercises.length} exercises
													</motion.span>
												</CardTitle>
												{template.description && (
													<p className="text-sm sm:text-base text-muted-foreground mt-2">
														{template.description}
													</p>
												)}
											</CardHeader>
											<CardContent className="space-y-4">
												{/* Action Buttons (Manage Mode Only) */}
												{!isBrowseMode && (
													<div className="flex gap-2 pb-4 border-b">
														<PressScale className="flex-1">
															<Button
																variant="outline"
																className="w-full"
																onClick={() => handleEditTemplate(template)}
															>
																<Edit className="mr-2 h-4 w-4" />
																Edit
															</Button>
														</PressScale>
														<PressScale className="flex-1">
															<Button
																variant="outline"
																className="w-full"
																onClick={() =>
																	handleDuplicateTemplate(template)
																}
															>
																<Copy className="mr-2 h-4 w-4" />
																Duplicate
															</Button>
														</PressScale>
														<PressScale>
															<Button
																variant="outline"
																size="icon"
																className="hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:border-red-200 dark:hover:border-red-800"
																onClick={() => handleDeleteClick(template)}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</PressScale>
													</div>
												)}

												{/* Exercise List */}
												<div className="space-y-2">
													{template.exercises.map((ex, idx) => (
														<motion.div
															key={ex.id}
															initial={{ opacity: 0, x: -20 }}
															animate={{ opacity: 1, x: 0 }}
															transition={{ delay: index * 0.1 + idx * 0.05 }}
															className="flex items-start gap-3 p-3 bg-muted rounded-lg"
														>
															<span className="text-primary font-bold text-base flex-shrink-0 mt-0.5">
																{idx + 1}.
															</span>
															<div className="flex-1 min-w-0">
																<p className="font-semibold text-base">
																	{ex.exercise_name}
																</p>
																<p className="text-sm text-muted-foreground mt-1">
																	<span className="font-semibold">
																		{ex.sets} sets
																	</span>
																	{(ex.target_reps || ex.target_weight) &&
																		' × '}
																	{ex.target_reps && `${ex.target_reps} reps`}
																	{ex.target_reps && ex.target_weight && ', '}
																	{ex.target_weight &&
																		`${ex.target_weight} lbs`}
																</p>
															</div>
														</motion.div>
													))}
												</div>

												{/* Apply Button (Browse Mode Only) */}
												{isBrowseMode && selectedDate && (
													<PressScale>
														<Button
															className="w-full h-12 text-base font-semibold"
															disabled={applyingTemplateId === template.id}
															onClick={() => applyTemplate(template)}
														>
															{applyingTemplateId === template.id ? (
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
																	Applying...
																</span>
															) : (
																<>
																	Apply Template
																	<ChevronRight className="ml-2 h-5 w-5" />
																</>
															)}
														</Button>
													</PressScale>
												)}
											</CardContent>
										</Card>
									</PressScale>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				)}

				{/* Delete Confirmation Dialog */}
				<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Template?</DialogTitle>
							<DialogDescription>
								Are you sure you want to delete "{templateToDelete?.name}"?
								{usageCount > 0 && (
									<span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
										⚠️ {usageCount} workout{usageCount > 1 ? 's' : ''} use this
										template. They will keep their data but won't be linked to
										this template.
									</span>
								)}
							</DialogDescription>
						</DialogHeader>
						<div className="flex gap-3 mt-4">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => {
									haptics.buttonPress();
									setDeleteDialogOpen(false);
								}}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								className="flex-1"
								onClick={handleDeleteConfirm}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
