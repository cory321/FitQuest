import { ThemeToggle } from './ThemeToggle';
import { User, Settings, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function ProfilePage() {
	return (
		<div className="min-h-screen bg-background pb-24">
			{/* Header */}
			<div className="bg-card border-b sticky top-0 z-10 shadow-sm">
				<div className="max-w-4xl mx-auto p-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
								<User className="h-7 w-7 sm:h-9 sm:w-9 text-primary" />
								Profile
							</h1>
							<p className="text-sm sm:text-base text-muted-foreground mt-1">
								Manage your account
							</p>
						</div>
						<ThemeToggle />
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-4xl mx-auto p-4 space-y-4">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Settings
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							Profile settings and preferences coming soon.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Info className="h-5 w-5" />
							About FitQuest
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-muted-foreground">
							FitQuest is your personal workout tracking companion, designed to
							make fitness tracking engaging and rewarding.
						</p>
						<div className="pt-3 border-t">
							<p className="text-sm text-muted-foreground">Version 1.0.0</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
