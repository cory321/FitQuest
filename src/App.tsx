import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { WorkoutCalendar } from './components/WorkoutCalendar';
import { TemplateSelector } from './components/TemplateSelector';
import { SessionWorkoutPage } from './components/SessionWorkoutPage';
import { StatsPage } from './components/StatsPage';
import { ProfilePage } from './components/ProfilePage';
import { ThemeProvider } from './components/ThemeProvider';
import { BottomNav } from './components/BottomNav';
import './App.css';

function App() {
	const location = useLocation();

	return (
		<ThemeProvider>
			<AnimatePresence mode="wait" initial={false}>
				<Routes location={location} key={location.pathname}>
					<Route path="/" element={<WorkoutCalendar />} />
					<Route path="/stats" element={<StatsPage />} />
					<Route path="/profile" element={<ProfilePage />} />
					<Route path="/templates" element={<TemplateSelector />} />
					<Route path="/session/:sessionId" element={<SessionWorkoutPage />} />
				</Routes>
			</AnimatePresence>
			<BottomNav />
		</ThemeProvider>
	);
}

export default App;
