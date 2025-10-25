/**
 * Haptic feedback wrapper for mobile devices
 * Provides tactile feedback for user interactions
 */

type HapticIntensity =
	| 'light'
	| 'medium'
	| 'heavy'
	| 'success'
	| 'warning'
	| 'error';

class HapticFeedback {
	private isSupported: boolean = false;

	constructor() {
		// Check if vibration API is supported
		this.isSupported = 'vibrate' in navigator;
	}

	/**
	 * Trigger a simple haptic feedback
	 */
	trigger(intensity: HapticIntensity = 'medium'): void {
		if (!this.isSupported) return;

		const patterns: Record<HapticIntensity, number | number[]> = {
			light: 10,
			medium: 20,
			heavy: 40,
			success: [10, 50, 10],
			warning: [20, 100, 20],
			error: [50, 100, 50, 100, 50],
		};

		const pattern = patterns[intensity];
		navigator.vibrate(pattern);
	}

	/**
	 * Button press feedback (light tap)
	 */
	buttonPress(): void {
		this.trigger('light');
	}

	/**
	 * Toggle/checkbox feedback (medium tap)
	 */
	toggle(): void {
		this.trigger('medium');
	}

	/**
	 * Delete/destructive action (warning pattern)
	 */
	warning(): void {
		this.trigger('warning');
	}

	/**
	 * Success action completed (success pattern)
	 */
	success(): void {
		this.trigger('success');
	}

	/**
	 * Error occurred (error pattern)
	 */
	error(): void {
		this.trigger('error');
	}

	/**
	 * Workout completed (celebratory pattern)
	 */
	celebration(): void {
		if (!this.isSupported) return;
		navigator.vibrate([40, 80, 40, 80, 60, 100, 60]);
	}

	/**
	 * Milestone achieved (special pattern)
	 */
	milestone(): void {
		if (!this.isSupported) return;
		navigator.vibrate([50, 100, 50, 100, 80, 150, 100]);
	}

	/**
	 * Custom vibration pattern
	 */
	custom(pattern: number | number[]): void {
		if (!this.isSupported) return;
		navigator.vibrate(pattern);
	}

	/**
	 * Stop all vibration
	 */
	stop(): void {
		if (!this.isSupported) return;
		navigator.vibrate(0);
	}
}

// Export singleton instance
export const haptics = new HapticFeedback();
