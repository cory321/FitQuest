# AI Coach Template Generator Implementation

## Summary

Successfully implemented the ability for the AI Coach to suggest new workout templates and automatically generate copy-pasteable JSON for easy import into the template builder.

## Changes Made

### 1. Updated System Prompt (`prompts.ts`)

Added a new "Template Creation Capability" section to the AI Coach system prompt with:

- Clear workflow for template creation
- Detailed JSON format specification
- JSON generation rules matching the exact format required by `JsonTemplateImport.tsx`
- Automatic JSON generation after user acceptance (no permission needed)
- User-friendly instructions to copy/paste into Templates → Import from JSON

### 2. Deployment

Successfully deployed edge function `chat-with-coach`:

- Version: 7 → 8
- Status: ACTIVE
- Timestamp: 2025-11-05

## How It Works

### User Workflow

1. User asks AI Coach for a new template:

   - "I need a new push day template"
   - "Create a leg day focused on strength"
   - "My pull day is getting stale, design a new one"

2. AI Coach discusses the template plan with rationale based on:

   - User's current templates
   - Training history and logged weights
   - Goals and training patterns

3. When user accepts the plan, AI automatically generates valid JSON:

```json
{
	"name": "Template Name",
	"description": "Brief description",
	"exercises": [
		{
			"exercise_name": "Exercise Name",
			"sets": 3,
			"target_reps": 10,
			"target_weight": 135,
			"order_index": 0
		}
	]
}
```

4. User copies JSON and pastes into Templates → Import from JSON

### AI Coach Capabilities

The AI Coach now:

- Analyzes user's existing templates and workout history
- Suggests templates tailored to user's strength levels
- Bases weight recommendations on actual logged data
- Generates valid JSON matching exact import requirements
- Provides clear instructions for importing the template

### JSON Format Requirements

The generated JSON must match these specifications:

**Required fields:**

- `name`: String (concise, descriptive)
- `exercises`: Array (minimum 1 exercise)

**Optional fields:**

- `description`: String (template purpose/focus)

**Exercise structure:**

- `exercise_name`: String (required)
- `sets`: Positive integer (required)
- `target_reps`: Integer or null (null for holds/planks)
- `target_weight`: Number or null (null for bodyweight exercises)
- `order_index`: Integer starting from 0 (must increment sequentially)

## Testing Suggestions

Try these prompts with the AI Coach:

1. **Beginner Templates:**

   - "I need a beginner full body workout template"
   - "Create a simple 3-day split for me"

2. **Specific Focus:**

   - "Design a leg day template focused on hypertrophy"
   - "I need a push day template emphasizing shoulders"

3. **Progressive Templates:**

   - "Create a more advanced version of my current Push Day"
   - "My squat is at 225lbs, design a strength-focused leg day"

4. **Specialized Templates:**
   - "Create a mobility and recovery day template"
   - "I want a quick 30-minute upper body template"

## Benefits

1. **Personalized Recommendations:** AI bases suggestions on actual user data
2. **Smart Weight Selection:** Uses logged workout history for weight targets
3. **Seamless Integration:** JSON format matches existing import functionality
4. **No Manual Typing:** Copy/paste workflow is fast and error-free
5. **Progressive Planning:** AI can create templates for different training phases

## Files Modified

- `supabase/functions/chat-with-coach/prompts.ts` - Added template generation capability

## Deployment Status

✅ Edge function deployed successfully
✅ Version 8 active and ready to use
✅ No frontend changes required
✅ No database migrations required

## Example Interaction

**User:** "I need a new push day template focused on strength"

**AI Coach:** "Based on your current bench press at 185lbs and overhead press at 95lbs, I'll design a strength-focused push day with compound movements and progressive overload in the 4-6 rep range. This template will complement your existing templates and focus on building raw pressing power.

Here's your new template:

```json
{
	"name": "Push Day - Strength Focus",
	"description": "Heavy compound pressing with progressive overload for building strength",
	"exercises": [
		{
			"exercise_name": "Barbell Bench Press",
			"sets": 5,
			"target_reps": 5,
			"target_weight": 195,
			"order_index": 0
		},
		{
			"exercise_name": "Overhead Press",
			"sets": 4,
			"target_reps": 5,
			"target_weight": 100,
			"order_index": 1
		},
		{
			"exercise_name": "Incline Dumbbell Press",
			"sets": 4,
			"target_reps": 6,
			"target_weight": 70,
			"order_index": 2
		},
		{
			"exercise_name": "Weighted Dips",
			"sets": 3,
			"target_reps": 6,
			"target_weight": 25,
			"order_index": 3
		},
		{
			"exercise_name": "Tricep Pushdowns",
			"sets": 3,
			"target_reps": 10,
			"target_weight": 80,
			"order_index": 4
		}
	]
}
```

Copy the JSON above and paste it into Templates → Import from JSON to add this template to your collection."

---

**Status:** ✅ Complete and Deployed
**Next Steps:** Test with various template requests and gather feedback


