import { useState, useEffect, memo } from 'react';
import { Droplet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { formatDateLocal } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { PressScale } from './animations/PressScale';
import { haptics } from '@/lib/haptics';

interface HydrationTrackerProps {
	currentDate: Date;
}

export const HydrationTracker = memo(function HydrationTracker({
	currentDate,
}: HydrationTrackerProps) {
	const [filledCups, setFilledCups] = useState<boolean[]>(Array(8).fill(false));
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch hydration data for the current date
	useEffect(() => {
		const fetchHydrationLog = async () => {
			setLoading(true);
			setError(null);
			try {
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (!user) throw new Error('Not authenticated');

				const { data, error: fetchError } = await supabase
					.from('hydration_logs')
					.select('*')
					.eq('user_id', user.id)
					.eq('log_date', formatDateLocal(currentDate))
					.maybeSingle();

				if (fetchError) throw fetchError;

				if (data && data.cups_filled) {
					// Convert JSONB array to boolean array
					const cupsArray = Array.isArray(data.cups_filled)
						? data.cups_filled
						: [];
					setFilledCups(
						Array(8)
							.fill(false)
							.map((_, i) => cupsArray[i] === true)
					);
				} else {
					setFilledCups(Array(8).fill(false));
				}
			} catch (err) {
				console.error('Error fetching hydration log:', err);
				setError('Failed to load hydration data');
			} finally {
				setLoading(false);
			}
		};

		fetchHydrationLog();
	}, [currentDate]);

	// Update hydration log in database
	const updateHydrationLog = async (newFilledCups: boolean[]) => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error('Not authenticated');

			const totalCups = newFilledCups.filter(Boolean).length;

			const { error: upsertError } = await supabase
				.from('hydration_logs')
				.upsert(
					{
						user_id: user.id,
						log_date: formatDateLocal(currentDate),
						cups_filled: newFilledCups,
						total_cups: totalCups,
						updated_at: new Date().toISOString(),
					},
					{ onConflict: 'user_id,log_date' }
				);

			if (upsertError) throw upsertError;
		} catch (err) {
			console.error('Error updating hydration log:', err);
			setError('Failed to update hydration');
			haptics.error();
		}
	};

	// Handle cup toggle
	const handleCupToggle = async (index: number) => {
		const newFilledCups = [...filledCups];
		newFilledCups[index] = !newFilledCups[index];
		setFilledCups(newFilledCups);

		// Haptic feedback
		if (newFilledCups[index]) {
			haptics.success();
		} else {
			haptics.buttonPress();
		}

		await updateHydrationLog(newFilledCups);
	};

	const totalFilled = filledCups.filter(Boolean).length;
	const isGoalMet = totalFilled >= 8;

	return (
		<Card
			className={`transition-colors duration-300 ${
				isGoalMet
					? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500'
					: 'border-border'
			}`}
		>
			<CardContent className="p-4">
				<div className="flex items-center justify-between mb-3">
					<h3 className="font-semibold text-lg flex items-center gap-2">
						<Droplet
							className={`h-5 w-5 ${
								isGoalMet ? 'text-blue-500' : 'text-muted-foreground'
							}`}
						/>
						Daily Hydration
					</h3>
					<motion.p
						key={totalFilled}
						initial={{ scale: 1.2 }}
						animate={{ scale: 1 }}
						className={`text-sm font-semibold ${
							isGoalMet
								? 'text-blue-600 dark:text-blue-400'
								: 'text-muted-foreground'
						}`}
					>
						{totalFilled}/8 cups
					</motion.p>
				</div>

				{error && (
					<p className="text-xs text-red-600 dark:text-red-400 mb-2">
						{error}
					</p>
				)}

				{loading ? (
					<div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
						{Array(8)
							.fill(0)
							.map((_, i) => (
								<div
									key={i}
									className="w-10 h-10 rounded-full bg-muted animate-pulse"
								/>
							))}
					</div>
				) : (
					<div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
						<AnimatePresence>
							{filledCups.map((filled, index) => (
								<PressScale key={index}>
									<motion.button
										onClick={() => handleCupToggle(index)}
										className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
											filled
												? 'bg-blue-500 hover:bg-blue-600 text-white'
												: 'bg-muted hover:bg-muted/80 text-muted-foreground'
										}`}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										aria-label={`Cup ${index + 1} ${
											filled ? 'filled' : 'empty'
										}`}
									>
										<motion.div
											initial={false}
											animate={{
												scale: filled ? 1 : 0.8,
												opacity: filled ? 1 : 0.5,
											}}
											transition={{ duration: 0.2 }}
										>
											<Droplet
												className="h-5 w-5"
												fill={filled ? 'currentColor' : 'none'}
											/>
										</motion.div>
									</motion.button>
								</PressScale>
							))}
						</AnimatePresence>
					</div>
				)}

				{isGoalMet && (
					<motion.p
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-3 text-center"
					>
						Goal reached! Great job staying hydrated!
					</motion.p>
				)}
			</CardContent>
		</Card>
	);
});

