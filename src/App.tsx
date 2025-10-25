import { Routes, Route } from 'react-router-dom';
import { WorkoutCalendar } from './components/WorkoutCalendar';
import { TemplateSelector } from './components/TemplateSelector';
import { SessionWorkoutPage } from './components/SessionWorkoutPage';
import { ThemeProvider } from './components/ThemeProvider';
import './App.css';

function App() {
	return (
		<ThemeProvider>
			<Routes>
				<Route path="/" element={<WorkoutCalendar />} />
				<Route path="/templates" element={<TemplateSelector />} />
				<Route path="/session/:sessionId" element={<SessionWorkoutPage />} />
			</Routes>
		</ThemeProvider>
	);
}

export default App;
