# FitQuest Workout Tracker

A simple and elegant workout tracking calendar built with React, Vite, shadcn/ui, and Supabase.

## Features

- 📅 **Calendar View**: Visual monthly calendar to track your workouts
- 💪 **Workout Logging**: Click any day to add workouts with name, reps, and weight
- 📊 **Workout Count**: See at a glance how many workouts you did each day
- 🗑️ **Easy Management**: Delete workouts you've logged
- ☁️ **Cloud Storage**: All data stored in Supabase database

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Calendar**: react-big-calendar
- **Database**: Supabase (PostgreSQL)
- **Date Utilities**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory (or update `src/lib/supabase.ts`):

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **View Calendar**: The main view shows a monthly calendar
2. **Add Workout**: Click on any date to open the workout dialog
3. **Fill Details**:
   - Enter the workout name (required)
   - Optionally add reps and weight in lbs
4. **Save**: Click "Add Workout" to save
5. **View Workouts**: Click on a date with workouts to see what you logged
6. **Delete**: Click the trash icon next to any workout to remove it

## Database Schema

The app uses a single `workouts` table:

```sql
- id: UUID (primary key)
- workout_date: DATE (required)
- workout_name: TEXT (required)
- reps: INTEGER (optional)
- weight_lbs: DECIMAL (optional)
- created_at: TIMESTAMPTZ (auto-generated)
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## License

MIT
