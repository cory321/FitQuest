import { useStreaks } from '@/hooks/useStreaks';
import { ThemeToggle } from './ThemeToggle';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Calendar, Award, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function StatsPage() {
	const { streakData, isLoading } = useStreaks();

	const stats = [
		{
			icon: Flame,
			label: 'Current Streak',
			value: streakData.currentStreak,
			unit: 'days',
			color: 'text-orange-500',
			bg: 'bg-orange-50 dark:bg-orange-950/30',
		},
		{
			icon: Trophy,
			label: 'Longest Streak',
			value: streakData.longestStreak,
			unit: 'days',
			color: 'text-yellow-500',
			bg: 'bg-yellow-50 dark:bg-yellow-950/30',
		},
		{
			icon: Calendar,
			label: 'This Week',
			value: streakData.weeklyCount,
			unit: 'workouts',
			color: 'text-blue-500',
			bg: 'bg-blue-50 dark:bg-blue-950/30',
		},
		{
			icon: Award,
			label: 'Total Workouts',
			value: streakData.totalWorkouts,
			unit: 'completed',
			color: 'text-green-500',
			bg: 'bg-green-50 dark:bg-green-950/30',
		},
	];

	return (
		<div className="min-h-screen bg-background pb-24">
			{/* Header */}
			<div className="bg-card border-b sticky top-0 z-10 shadow-sm">
				<div className="max-w-4xl mx-auto p-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
								<TrendingUp className="h-7 w-7 text-primary" />
								Your Stats
							</h1>
							<p className="text-sm sm:text-base text-muted-foreground mt-1">
								Track your fitness journey
							</p>
						</div>
						<ThemeToggle />
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-4xl mx-auto p-4">
				{isLoading ? (
					<div className="text-center py-12">
						<p className="text-muted-foreground">Loading stats...</p>
					</div>
				) : (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
						className="space-y-4"
					>
						{/* Stats Grid */}
						<div className="grid grid-cols-2 gap-4">
							{stats.map((stat, index) => {
								const Icon = stat.icon;
								return (
									<motion.div
										key={stat.label}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
									>
										<Card className={`border-2 ${stat.bg}`}>
											<CardContent className="p-4">
												<div className="flex items-center gap-3 mb-3">
													<div className={`p-2 rounded-lg ${stat.bg}`}>
														<Icon className={`h-5 w-5 ${stat.color}`} />
													</div>
													<div className="flex-1">
														<p className="text-xs text-muted-foreground font-medium">
															{stat.label}
														</p>
													</div>
												</div>
												<div>
													<p className="text-3xl font-bold">{stat.value}</p>
													<p className="text-xs text-muted-foreground mt-1">
														{stat.unit}
													</p>
												</div>
											</CardContent>
										</Card>
									</motion.div>
								);
							})}
						</div>

						{/* Coming Soon Section */}
						<Card className="mt-6">
							<CardHeader>
								<CardTitle>More Stats Coming Soon</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									We're working on adding more detailed analytics, including:
								</p>
								<ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
									<li>Exercise performance tracking</li>
									<li>Personal records</li>
									<li>Volume and intensity charts</li>
									<li>Body part frequency analysis</li>
									<li>Progress photos</li>
								</ul>
							</CardContent>
						</Card>
					</motion.div>
				)}
			</div>
		</div>
	);
}
