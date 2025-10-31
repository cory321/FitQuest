import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, ChevronRight, Layers } from 'lucide-react';
import { supabase, type WorkoutTemplate } from '@/lib/supabase';
import { Card, CardContent } from './ui/card';
import { haptics } from '@/lib/haptics';
import { PressScale } from './animations/PressScale';
import { formatDateLocal } from '@/lib/utils';

interface RecentTemplate extends WorkoutTemplate {
	last_used: string;
	exercise_count: number;
}

export function RecentTemplates() {
	const navigate = useNavigate();
	const [recentTemplates, setRecentTemplates] = useState<RecentTemplate[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetchRecentTemplates();
	}, []);

	const fetchRecentTemplates = async () => {
		setIsLoading(true);
		try {
			// Get most recently used templates from workout_sessions
			const { data: sessions, error: sessionsError } = await supabase
				.from('workout_sessions')
				.select('template_id, template_name, created_at')
				.not('template_id', 'is', null)
				.order('created_at', { ascending: false })
				.limit(10);

			if (sessionsError) throw sessionsError;

			if (!sessions || sessions.length === 0) {
				setRecentTemplates([]);
				setIsLoading(false);
				return;
			}

			// Get unique templates (most recent first)
			const uniqueTemplateIds = [
				...new Set(sessions.map((s) => s.template_id)),
			].slice(0, 3);

			// Fetch full template data
			const { data: templates, error: templatesError } = await supabase
				.from('workout_templates')
				.select('*')
				.in('id', uniqueTemplateIds);

			if (templatesError) throw templatesError;

			// Get exercise counts for each template
			const { data: exercises, error: exercisesError } = await supabase
				.from('template_exercises')
				.select('template_id')
				.in('template_id', uniqueTemplateIds);

			if (exercisesError) throw exercisesError;

			// Build exercise count map
			const exerciseCountMap = new Map<string, number>();
			exercises?.forEach((ex) => {
				exerciseCountMap.set(
					ex.template_id,
					(exerciseCountMap.get(ex.template_id) || 0) + 1
				);
			});

			// Build recent templates with metadata
			const templatesWithMetadata: RecentTemplate[] = uniqueTemplateIds
				.map((templateId) => {
					const template = templates?.find((t) => t.id === templateId);
					const lastSession = sessions.find((s) => s.template_id === templateId);
					if (!template || !lastSession) return null;

					return {
						...template,
						last_used: lastSession.created_at,
						exercise_count: exerciseCountMap.get(templateId) || 0,
					};
				})
				.filter(Boolean) as RecentTemplate[];

			setRecentTemplates(templatesWithMetadata);
		} catch (err) {
			console.error('Error fetching recent templates:', err);
			setRecentTemplates([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleQuickStart = async (template: RecentTemplate) => {
		haptics.buttonPress();

		try {
			// Create a new workout session for today
			const { data: session, error: sessionError } = await supabase
				.from('workout_sessions')
				.insert({
					workout_date: formatDateLocal(new Date()),
					template_id: template.id,
					template_name: template.name,
				})
				.select()
				.single();

			if (sessionError) throw sessionError;

			// Fetch template exercises
			const { data: templateExercises, error: exercisesError } = await supabase
				.from('template_exercises')
				.select('*')
				.eq('template_id', template.id)
				.order('order_index');

			if (exercisesError) throw exercisesError;

			// Fetch previous exercise data for smart defaults
			const exerciseNames =
				templateExercises?.map((ex) => ex.exercise_name) || [];
			const { data: previousExercises } = await supabase
				.from('session_exercises')
				.select('exercise_name, actual_reps, actual_weight, created_at')
				.in('exercise_name', exerciseNames)
				.eq('completed', true)
				.order('created_at', { ascending: false })
				.limit(100);

			// Create a map of most recent actual values per exercise
			const previousDataMap = new Map<
				string,
				{ reps: number | null; weight: number | null }
			>();
			previousExercises?.forEach((ex) => {
				if (!previousDataMap.has(ex.exercise_name)) {
					previousDataMap.set(ex.exercise_name, {
						reps: ex.actual_reps,
						weight: ex.actual_weight,
					});
				}
			});

			// Create session exercises with smart defaults
			const sessionExercises: any[] = [];
			let orderIndex = 0;

			templateExercises?.forEach((ex) => {
				const previousData = previousDataMap.get(ex.exercise_name);
				for (let setNum = 1; setNum <= ex.sets; setNum++) {
					sessionExercises.push({
						session_id: session.id,
						exercise_name: ex.exercise_name,
						target_reps: ex.target_reps,
						target_weight: ex.target_weight,
						actual_reps: previousData?.reps || null,
						actual_weight: previousData?.weight || null,
						set_number: setNum,
						total_sets: ex.sets,
						order_index: orderIndex++,
						completed: false,
					});
				}
			});

			const { error: insertError } = await supabase
				.from('session_exercises')
				.insert(sessionExercises);

			if (insertError) throw insertError;

			haptics.success();
			navigate(
				`/session/${session.id}?name=${encodeURIComponent(template.name)}`
			);
		} catch (err) {
			console.error('Error starting quick workout:', err);
		}
	};

	if (isLoading || recentTemplates.length === 0) {
		return null;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.2 }}
			className="mb-4"
		>
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
					<Layers className="h-4 w-4" />
					Recent Templates
				</h2>
				<button
					onClick={() => {
						haptics.buttonPress();
						navigate('/templates');
					}}
					className="text-xs text-primary hover:underline font-medium"
				>
					View all
				</button>
			</div>

			<div className="space-y-2">
				<AnimatePresence>
					{recentTemplates.map((template, index) => (
						<motion.div
							key={template.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							transition={{ delay: index * 0.1 }}
						>
							<PressScale scale={0.98}>
								<Card
									className="hover:shadow-md transition-all border-2 hover:border-primary/50 cursor-pointer"
									onClick={() => handleQuickStart(template)}
								>
									<CardContent className="p-3 flex items-center gap-3">
										<div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
											<Dumbbell className="h-5 w-5 text-primary" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-semibold text-sm truncate">
												{template.name}
											</p>
											<p className="text-xs text-muted-foreground">
												{template.exercise_count} exercise
												{template.exercise_count !== 1 ? 's' : ''}
											</p>
										</div>
										<ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
									</CardContent>
								</Card>
							</PressScale>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}
