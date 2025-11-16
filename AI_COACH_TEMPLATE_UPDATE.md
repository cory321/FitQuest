# AI Coach Template Context Update

## Summary

Updated the AI Coach edge functions to provide complete workout template information, including all exercises within each template. Previously, the AI only knew template names and usage statistics, but couldn't answer questions about what exercises are in each template.

## Problem

The AI Coach was receiving:

- ✅ Template names and usage stats (via `get_template_usage_stats`)
- ✅ Completed workout history with exercises
- ❌ **Missing:** The actual exercise lists for each workout template

This meant the AI couldn't answer questions like:

- "What exercises are in my Push Day template?"
- "Which templates include shoulder work?"
- "Should I modify my leg day template to add more quad exercises?"

## Solution

### 1. Updated Context Retriever (`context-retriever.ts`)

Added a new data fetch that retrieves all workout templates with their complete exercise lists:

```typescript
// Get workout templates with exercises
if (options.includeWorkoutTemplates !== false) {
	const { data: templates } = await supabaseClient
		.from('workout_templates')
		.select('id, name, description')
		.eq('user_id', userId)
		.order('name');

	if (templates && templates.length > 0) {
		// Fetch exercises for each template
		const templatesWithExercises = await Promise.all(
			templates.map(async (template) => {
				const { data: exercises } = await supabaseClient
					.from('template_exercises')
					.select(
						'exercise_name, sets, target_reps, target_weight, order_index'
					)
					.eq('template_id', template.id)
					.order('order_index');

				return {
					name: template.name,
					description: template.description,
					exercises: exercises || [],
				};
			})
		);

		context.workoutTemplates = templatesWithExercises;
	} else {
		context.workoutTemplates = [];
	}
}
```

**What this fetches:**

- Template name and description
- All exercises in order (exercise_name, sets, target_reps, target_weight)
- Properly formatted for AI consumption

### 2. Updated System Prompt (`prompts.ts`)

**Added workout templates section:**

```
**{name}'s Workout Templates:**
{JSON of all templates with exercises}
```

**Updated coaching guidance:**

- Can now suggest modifications to existing templates
- Can recommend exercises based on what's already in templates
- Can identify gaps in template coverage

**Updated capability list:**

```
What You Track (Based on FitQuest Data):
- Workout templates with their complete exercise lists (all exercises, sets, reps, weights)
- Completed workout sessions with exercises, sets, reps, and weight
- Workout template usage patterns and statistics
...
```

## Data Structure Example

The AI now receives workout templates in this format:

```json
[
  {
    "name": "Push Day",
    "description": "Upper body push movements",
    "exercises": [
      {
        "exercise_name": "Bench Press",
        "sets": 4,
        "target_reps": 8,
        "target_weight": 185,
        "order_index": 0
      },
      {
        "exercise_name": "Overhead Press",
        "sets": 3,
        "target_reps": 10,
        "target_weight": 95,
        "order_index": 1
      }
      // ... more exercises
    ]
  },
  {
    "name": "Pull Day",
    "description": "Upper body pull movements",
    "exercises": [...]
  }
]
```

## New AI Coach Capabilities

With this update, the AI Coach can now:

✅ **List exercises in templates**

- "What's in my Leg Day template?"
- "Show me my Push Day exercises"

✅ **Suggest template modifications**

- "Should I add more shoulder work to my Upper Body template?"
- "My Push Day feels incomplete, what should I add?"

✅ **Identify training gaps**

- "Which templates focus on legs?"
- "Do any of my templates include back exercises?"

✅ **Compare templates**

- "What's the difference between my Push Day and Upper Body templates?"
- "Which template has more volume?"

✅ **Recommend progressive overload**

- "My Push Day bench press is at 185lbs, what should I aim for next?"
- "How can I progress my squat in my Leg Day template?"

## Deployment

### Files Modified

1. **`supabase/functions/_shared/context-retriever.ts`**

   - Added `includeWorkoutTemplates` option
   - Added template fetching logic
   - Fetches templates + exercises in parallel

2. **`supabase/functions/chat-with-coach/prompts.ts`**
   - Added `workoutTemplates` to destructured context
   - Added workout templates section to system prompt
   - Updated coaching guidance text
   - Updated capability documentation

### To Deploy

Since these are Supabase Edge Functions, you'll need to deploy them:

```bash
# Using Supabase CLI
supabase functions deploy chat-with-coach

# Or deploy all functions
supabase functions deploy
```

### Testing

After deployment, test with questions like:

1. "What exercises are in my [Template Name] template?"
2. "Which of my templates includes [Exercise Name]?"
3. "Should I add more exercises to my [Template Name]?"
4. "Compare my [Template A] and [Template B] templates"

## Performance Considerations

**Query Efficiency:**

- Uses `Promise.all()` to fetch all template exercises in parallel
- Only fetches templates once per chat request
- Minimal impact on response time

**Token Usage:**

- Each template with ~5 exercises adds ~200-300 tokens
- A user with 5 templates: ~1,000-1,500 additional tokens
- Well within Claude's context limits

## Benefits

1. **Better Exercise Recommendations** - AI knows what exercises you already do
2. **Template-Specific Advice** - Can suggest improvements to specific templates
3. **Training Balance Analysis** - Can identify if templates are well-rounded
4. **Progressive Overload Guidance** - Can suggest weight/rep increases based on template targets
5. **Complete Workout Planning** - Can help design new templates based on existing ones

## No Breaking Changes

This is a purely additive change:

- ✅ Existing functionality unchanged
- ✅ Backward compatible (templates default to empty array if none exist)
- ✅ No database migrations required
- ✅ No frontend changes needed

---

**Status:** ✅ Ready to Deploy
**Next Step:** Deploy edge functions to Supabase


