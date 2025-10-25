import { Home, TrendingUp, User, Plus, FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { useState } from 'react';

interface NavItem {
	icon: React.ElementType;
	label: string;
	path: string;
}

const navItems: NavItem[] = [
	{ icon: Home, label: 'Home', path: '/' },
	{ icon: TrendingUp, label: 'Stats', path: '/stats' },
	{ icon: FileText, label: 'Templates', path: '/templates' },
	{ icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
	const location = useLocation();
	const navigate = useNavigate();
	const [showFAB] = useState(true);

	const handleNavigation = (path: string) => {
		haptics.buttonPress();
		navigate(path);
	};

	// Don't show on session page (full screen experience)
	if (location.pathname.includes('/session/')) {
		return null;
	}

	return (
		<>
			{/* Floating Action Button */}
			{showFAB && location.pathname === '/' && (
				<motion.button
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					exit={{ scale: 0 }}
					whileTap={{ scale: 0.9 }}
					onClick={() => {
						haptics.buttonPress();
						// This will trigger the calendar to open today's dialog
						const event = new CustomEvent('fab-add-workout');
						window.dispatchEvent(event);
					}}
					className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:shadow-xl active:shadow-lg transition-shadow"
					style={{
						boxShadow: '0 8px 32px rgba(224, 93, 56, 0.4)',
					}}
				>
					<Plus className="h-6 w-6" />
				</motion.button>
			)}

			{/* Bottom Navigation Bar */}
			<motion.nav
				initial={{ y: 100 }}
				animate={{ y: 0 }}
				transition={{ type: 'spring', stiffness: 260, damping: 20 }}
				className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom"
				style={{
					boxShadow: '0 -2px 16px rgba(0, 0, 0, 0.08)',
				}}
			>
				<div className="flex items-center justify-around px-2 h-16 max-w-lg mx-auto">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = location.pathname === item.path;

						return (
							<button
								key={item.path}
								onClick={() => handleNavigation(item.path)}
								className="flex flex-col items-center justify-center flex-1 h-full relative"
							>
								{/* Active indicator */}
								{isActive && (
									<motion.div
										layoutId="activeTab"
										className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full"
										transition={{
											type: 'spring',
											stiffness: 380,
											damping: 30,
										}}
									/>
								)}

								{/* Icon with scale animation */}
								<motion.div
									animate={{
										scale: isActive ? 1.1 : 1,
										y: isActive ? -2 : 0,
									}}
									transition={{
										type: 'spring',
										stiffness: 400,
										damping: 17,
									}}
								>
									<Icon
										className={`h-6 w-6 transition-colors ${
											isActive ? 'text-primary' : 'text-muted-foreground'
										}`}
									/>
								</motion.div>

								{/* Label */}
								<span
									className={`text-xs mt-1 font-medium transition-colors ${
										isActive ? 'text-primary' : 'text-muted-foreground'
									}`}
								>
									{item.label}
								</span>
							</button>
						);
					})}
				</div>
			</motion.nav>

			{/* Safe area spacer for content */}
			<div className="h-16" />
		</>
	);
}
