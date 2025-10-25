import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Trash2, Dumbbell, ChevronRight } from 'lucide-react';
import { supabase, type Workout, type WorkoutSession } from '@/lib/supabase';
import { formatDateLocal } from '@/lib/utils';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { PressScale } from './animations/PressScale';

interface WorkoutDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedDate: Date | null;
	workouts: Workout[];
	onWorkoutAdded: () => void;
}

export function WorkoutDialog({
	open,
	onOpenChange,
	selectedDate,
	workouts,
	onWorkoutAdded,
}: WorkoutDialogProps) {
	const navigate = useNavigate();
	const [workoutName, setWorkoutName] = useState('');
	const [reps, setReps] = useState('');
	const [weight, setWeight] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sessions, setSessions] = useState<WorkoutSession[]>([]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedDate || !workoutName.trim()) return;

		setIsSubmitting(true);
		setError(null);
		try {
			const { error: submitError } = await supabase.from('workouts').insert({
				workout_date: formatDateLocal(selectedDate),
				workout_name: workoutName.trim(),
				reps: reps ? parseInt(reps) : null,
				weight_lbs: weight ? parseFloat(weight) : null,
			});

			if (submitError) {
				console.error('Supabase error:', submitError);
				throw submitError;
			}

			// Reset form
			setWorkoutName('');
			setReps('');
			setWeight('');
			setError(null);
			onWorkoutAdded();
		} catch (err) {
			console.error('Error adding workout:', err);
			setError('Failed to add workout. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		setError(null);
		try {
			const { error: deleteError } = await supabase
				.from('workouts')
				.delete()
				.eq('id', id);
			if (deleteError) {
				console.error('Supabase error:', deleteError);
				throw deleteError;
			}
			onWorkoutAdded();
		} catch (err) {
			console.error('Error deleting workout:', err);
			setError('Failed to delete workout. Please try again.');
		}
	};

	const handleDeleteSession = async (id: string) => {
		setError(null);
		try {
			const { error: deleteError } = await supabase
				.from('workout_sessions')
				.delete()
				.eq('id', id);
			if (deleteError) {
				console.error('Supabase error:', deleteError);
				throw deleteError;
			}
			fetchSessions();
			onWorkoutAdded();
		} catch (err) {
			console.error('Error deleting session:', err);
			setError('Failed to delete workout session. Please try again.');
		}
	};

	const fetchSessions = async () => {
		if (!selectedDate) return;

		try {
			const { data, error: sessionsError } = await supabase
				.from('workout_sessions')
				.select('*')
				.eq('workout_date', formatDateLocal(selectedDate))
				.order('created_at', { ascending: false });

			if (sessionsError) throw sessionsError;
			setSessions(data || []);
		} catch (err) {
			console.error('Error fetching sessions:', err);
		}
	};

	useEffect(() => {
		if (open && selectedDate) {
			fetchSessions();
		}
	}, [open, selectedDate]);

	const handleBrowseTemplates = () => {
		if (!selectedDate) return;
		haptics.buttonPress();
		// Close dialog and navigate to templates page
		onOpenChange(false);
		navigate(`/templates?date=${formatDateLocal(selectedDate)}`);
	};

	const handleOpenSession = (session: WorkoutSession) => {
		haptics.buttonPress();
		// Close dialog and navigate to session workout page
		onOpenChange(false);
		navigate(
			`/session/${session.id}?name=${encodeURIComponent(session.template_name)}`
		);
	};

	const dayWorkouts = workouts.filter(
		(w) => selectedDate && w.workout_date === formatDateLocal(selectedDate)
	);

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="p-6">
					<DialogHeader className="mb-4">
						<DialogTitle className="text-2xl">
							{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Workouts'}
						</DialogTitle>
						<DialogDescription className="text-base">
							Add or view workouts for this day
						</DialogDescription>
					</DialogHeader>

					<div
						className="flex-1 overflow-y-auto pb-6"
						style={{ maxHeight: 'calc(100vh - 120px)' }}
					>
						{error && (
							<div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-700 text-red-900 dark:text-red-100 px-3 py-2 rounded text-sm">
								{error}
							</div>
						)}

						{/* Browse Templates Button */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="pb-4"
						>
							<PressScale>
								<Button
									onClick={handleBrowseTemplates}
									className="w-full h-12 text-base font-semibold"
									variant="outline"
								>
									<Dumbbell className="mr-2 h-5 w-5" />
									Browse Workout Templates
								</Button>
							</PressScale>
						</motion.div>

						{/* Workout Sessions from Templates */}
						<AnimatePresence>
							{sessions.length > 0 && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									className="space-y-3 mb-6"
								>
									<h3 className="font-semibold text-base flex items-center gap-2">
										<span className="text-primary">🏋️</span>
										Workout Sessions
										<motion.span
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full"
										>
											{sessions.length}
										</motion.span>
									</h3>
									{sessions.map((session, index) => (
										<motion.div
											key={session.id}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: 20 }}
											transition={{ delay: index * 0.05 }}
										>
											<PressScale>
												<Card
													className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50"
													onClick={() => handleOpenSession(session)}
												>
													<CardContent className="p-4 flex items-center justify-between">
														<div className="flex-1">
															<p className="font-semibold text-base text-primary">
																{session.template_name}
															</p>
															<p className="text-sm text-muted-foreground mt-1">
																Tap to start workout
															</p>
														</div>
														<div className="flex items-center gap-2">
															<motion.div whileTap={{ scale: 0.9 }}>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={(e) => {
																		e.stopPropagation();
																		haptics.warning();
																		handleDeleteSession(session.id);
																	}}
																	className="h-10 w-10 p-0 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400 transition-colors"
																>
																	<Trash2 className="h-5 w-5" />
																</Button>
															</motion.div>
															<ChevronRight className="h-5 w-5 text-muted-foreground" />
														</div>
													</CardContent>
												</Card>
											</PressScale>
										</motion.div>
									))}
								</motion.div>
							)}
						</AnimatePresence>

						{/* Individual workouts */}
						<AnimatePresence>
							{dayWorkouts.length > 0 && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									className="space-y-3 mb-6"
								>
									<h3 className="font-semibold text-base flex items-center gap-2">
										<span className="text-primary">📋</span>
										Individual Workouts
										<motion.span
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full"
										>
											{dayWorkouts.length}
										</motion.span>
									</h3>
									{dayWorkouts.map((workout, index) => (
										<motion.div
											key={workout.id}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: 20 }}
											transition={{ delay: index * 0.05 }}
										>
											<Card className="hover:shadow-md transition-shadow">
												<CardContent className="p-4 flex items-start justify-between">
													<div className="flex-1">
														<p className="font-semibold text-base">
															{workout.workout_name}
														</p>
														<div className="text-base text-muted-foreground mt-1">
															{workout.reps && <span>{workout.reps} reps</span>}
															{workout.reps && workout.weight_lbs && (
																<span> • </span>
															)}
															{workout.weight_lbs && (
																<span>{workout.weight_lbs} lbs</span>
															)}
														</div>
													</div>
													<motion.div whileTap={{ scale: 0.9 }}>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => {
																haptics.warning();
																handleDelete(workout.id);
															}}
															className="ml-3 h-10 w-10 p-0 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400 transition-colors"
														>
															<Trash2 className="h-5 w-5" />
														</Button>
													</motion.div>
												</CardContent>
											</Card>
										</motion.div>
									))}
								</motion.div>
							)}
						</AnimatePresence>

						{/* Empty state */}
						{sessions.length === 0 && dayWorkouts.length === 0 && (
							<motion.div
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className="text-center py-6 mb-6 bg-muted rounded-lg border-2 border-dashed border-border"
							>
								<motion.p
									animate={{ scale: [1, 1.1, 1] }}
									transition={{ duration: 2, repeat: Infinity }}
									className="text-4xl mb-2"
								>
									💪
								</motion.p>
								<p className="text-sm text-muted-foreground">
									No workouts yet for this day
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									Browse templates or add an individual workout below!
								</p>
							</motion.div>
						)}

						{/* Add new workout form */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="border-t pt-4 mt-4"
						>
							<h3 className="font-semibold text-base mb-4 flex items-center gap-2">
								<span>➕</span>
								Add New Workout
							</h3>
							<form onSubmit={handleSubmit} className="space-y-5">
								<div className="space-y-2">
									<Label htmlFor="workout-name" className="text-base">
										Workout Name *
									</Label>
									<Input
										id="workout-name"
										placeholder=""
										value={workoutName}
										onChange={(e) => setWorkoutName(e.target.value)}
										required
										className="h-12 text-base"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="reps" className="text-base">
											Reps
										</Label>
										<Input
											id="reps"
											type="number"
											inputMode="numeric"
											placeholder=""
											value={reps}
											onChange={(e) => setReps(e.target.value)}
											min="0"
											className="h-12 text-base"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="weight" className="text-base">
											Weight (lbs)
										</Label>
										<Input
											id="weight"
											type="number"
											inputMode="decimal"
											step="0.1"
											placeholder=""
											value={weight}
											onChange={(e) => setWeight(e.target.value)}
											min="0"
											className="h-12 text-base"
										/>
									</div>
								</div>

								<PressScale>
									<Button
										type="submit"
										className="w-full h-12 text-base font-semibold"
										disabled={isSubmitting}
										onClick={() => haptics.buttonPress()}
									>
										{isSubmitting ? 'Adding...' : '💪 Add Workout'}
									</Button>
								</PressScale>
							</form>
						</motion.div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
