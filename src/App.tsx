import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { LoginPage } from './components/LoginPage';
import { WorkoutCalendar } from './components/WorkoutCalendar';
import { TemplateSelector } from './components/TemplateSelector';
import { SessionWorkoutPage } from './components/SessionWorkoutPage';
import { StatsPage } from './components/StatsPage';
import { ProfilePage } from './components/ProfilePage';
import { CoachPage } from './features/ai-coach/components/CoachPage';
import { ThemeProvider } from './components/ThemeProvider';
import { BottomNav } from './components/BottomNav';
import './App.css';

function App() {
	const location = useLocation();

	return (
		<AuthProvider>
			<ThemeProvider>
				<AnimatePresence mode="wait" initial={false}>
					<Routes location={location} key={location.pathname}>
						<Route path="/login" element={<LoginPage />} />
						<Route
							path="/"
							element={
								<AuthGuard>
									<WorkoutCalendar />
								</AuthGuard>
							}
						/>
						<Route
							path="/stats"
							element={
								<AuthGuard>
									<StatsPage />
								</AuthGuard>
							}
						/>
						<Route
							path="/coach"
							element={
								<AuthGuard>
									<CoachPage />
								</AuthGuard>
							}
						/>
						<Route
							path="/profile"
							element={
								<AuthGuard>
									<ProfilePage />
								</AuthGuard>
							}
						/>
						<Route
							path="/templates"
							element={
								<AuthGuard>
									<TemplateSelector />
								</AuthGuard>
							}
						/>
						<Route
							path="/session/:sessionId"
							element={
								<AuthGuard>
									<SessionWorkoutPage />
								</AuthGuard>
							}
						/>
					</Routes>
				</AnimatePresence>
				<BottomNav />
			</ThemeProvider>
		</AuthProvider>
	);
}

export default App;
