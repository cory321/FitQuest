import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dumbbell, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptics } from '@/lib/haptics';

export function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSignUp, setIsSignUp] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const { signIn, signUp } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		haptics.buttonPress();

		try {
			if (isSignUp) {
				await signUp(email, password);
			} else {
				await signIn(email, password);
			}
			navigate('/');
		} catch (err: any) {
			setError(err.message || 'An error occurred');
			haptics.error();
		} finally {
			setLoading(false);
		}
	};

	const toggleMode = () => {
		setIsSignUp(!isSignUp);
		setError(null);
		haptics.buttonPress();
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="w-full max-w-md"
			>
				<Card className="border-2">
					<CardHeader className="space-y-1">
						<CardTitle className="flex items-center gap-2 text-2xl sm:text-3xl font-bold">
							<Dumbbell className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
							FitQuest
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							{isSignUp
								? 'Create your account to get started'
								: 'Welcome back! Sign in to continue'}
						</p>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									autoComplete="email"
									className="h-12"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									autoComplete={isSignUp ? 'new-password' : 'current-password'}
									className="h-12"
									minLength={6}
								/>
								{isSignUp && (
									<p className="text-xs text-muted-foreground">
										Must be at least 6 characters
									</p>
								)}
							</div>

							{error && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-400 dark:border-red-700 rounded-lg"
								>
									<p className="text-sm text-red-900 dark:text-red-100">
										{error}
									</p>
								</motion.div>
							)}

							<Button
								type="submit"
								className="w-full h-12 text-base font-semibold"
								disabled={loading}
							>
								{loading ? (
									<>
										<Loader2 className="mr-2 h-5 w-5 animate-spin" />
										{isSignUp ? 'Creating account...' : 'Signing in...'}
									</>
								) : isSignUp ? (
									'Create Account'
								) : (
									'Sign In'
								)}
							</Button>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-card px-2 text-muted-foreground">Or</span>
								</div>
							</div>

							<Button
								type="button"
								variant="ghost"
								className="w-full h-12"
								onClick={toggleMode}
								disabled={loading}
							>
								{isSignUp
									? 'Already have an account? Sign In'
									: "Don't have an account? Sign Up"}
							</Button>
						</form>
					</CardContent>
				</Card>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="mt-6 text-center text-sm text-muted-foreground"
				>
					Track your fitness journey with FitQuest
				</motion.p>
			</motion.div>
		</div>
	);
}
