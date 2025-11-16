import { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';
import { motion } from 'framer-motion';

interface ChatInputProps {
	value: string;
	onChange: (value: string) => void;
	onSend: (message: string) => void;
	disabled?: boolean;
}

export function ChatInput({
	value,
	onChange,
	onSend,
	disabled,
}: ChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!value.trim() || disabled) return;

		haptics.buttonPress();
		onSend(value);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, [value]);

	return (
		<motion.form
			onSubmit={handleSubmit}
			className="flex gap-3 items-end"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<div className="flex-1 relative">
				<textarea
					ref={textareaRef}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Ask your AI coach anything..."
					disabled={disabled}
					rows={1}
					className="w-full resize-none rounded-2xl border-2 border-input bg-background px-4 py-3.5 text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50 max-h-32 overflow-y-auto transition-all"
					style={{
						WebkitAppearance: 'none',
						fontSize: '16px', // Prevents zoom on iOS
					}}
				/>
			</div>
			<motion.div
				whileTap={{ scale: 0.9 }}
				whileHover={{ scale: 1.05 }}
			>
				<Button
					type="submit"
					size="icon"
					disabled={!value.trim() || disabled}
					className="h-12 w-12 rounded-2xl flex-shrink-0 shadow-md hover:shadow-lg transition-shadow"
				>
					<Send className="h-5 w-5" />
				</Button>
			</motion.div>
		</motion.form>
	);
}
