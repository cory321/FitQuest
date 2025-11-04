import { useState } from 'react';
import { Copy, FileJson, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { PressScale } from './animations/PressScale';

interface Exercise {
	exercise_name: string;
	sets: number;
	target_reps: number | null;
	target_weight: number | null;
	order_index: number;
}

interface TemplateData {
	name: string;
	description: string;
	exercises: Exercise[];
}

interface JsonTemplateImportProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onImport: (data: TemplateData) => void;
}

const EXAMPLE_TEMPLATE = {
	name: "Example: Upper Body Workout",
	description: "A sample upper body strength training routine",
	exercises: [
		{
			exercise_name: "Bench Press",
			sets: 3,
			target_reps: 10,
			target_weight: 135,
			order_index: 0
		},
		{
			exercise_name: "Overhead Press",
			sets: 3,
			target_reps: 8,
			target_weight: 95,
			order_index: 1
		},
		{
			exercise_name: "Pull-ups",
			sets: 3,
			target_reps: 10,
			target_weight: null,
			order_index: 2
		}
	]
};

export function JsonTemplateImport({
	open,
	onOpenChange,
	onImport,
}: JsonTemplateImportProps) {
	const [jsonInput, setJsonInput] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const handleCopyExample = async () => {
		try {
			const exampleJson = JSON.stringify(EXAMPLE_TEMPLATE, null, 2);
			await navigator.clipboard.writeText(exampleJson);
			haptics.success();
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
			// Fallback for older browsers
			try {
				const textArea = document.createElement('textarea');
				textArea.value = JSON.stringify(EXAMPLE_TEMPLATE, null, 2);
				textArea.style.position = 'fixed';
				textArea.style.left = '-999999px';
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand('copy');
				document.body.removeChild(textArea);
				haptics.success();
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			} catch (fallbackErr) {
				console.error('Fallback copy failed:', fallbackErr);
				setError('Failed to copy to clipboard');
			}
		}
	};

	const validateTemplate = (data: any): string | null => {
		// Check if it's an object
		if (!data || typeof data !== 'object') {
			return 'Template must be a valid JSON object';
		}

		// Check required fields
		if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
			return 'Template must have a "name" field (string)';
		}

		// Description is optional but must be string if present
		if (data.description !== undefined && data.description !== null && typeof data.description !== 'string') {
			return 'Field "description" must be a string';
		}

		// Check exercises array
		if (!Array.isArray(data.exercises)) {
			return 'Template must have an "exercises" field (array)';
		}

		if (data.exercises.length === 0) {
			return 'Template must have at least one exercise';
		}

		// Validate each exercise
		for (let i = 0; i < data.exercises.length; i++) {
			const ex = data.exercises[i];
			const exNum = i + 1;

			if (!ex || typeof ex !== 'object') {
				return `Exercise ${exNum} must be an object`;
			}

			if (!ex.exercise_name || typeof ex.exercise_name !== 'string' || !ex.exercise_name.trim()) {
				return `Exercise ${exNum} must have an "exercise_name" field (string)`;
			}

			if (typeof ex.sets !== 'number' || ex.sets < 1 || !Number.isInteger(ex.sets)) {
				return `Exercise ${exNum} must have "sets" as a positive integer (currently: ${ex.sets})`;
			}

			if (ex.target_reps !== null && (typeof ex.target_reps !== 'number' || ex.target_reps < 0 || !Number.isInteger(ex.target_reps))) {
				return `Exercise ${exNum}: "target_reps" must be a positive integer or null`;
			}

			if (ex.target_weight !== null && (typeof ex.target_weight !== 'number' || ex.target_weight < 0)) {
				return `Exercise ${exNum}: "target_weight" must be a positive number or null`;
			}

			if (typeof ex.order_index !== 'number' || ex.order_index < 0 || !Number.isInteger(ex.order_index)) {
				return `Exercise ${exNum}: "order_index" must be a non-negative integer`;
			}
		}

		return null;
	};

	const handleImport = () => {
		setError(null);

		if (!jsonInput.trim()) {
			setError('Please paste JSON data');
			haptics.warning();
			return;
		}

		try {
			// Parse JSON
			const parsed = JSON.parse(jsonInput);

			// Validate structure
			const validationError = validateTemplate(parsed);
			if (validationError) {
				setError(validationError);
				haptics.warning();
				return;
			}

			// Success! Pass the data to parent
			haptics.success();
			onImport({
				name: parsed.name.trim(),
				description: (parsed.description || '').trim(),
				exercises: parsed.exercises.map((ex: any) => ({
					exercise_name: ex.exercise_name.trim(),
					sets: ex.sets,
					target_reps: ex.target_reps,
					target_weight: ex.target_weight,
					order_index: ex.order_index,
				})),
			});

			// Reset form
			setJsonInput('');
			setError(null);
		} catch (err) {
			if (err instanceof SyntaxError) {
				setError(`Invalid JSON syntax: ${err.message}`);
			} else {
				setError('Failed to parse JSON');
			}
			haptics.warning();
		}
	};

	const handleCancel = () => {
		haptics.buttonPress();
		setJsonInput('');
		setError(null);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FileJson className="h-5 w-5 text-primary" />
						Import Template from JSON
					</DialogTitle>
					<DialogDescription>
						Paste your template JSON data below. Use the example button to see the
						correct format.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto space-y-4">
					{/* Copy Example Button */}
					<PressScale>
						<Button
							variant="outline"
							onClick={handleCopyExample}
							className="w-full"
						>
							<AnimatePresence mode="wait">
								{copied ? (
									<motion.div
										key="copied"
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										exit={{ scale: 0 }}
										className="flex items-center gap-2"
									>
										<Check className="h-4 w-4 text-green-600" />
										Copied to Clipboard!
									</motion.div>
								) : (
									<motion.div
										key="copy"
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										exit={{ scale: 0 }}
										className="flex items-center gap-2"
									>
										<Copy className="h-4 w-4" />
										Copy Example JSON
									</motion.div>
								)}
							</AnimatePresence>
						</Button>
					</PressScale>

					{/* JSON Input */}
					<div className="space-y-2">
						<Label htmlFor="json-input" className="text-base">
							Template JSON
						</Label>
						<textarea
							id="json-input"
							value={jsonInput}
							onChange={(e) => setJsonInput(e.target.value)}
							placeholder='{\n  "name": "My Workout",\n  "description": "...",\n  "exercises": [...]\n}'
							className="w-full h-64 px-3 py-2 text-sm font-mono bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
						/>
					</div>

					{/* Error Display */}
					<AnimatePresence>
						{error && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg overflow-hidden"
							>
								<p className="text-sm font-medium">❌ {error}</p>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Format Reference */}
					<div className="bg-muted p-4 rounded-lg text-sm space-y-2">
						<p className="font-semibold text-foreground">Required JSON Format:</p>
						<ul className="space-y-1 text-muted-foreground">
							<li>• <code className="text-xs bg-background px-1 py-0.5 rounded">name</code>: string (required)</li>
							<li>• <code className="text-xs bg-background px-1 py-0.5 rounded">description</code>: string (optional)</li>
							<li>• <code className="text-xs bg-background px-1 py-0.5 rounded">exercises</code>: array of objects (required, min 1)</li>
						</ul>
						<p className="font-semibold text-foreground mt-3">Exercise Format:</p>
						<ul className="space-y-1 text-muted-foreground">
							<li>• <code className="text-xs bg-background px-1 py-0.5 rounded">exercise_name</code>: string (required)</li>
							<li>• <code className="text-xs bg-background px-1 py-0.5 rounded">sets</code>: positive integer (required)</li>
							<li>• <code className="text-xs bg-background px-1 py-0.5 rounded">target_reps</code>: integer or null</li>
							<li>• <code className="text-xs bg-background px-1 py-0.5 rounded">target_weight</code>: number or null</li>
							<li>• <code className="text-xs bg-background px-1 py-0.5 rounded">order_index</code>: integer starting from 0</li>
						</ul>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-3 pt-4 border-t">
					<PressScale className="flex-1">
						<Button
							variant="outline"
							onClick={handleCancel}
							className="w-full h-11"
						>
							Cancel
						</Button>
					</PressScale>
					<PressScale className="flex-1">
						<Button
							onClick={handleImport}
							className="w-full h-11 font-semibold"
						>
							<FileJson className="mr-2 h-4 w-4" />
							Import Template
						</Button>
					</PressScale>
				</div>
			</DialogContent>
		</Dialog>
	);
}

