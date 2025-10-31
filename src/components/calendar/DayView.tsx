import { memo, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Trash2, Dumbbell, ChevronRight, Plus } from 'lucide-react';
import { supabase, type Workout, type WorkoutSession } from '@/lib/supabase';
import { formatDateLocal } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { PressScale } from '../animations/PressScale';

interface DayViewProps {
	currentDate: Date;
	workouts: Workout[];
	onWorkoutAdded: () => void;
}

export const DayView = memo(function DayView({ currentDate, workouts, onWorkoutAdded }: DayViewProps) {
	const navigate = useNavigate();
	const [workoutName, setWorkoutName] = useState('');
	const [reps, setReps] = useState('');
	const [weight, setWeight] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sessions, setSessions] = useState<WorkoutSession[]>([]);
	const [showAddForm, setShowAddForm] = useState(false);

	const dayWorkouts = useMemo(
		() =>
			workouts.filter((w) => w.workout_date === formatDateLocal(currentDate)),
		[workouts, currentDate]
	);

	const fetchSessions = async () => {
		try {
			const { data, error: sessionsError } = await supabase
				.from('workout_sessions')
				.select('*')
				.eq('workout_date', formatDateLocal(currentDate))
				.order('created_at', { ascending: false });

			if (sessionsError) throw sessionsError;
			setSessions(data || []);
		} catch (err) {
			console.error('Error fetching sessions:', err);
		}
	};

	useEffect(() => {
		fetchSessions();
	}, [currentDate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!workoutName.trim()) return;

		setIsSubmitting(true);
		setError(null);
		try {
			const { error: submitError } = await supabase.from('workouts').insert({
				workout_date: formatDateLocal(currentDate),
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
			setShowAddForm(false);
			onWorkoutAdded();
			haptics.success();
		} catch (err) {
			console.error('Error adding workout:', err);
			setError('Failed to add workout. Please try again.');
			haptics.error();
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
			haptics.success();
		} catch (err) {
			console.error('Error deleting workout:', err);
			setError('Failed to delete workout. Please try again.');
			haptics.error();
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
			haptics.success();
		} catch (err) {
			console.error('Error deleting session:', err);
			setError('Failed to delete workout session. Please try again.');
			haptics.error();
		}
	};

	const handleBrowseTemplates = () => {
		haptics.buttonPress();
		navigate(`/templates?date=${formatDateLocal(currentDate)}`);
	};

	const handleOpenSession = (session: WorkoutSession) => {
		haptics.buttonPress();
		navigate(
			`/session/${session.id}?name=${encodeURIComponent(session.template_name)}`
		);
	};

	const totalWorkouts = sessions.length + dayWorkouts.length;

	return (
		<div className="w-full space-y-4">
			{/* Date Header */}
			<div className="bg-card rounded-xl p-4 shadow-sm border border-border">
				<h2 className="text-2xl font-bold">
					{format(currentDate, 'EEEE, MMMM d')}
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					{totalWorkouts === 0
						? 'No workouts yet'
						: `${totalWorkouts} workout${totalWorkouts === 1 ? '' : 's'}`}
				</p>
			</div>

			{error && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					className="bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-700 text-red-900 dark:text-red-100 px-4 py-3 rounded-lg text-sm"
				>
					{error}
				</motion.div>
			)}

			{/* Quick Actions */}
			<div className="grid grid-cols-2 gap-3">
				<PressScale>
					<Button
						onClick={handleBrowseTemplates}
						className="h-14 text-base font-semibold"
						variant="outline"
					>
						<Dumbbell className="mr-2 h-5 w-5" />
						Templates
					</Button>
				</PressScale>
				<PressScale>
					<Button
						onClick={() => {
							haptics.buttonPress();
							setShowAddForm(!showAddForm);
						}}
						className="h-14 text-base font-semibold"
						variant={showAddForm ? 'secondary' : 'default'}
					>
						<Plus className="mr-2 h-5 w-5" />
						{showAddForm ? 'Cancel' : 'Add Workout'}
					</Button>
				</PressScale>
			</div>

			{/* Add Workout Form */}
			<AnimatePresence>
				{showAddForm && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2 }}
					>
						<Card className="border-2 border-primary/20">
							<CardContent className="p-4">
								<form onSubmit={handleSubmit} className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="workout-name" className="text-base">
											Workout Name *
										</Label>
										<Input
											id="workout-name"
											placeholder="e.g., Bench Press"
											value={workoutName}
											onChange={(e) => setWorkoutName(e.target.value)}
											required
											className="h-12 text-base"
											autoFocus
										/>
									</div>

									<div className="grid grid-cols-2 gap-3">
										<div className="space-y-2">
											<Label htmlFor="reps" className="text-base">
												Reps
											</Label>
											<Input
												id="reps"
												type="number"
												inputMode="numeric"
												placeholder="10"
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
												placeholder="135"
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
										>
											{isSubmitting ? 'Adding...' : '💪 Add Workout'}
										</Button>
									</PressScale>
								</form>
							</CardContent>
						</Card>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Workout Sessions from Templates */}
			<AnimatePresence>
				{sessions.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="space-y-3"
					>
						<h3 className="font-semibold text-lg flex items-center gap-2">
							<span className="text-primary">🏋️</span>
							Workout Sessions
							<motion.span
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-bold"
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
										className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
										onClick={() => handleOpenSession(session)}
									>
										<CardContent className="p-4 flex items-center justify-between min-h-[60px]">
											<div className="flex-1">
												<p className="font-semibold text-lg text-primary">
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
														className="h-11 w-11 p-0 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400 transition-colors"
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

			{/* Individual Workouts */}
			<AnimatePresence>
				{dayWorkouts.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="space-y-3"
					>
						<h3 className="font-semibold text-lg flex items-center gap-2">
							<span className="text-primary">📋</span>
							Individual Workouts
							<motion.span
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-bold"
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
								<Card className="hover:shadow-md transition-shadow border-2">
									<CardContent className="p-4 flex items-center justify-between min-h-[60px]">
										<div className="flex-1">
											<p className="font-semibold text-lg">
												{workout.workout_name}
											</p>
											<div className="text-sm text-muted-foreground mt-1">
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
												className="ml-3 h-11 w-11 p-0 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400 transition-colors"
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
			{sessions.length === 0 && dayWorkouts.length === 0 && !showAddForm && (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="text-center py-12 bg-muted rounded-xl border-2 border-dashed border-border"
				>
					<motion.p
						animate={{ scale: [1, 1.1, 1] }}
						transition={{ duration: 2, repeat: Infinity }}
						className="text-6xl mb-3"
					>
						💪
					</motion.p>
					<p className="text-base text-muted-foreground font-medium">
						No workouts yet for this day
					</p>
					<p className="text-sm text-muted-foreground mt-2">
						Browse templates or add a workout to get started!
					</p>
				</motion.div>
			)}
		</div>
	);
});

