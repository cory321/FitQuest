import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
					className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
				/>
			</div>
		);
	}

	if (!user) return <Navigate to="/login" replace />;
	return <>{children}</>;
}
