import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Dumbbell, ArrowLeft, ChevronRight } from 'lucide-react';
import {
	supabase,
	type WorkoutTemplate,
	type TemplateExercise,
} from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from './ThemeToggle';
import { formatDateLocal, parseDateLocal } from '@/lib/utils';

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

	const applyTemplate = async (template: TemplateWithExercises) => {
		if (!selectedDate) return;

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
			navigate('/');
		} catch (err) {
			console.error('Error applying template:', err);
			setError('Failed to apply template. Please try again.');
		} finally {
			setApplyingTemplateId(null);
		}
	};

	return (
		<div className="min-h-screen bg-background p-4 sm:p-6 pb-20">
			{/* Header */}
			<div className="max-w-4xl mx-auto">
				<div className="flex items-center gap-3 mb-6">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate('/')}
						className="flex-shrink-0"
					>
						<ArrowLeft className="h-6 w-6" />
					</Button>
					<div className="flex-1">
						<h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
							<Dumbbell className="h-7 w-7 text-primary" />
							Workout Templates
						</h1>
						{selectedDate && (
							<p className="text-sm sm:text-base text-muted-foreground mt-1">
								Select a template for {format(selectedDate, 'MMMM d, yyyy')}
							</p>
						)}
					</div>
					<ThemeToggle />
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
						{error}
					</div>
				)}

				{isLoading ? (
					<div className="text-center py-12">
						<p className="text-muted-foreground">Loading templates...</p>
					</div>
				) : templates.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-muted-foreground">No templates available</p>
					</div>
				) : (
					<div className="space-y-4">
						{templates.map((template) => (
							<Card
								key={template.id}
								className="hover:shadow-lg transition-all border-2 hover:border-primary/50"
							>
								<CardHeader className="pb-4">
									<CardTitle className="text-xl flex items-center justify-between">
										<span>{template.name}</span>
										<span className="text-sm bg-primary/20 text-primary px-3 py-1.5 rounded-full font-normal">
											{template.exercises.length} exercises
										</span>
									</CardTitle>
									{template.description && (
										<p className="text-sm sm:text-base text-muted-foreground mt-2">
											{template.description}
										</p>
									)}
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Exercise List */}
									<div className="space-y-2">
										{template.exercises.map((ex, idx) => (
											<div
												key={ex.id}
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
														{(ex.target_reps || ex.target_weight) && ' × '}
														{ex.target_reps && `${ex.target_reps} reps`}
														{ex.target_reps && ex.target_weight && ', '}
														{ex.target_weight && `${ex.target_weight} lbs`}
													</p>
												</div>
											</div>
										))}
									</div>

									{/* Apply Button */}
									{selectedDate && (
										<Button
											className="w-full h-12 text-base font-semibold"
											disabled={applyingTemplateId === template.id}
											onClick={() => applyTemplate(template)}
										>
											{applyingTemplateId === template.id ? (
												'Applying...'
											) : (
												<>
													Apply Template
													<ChevronRight className="ml-2 h-5 w-5" />
												</>
											)}
										</Button>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
