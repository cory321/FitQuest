# AI Coach Prompt Update

## Summary
Updated the AI fitness coach system prompt to incorporate user profile data and refined the coaching approach to match your personal coaching style while staying accurate to FitQuest's actual tracking capabilities.

## Changes Made

### 1. **Context Retriever Enhancement** (`supabase/functions/_shared/context-retriever.ts`)
- Added `includeUserProfile` option to retrieve user profile data
- Fetches user profile from `user_profiles` table including:
  - Name, gender, age
  - Weight (lbs)
  - Height (imperial or metric)
  - Activity level
- Automatically calculates BMI from height and weight data
- Profile data is now included in the context passed to the AI

### 2. **System Prompt Refinement** (`supabase/functions/chat-with-coach/prompts.ts`)
- **Personalization**: Coach addresses user by name from profile
- **Profile Integration**: Incorporates age, weight, height, BMI, and activity level
- **Coaching Tone**: Spartan-clear, no-nonsense, encouraging, purpose-driven
- **Progressive Programming**: 4-phase workout progression model:
  - Phase 1: Building Foundation (form, consistency, baseline)
  - Phase 2: Adding Volume (reps, controlled tempos)
  - Phase 3: Intensification (supersets, density)
  - Phase 4+: Advanced (heavier weights, varied schemes)
- **Pattern Recognition**: Analyzes actual logged data for trends
- **Actionable Guidance**: Specific workout suggestions, hydration (in cups), recovery
- **Clear Boundaries**: Explicitly states what IS and ISN'T tracked
- **No Emojis**: Removed emoji usage per your requirements

### 3. **What the Coach Now Tracks**
✅ Workout sessions (exercises, sets, reps, weight)
✅ Workout templates and usage patterns
✅ Training streaks and consistency
✅ Exercise-specific progress and PRs
✅ User profile (name, age, weight, height, BMI, activity level)

### 4. **What the Coach Does NOT Track (Yet)**
❌ Daily nutrition, meals, or calorie intake
❌ Sleep hours or quality
❌ Energy ratings or mood
❌ Body fat percentage
❌ Hydration adherence

The coach will be honest about these limitations and focus on what it CAN track.

## Key Features

### Personalized Coaching
- Uses user's actual name in responses
- References specific profile metrics (age, weight, BMI)
- Tailors advice based on activity level

### Data-Driven Recommendations
- Only references actual logged workouts (never fabricates data)
- Identifies training patterns and gaps
- Celebrates real achievements (streaks, PRs, consistency)
- Suggests progressive overload based on history

### Communication Style
- Concise (2-4 paragraphs)
- Immediately actionable
- No-nonsense but supportive
- Purpose-driven
- No emojis

### Hydration Goals
- Expressed in cups instead of ounces (e.g., "8-10 cups of water today")

## Example Interactions

**User**: "What should I focus on today?"

**Coach**: Based on your recent training, you've completed 3 upper body sessions in the last 7 days but haven't trained legs since [date]. Today's focus should be a lower body session. I'd recommend your "Leg Day" template with an emphasis on progressive overload—aim to increase weight by 5 lbs on squats or add 2 reps to your working sets. Also, target 8-10 cups of water today to support recovery.

**User**: "How's my progress?"

**Coach**: You're on a 5-day streak—solid consistency. Looking at your bench press over the last month, you've increased from 135 lbs to 150 lbs for 8 reps. That's strong progression. Your workout frequency is averaging 4 sessions per week, which aligns well with your moderate activity level. Keep this momentum going, and consider adding a deload week after 3-4 more weeks of this intensity.

## Deployment Notes

- Edge functions need to be redeployed for changes to take effect
- The TypeScript error for Deno imports is expected and won't affect runtime
- User profile data is automatically included in all coach interactions
- BMI is calculated server-side to ensure accuracy

## Next Steps (Optional Enhancements)

If you want to add the features mentioned in your original prompt:
1. **Meal Tracking**: Add `meal_logs` table
2. **Sleep Tracking**: Add `sleep_logs` table  
3. **Energy Ratings**: Add `daily_metrics` table with energy field
4. **Body Fat %**: Add to `user_profiles` table
5. **Hydration Tracking**: Add `hydration_logs` table
6. **Weekly Schedule**: Add `weekly_plans` table for structured programming

The prompt is structured to easily incorporate these features when they're added to the database.

