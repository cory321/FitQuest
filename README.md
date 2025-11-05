# FitQuest Workout Tracker

A mobile-optimized workout tracking app with AI-powered coaching, built with React, Vite, shadcn/ui, and Supabase.

## Features

- 📅 **Smart Calendar**: Month, week, and day views to track your workouts
- 💪 **Workout Logging**: Log workouts with templates or manual entries
- 🤖 **AI Fitness Coach**: Chat with Claude AI for personalized workout insights
- 📊 **Progress Tracking**: Track streaks, completion rates, and workout history
- 🎯 **Workout Templates**: Create and reuse custom workout templates
- 🔐 **Secure Authentication**: User accounts with Supabase Auth
- ☁️ **Cloud Storage**: All data securely stored in Supabase database
- 🎨 **Beautiful UI**: iOS-inspired design with dark/light mode

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Anthropic Claude 3.5 Sonnet via Supabase Edge Functions
- **Date Utilities**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (create one at [supabase.com](https://supabase.com))
- Anthropic API key (get one at [anthropic.com](https://console.anthropic.com))

### Installation

1. Clone the repository

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:

   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run database migrations (all migrations are in the Supabase dashboard or via MCP tools):

   - Migration: `add_user_id_columns`
   - Migration: `enable_rls_and_policies`
   - Migration: `create_ai_coach_tables`
   - Migration: `create_workout_query_functions`

5. Deploy Supabase Edge Function:

   ```bash
   # Install Supabase CLI if not already installed
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link to your project
   supabase link --project-ref YOUR_PROJECT_REF

   # Deploy the Edge Function
   supabase functions deploy chat-with-coach

   # Set the Anthropic API key secret
   supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open your browser and navigate to `http://localhost:5173`

8. Create an account using the sign-up page

## Usage

### Authentication

1. Sign up for an account or log in
2. All your data is private and secured with Row Level Security

### Workout Tracking

1. **Calendar Views**: Switch between month, week, and day views
2. **Add Workouts**: Manual entry or use templates
3. **Track Progress**: View streaks and completion statistics
4. **Templates**: Create reusable workout routines

### AI Fitness Coach

1. Navigate to the **Coach** tab in the bottom navigation
2. Ask questions like:
   - "How has my progress been this month?"
   - "What should I focus on next?"
   - "Analyze my workout streak"
   - "Suggest a new workout routine"
3. Get personalized insights based on your actual workout data
4. Limited to 100 requests per hour per user

## Database Schema

### Core Tables

- `workouts` - Individual workout entries
- `workout_sessions` - Template-based workout sessions
- `workout_templates` - Reusable workout templates
- `template_exercises` - Exercises in templates
- `session_exercises` - Exercises in sessions

### AI Coach Tables

- `chat_conversations` - Chat conversation threads
- `chat_messages` - Individual messages
- `ai_audit_logs` - AI interaction logs
- `ai_rate_limits` - Rate limiting tracking

### Security

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Secure stored procedures for AI data retrieval

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

### Frontend

Deploy to Vercel, Netlify, or any static hosting service:

1. Set environment variables in your hosting platform
2. Build and deploy

### Edge Functions

Already deployed via Supabase CLI (see installation step 5)

### Security Checklist

- ✅ RLS enabled on all tables
- ✅ User authentication required
- ✅ Rate limiting (100 requests/hour)
- ✅ Audit logging for all AI interactions
- ✅ Secure stored procedures (no direct SQL from AI)
- ✅ API keys stored as secrets

## Cost Estimation

For 1000 active users:

- **Anthropic Claude API**: ~$800/month (50 messages/user/month)
- **Supabase**: Free tier (sufficient for database + edge functions)
- **Total**: ~$800/month or $0.80 per user

## Architecture

### Authentication Flow

1. User signs up/logs in via Supabase Auth
2. JWT token stored in browser
3. All API calls include authentication token
4. RLS policies enforce data isolation

### AI Coach Flow

1. User sends message via chat interface
2. Frontend calls Supabase Edge Function with JWT
3. Edge Function validates user and checks rate limit
4. Retrieves user workout context via secure stored procedures
5. Calls Claude API with user context
6. Logs interaction and returns response

### Security Features

- **No Direct SQL**: AI uses predefined stored procedures only
- **Input Validation**: All user inputs sanitized
- **Rate Limiting**: Prevents abuse (100 req/hour)
- **Audit Logging**: All AI interactions logged
- **RLS**: Database-level security for all tables

## License

MIT
