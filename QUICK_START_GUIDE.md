# Quick Start Guide - Mobile Calendar

## How to Use the New Mobile Calendar

### Switching Views
At the top of the calendar, you'll see a segmented control with three options:
- **Month** - See the entire month at a glance
- **Week** - See the current week in detail  
- **Day** - See a single day with full workout details

Simply tap any option to switch views. Your preference is automatically saved.

### Month View
- **Grid Layout**: 7 columns (Sun-Sat) × 5-6 rows
- **Workout Badges**: Numbers show how many workouts you did that day
- **Heat Map**: Days with workouts have a colored background (more workouts = darker)
- **Today's Date**: Highlighted with a ring
- **Tap Any Date**: Switches to Day View for that date
- **Navigate**: 
  - Swipe left/right to change months
  - Use arrow buttons
  - Tap "Today" to jump to current month

### Week View
- **Horizontal Layout**: 7 days side by side
- **Day Info**: Shows day name (Mon, Tue) and date number
- **Workout Indicators**:
  - 1-3 workouts: Small dots
  - 4+ workouts: Badge with count
- **Selected Day**: Highlighted with primary color
- **Today's Date**: Special background with ring
- **Tap Any Day**: Switches to Day View for that day
- **Navigate**:
  - Swipe left/right to change weeks
  - Use arrow buttons
  - Tap "Today" to jump to current week

### Day View
- **Header**: Shows the full date (e.g., "Monday, January 15")
- **Quick Actions**: 
  - "Templates" button - Browse workout templates
  - "Add Workout" button - Toggle the add workout form
- **Workout List**: All your workouts for that day
  - Workout Sessions (from templates)
  - Individual Workouts
- **Empty State**: Friendly message when no workouts yet
- **Navigate**:
  - Swipe left/right to change days
  - Use arrow buttons
  - Tap "Today" to jump to current day

### Adding Workouts in Day View
1. Tap the "Add Workout" button
2. Form appears with fields for:
   - Workout Name (required)
   - Reps (optional)
   - Weight in lbs (optional)
3. Fill in the details
4. Tap "💪 Add Workout"
5. Form closes and workout appears in the list

### Deleting Workouts
- Each workout has a trash icon
- Tap the trash icon to delete
- You'll feel haptic feedback
- Workout is immediately removed

### Pro Tips
- **Pull to Refresh**: Pull down on any view to refresh data
- **Haptic Feedback**: Feel vibrations on taps (on supported devices)
- **View Memory**: App remembers your last view preference
- **Swipe Navigation**: Swipe anywhere on the calendar to navigate
- **Quick Day Access**: In Month or Week view, tap any date to jump to Day View

### Gestures Summary
| Gesture | Action |
|---------|--------|
| Tap date/day | Switch to Day View (from Month/Week) |
| Tap "Add Workout" | Toggle add form (in Day View) |
| Swipe Left | Next month/week/day |
| Swipe Right | Previous month/week/day |
| Pull Down | Refresh data |
| Tap "Today" | Jump to current date |
| Tap trash icon | Delete workout |

### Keyboard Shortcuts (Desktop)
- Arrow keys navigate between periods
- Escape closes dialogs
- Tab navigates between form fields

## Technical Details

### Performance
- Views are memoized to prevent unnecessary re-renders
- Data fetching is optimized per view
- Smooth 60fps animations

### Accessibility  
- Minimum 44×44px touch targets
- High contrast colors
- Semantic HTML
- Keyboard navigation support

### Browser Support
- Modern browsers (Chrome, Safari, Firefox, Edge)
- iOS Safari (with haptics)
- Android Chrome (with haptics)
- Works on desktop too!

## Troubleshooting

### Calendar Not Loading
- Check internet connection
- Pull down to refresh
- Check browser console for errors

### Workouts Not Appearing
- Ensure you're viewing the correct date
- Pull to refresh
- Check if you have an active session

### View Not Switching
- Tap the segmented control option again
- Refresh the page
- Clear browser cache

### Swipe Gestures Not Working
- Ensure you're swiping on the calendar area (not the header)
- Swipe with sufficient speed and distance
- Try using arrow buttons instead

## Need Help?
If you encounter any issues:
1. Try refreshing the page
2. Clear browser cache and localStorage
3. Check the browser console for error messages
4. Verify you're using a supported browser

Enjoy your optimized mobile workout tracking experience! 💪

