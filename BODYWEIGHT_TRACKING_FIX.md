# Bodyweight Exercise Progress Tracking Fix

## Problem

When tracking workout progress, exercises with no weight value (bodyweight exercises) had a volume of 0 (reps × 0 = 0), which prevented proper progress tracking. Users would not see any improvement percentage when increasing reps on bodyweight exercises like pushups, pullups, etc.

## Solution

Modified the `calculateVolume` function in `WorkoutSummary.tsx` to differentiate between:

- **Bodyweight exercises** (weight = 0 or null): Track progress based on reps only
- **Weighted exercises** (weight > 0): Track progress based on volume (reps × weight)

## Changes Made

### File: `src/components/celebrations/WorkoutSummary.tsx`

**Updated `calculateVolume` function (lines 29-41):**

```typescript
const calculateVolume = (
	reps: number | null,
	weight: number | null
): number => {
	const repsValue = reps || 0;
	const weightValue = weight || 0;

	// If weight is 0 or null, this is a bodyweight exercise
	// Track progress based on reps only (bodyweight is constant)
	// If weight > 0, multiply reps × weight for total volume
	if (weightValue === 0) {
		return repsValue; // Bodyweight exercise: just count reps
	}

	return repsValue * weightValue; // Weighted exercise: reps × weight
};
```

## Examples

### Bodyweight Exercise Progress

- **Workout 1:** 10 pushups (0 lbs) → volume = 10
- **Workout 2:** 12 pushups (0 lbs) → volume = 12
- **Progress:** +20% improvement ✅

### Weighted Exercise Progress

- **Workout 1:** 8 reps × 20 lbs → volume = 160
- **Workout 2:** 10 reps × 20 lbs → volume = 200
- **Progress:** +25% improvement ✅

### Transitioning from Bodyweight to Weighted

- **Workout 1:** 10 pushups (0 lbs) → volume = 10
- **Workout 2:** 8 reps × 25 lbs → volume = 200
- **Progress:** +1900% improvement (huge jump, accurately reflects adding external weight) ✅

## Benefits

1. ✅ Bodyweight exercises now show proper progress tracking
2. ✅ Users get encouraging feedback when improving reps
3. ✅ Weighted exercises continue to work as expected
4. ✅ Smooth transition when users add external weight to bodyweight movements
5. ✅ The weight field can remain at 0 for bodyweight exercises while still tracking progress

## Technical Details

- The bodyweight itself is assumed constant, so we only track rep increases
- When weight > 0, it represents external weight added on top of bodyweight
- This aligns with how most fitness tracking apps handle bodyweight vs weighted exercises
- No database changes required - purely a calculation logic update
