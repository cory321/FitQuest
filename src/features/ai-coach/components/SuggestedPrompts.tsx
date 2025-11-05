import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { haptics } from '@/lib/haptics';
import { TrendingUp, Target, Flame, Lightbulb } from 'lucide-react';

const SUGGESTED_PROMPTS = [
	{
		icon: TrendingUp,
		text: 'How has my progress been this month?',
		color: 'text-blue-600 dark:text-blue-400',
		bg: 'bg-blue-50 dark:bg-blue-950/40',
	},
	{
		icon: Target,
		text: 'What should I focus on next?',
		color: 'text-purple-600 dark:text-purple-400',
		bg: 'bg-purple-50 dark:bg-purple-950/40',
	},
	{
		icon: Flame,
		text: 'Analyze my current workout streak',
		color: 'text-orange-600 dark:text-orange-400',
		bg: 'bg-orange-50 dark:bg-orange-950/40',
	},
	{
		icon: Lightbulb,
		text: 'Suggest a new workout routine',
		color: 'text-emerald-600 dark:text-emerald-400',
		bg: 'bg-emerald-50 dark:bg-emerald-950/40',
	},
];

interface SuggestedPromptsProps {
	onPromptClick: (prompt: string) => void;
}

export function SuggestedPrompts({ onPromptClick }: SuggestedPromptsProps) {
	return (
		<div className="px-4 mt-6">
			<p className="text-sm text-muted-foreground mb-3">Try asking:</p>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{SUGGESTED_PROMPTS.map((prompt, index) => {
					const Icon = prompt.icon;
					return (
						<motion.div
							key={prompt.text}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							whileTap={{ scale: 0.97 }}
						>
							<Card
								className={`p-4 cursor-pointer hover:shadow-md transition-shadow border-2 ${prompt.bg}`}
								onClick={() => {
									haptics.buttonPress();
									onPromptClick(prompt.text);
								}}
							>
								<div className="flex items-start gap-3">
									<div className={`p-2 rounded-lg ${prompt.bg}`}>
										<Icon className={`h-5 w-5 ${prompt.color}`} />
									</div>
									<p className="text-sm font-medium flex-1">{prompt.text}</p>
								</div>
							</Card>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
