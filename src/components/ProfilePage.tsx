import { useState, useEffect, useMemo } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { User, Settings, Info, Save, X, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SegmentedControl } from './ui/segmented-control';
import { supabase, type UserProfile } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function ProfilePage() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// Form state
	const [name, setName] = useState('');
	const [gender, setGender] = useState<'male' | 'female'>('male');
	const [age, setAge] = useState('');
	const [weightLbs, setWeightLbs] = useState('');
	const [heightUnit, setHeightUnit] = useState<'imperial' | 'metric'>('imperial');
	const [heightFeet, setHeightFeet] = useState('');
	const [heightInches, setHeightInches] = useState('');
	const [heightCm, setHeightCm] = useState('');
	const [activityLevel, setActivityLevel] = useState<'sedentary' | 'moderate' | 'athletic'>('moderate');

	// Original state for comparison
	const [originalProfile, setOriginalProfile] = useState<Partial<UserProfile> | null>(null);

	// Load user profile
	useEffect(() => {
		if (!user) return;

		const loadProfile = async () => {
			setLoading(true);
			setError(null);

			try {
				const { data, error: fetchError } = await supabase
					.from('user_profiles')
					.select('*')
					.eq('user_id', user.id)
					.single();

				if (fetchError && fetchError.code !== 'PGRST116') {
					// PGRST116 means no rows returned (profile doesn't exist yet)
					throw fetchError;
				}

				if (data) {
					setName(data.name || '');
					setGender(data.gender || 'male');
					setAge(data.age?.toString() || '');
					setWeightLbs(data.weight_lbs?.toString() || '');
					setHeightUnit(data.height_unit || 'imperial');
					setHeightFeet(data.height_feet?.toString() || '');
					setHeightInches(data.height_inches?.toString() || '');
					setHeightCm(data.height_cm?.toString() || '');
					setActivityLevel(data.activity_level || 'moderate');
					setOriginalProfile(data);
				}
			} catch (err) {
				console.error('Error loading profile:', err);
				setError('Failed to load profile data');
			} finally {
				setLoading(false);
			}
		};

		loadProfile();
	}, [user]);

	// Track changes
	useEffect(() => {
		if (!originalProfile && !name && !age && !weightLbs && !heightFeet && !heightInches && !heightCm) {
			setHasChanges(false);
			return;
		}

		const changed =
			name !== (originalProfile?.name || '') ||
			gender !== (originalProfile?.gender || 'male') ||
			age !== (originalProfile?.age?.toString() || '') ||
			weightLbs !== (originalProfile?.weight_lbs?.toString() || '') ||
			heightUnit !== (originalProfile?.height_unit || 'imperial') ||
			heightFeet !== (originalProfile?.height_feet?.toString() || '') ||
			heightInches !== (originalProfile?.height_inches?.toString() || '') ||
			heightCm !== (originalProfile?.height_cm?.toString() || '') ||
			activityLevel !== (originalProfile?.activity_level || 'moderate');

		setHasChanges(changed);
	}, [name, gender, age, weightLbs, heightUnit, heightFeet, heightInches, heightCm, activityLevel, originalProfile]);

	// Calculate BMI
	const bmi = useMemo(() => {
		const weight = parseFloat(weightLbs);
		let heightInInches = 0;

		if (heightUnit === 'imperial') {
			const feet = parseFloat(heightFeet) || 0;
			const inches = parseFloat(heightInches) || 0;
			heightInInches = feet * 12 + inches;
		} else {
			const cm = parseFloat(heightCm) || 0;
			heightInInches = cm / 2.54; // Convert cm to inches
		}

		if (weight > 0 && heightInInches > 0) {
			return (weight / (heightInInches * heightInInches)) * 703;
		}

		return null;
	}, [weightLbs, heightUnit, heightFeet, heightInches, heightCm]);

	const bmiCategory = useMemo(() => {
		if (!bmi) return null;
		if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
		if (bmi < 25) return { label: 'Normal', color: 'text-green-600' };
		if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-600' };
		return { label: 'Obese', color: 'text-red-600' };
	}, [bmi]);

	// Handle height unit conversion
	const handleHeightUnitChange = (unit: 'imperial' | 'metric') => {
		if (unit === heightUnit) return;

		if (unit === 'metric') {
			// Convert imperial to metric
			const feet = parseFloat(heightFeet) || 0;
			const inches = parseFloat(heightInches) || 0;
			const totalInches = feet * 12 + inches;
			const cm = totalInches * 2.54;
			setHeightCm(cm > 0 ? cm.toFixed(1) : '');
		} else {
			// Convert metric to imperial
			const cm = parseFloat(heightCm) || 0;
			const totalInches = cm / 2.54;
			const feet = Math.floor(totalInches / 12);
			const inches = Math.round(totalInches % 12);
			setHeightFeet(feet > 0 ? feet.toString() : '');
			setHeightInches(inches > 0 ? inches.toString() : '');
		}

		setHeightUnit(unit);
	};

	const handleSave = async () => {
		if (!user) return;

		setSaving(true);
		setError(null);
		setSuccess(false);

		try {
			const profileData = {
				user_id: user.id,
				name: name || null,
				gender: gender || null,
				age: age ? parseInt(age) : null,
				weight_lbs: weightLbs ? parseFloat(weightLbs) : null,
				height_unit: heightUnit,
				height_feet: heightUnit === 'imperial' && heightFeet ? parseInt(heightFeet) : null,
				height_inches: heightUnit === 'imperial' && heightInches ? parseInt(heightInches) : null,
				height_cm: heightUnit === 'metric' && heightCm ? parseFloat(heightCm) : null,
				activity_level: activityLevel || null,
			};

			const { data, error: upsertError } = await supabase
				.from('user_profiles')
				.upsert(profileData, { onConflict: 'user_id' })
				.select()
				.single();

			if (upsertError) throw upsertError;

			setOriginalProfile(data);
			setSuccess(true);
			setHasChanges(false);

			// Clear success message after 3 seconds
			setTimeout(() => setSuccess(false), 3000);
		} catch (err) {
			console.error('Error saving profile:', err);
			setError('Failed to save profile. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		if (originalProfile) {
			setName(originalProfile.name || '');
			setGender(originalProfile.gender || 'male');
			setAge(originalProfile.age?.toString() || '');
			setWeightLbs(originalProfile.weight_lbs?.toString() || '');
			setHeightUnit(originalProfile.height_unit || 'imperial');
			setHeightFeet(originalProfile.height_feet?.toString() || '');
			setHeightInches(originalProfile.height_inches?.toString() || '');
			setHeightCm(originalProfile.height_cm?.toString() || '');
			setActivityLevel(originalProfile.activity_level || 'moderate');
		} else {
			setName('');
			setGender('male');
			setAge('');
			setWeightLbs('');
			setHeightUnit('imperial');
			setHeightFeet('');
			setHeightInches('');
			setHeightCm('');
			setActivityLevel('moderate');
		}
		setHasChanges(false);
		setError(null);
	};

	return (
		<div className="min-h-screen bg-background pb-24">
			{/* Header */}
			<div className="bg-card border-b sticky top-0 z-10 shadow-sm">
				<div className="max-w-4xl mx-auto p-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
								<User className="h-7 w-7 sm:h-9 sm:w-9 text-primary" />
								Profile
							</h1>
							<p className="text-sm sm:text-base text-muted-foreground mt-1">
								Manage your account
							</p>
						</div>
						<ThemeToggle />
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-4xl mx-auto p-4 space-y-4">
				{/* Settings Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Profile Settings
						</CardTitle>
					</CardHeader>
					<CardContent>
						{loading ? (
							<div className="text-center py-8 text-muted-foreground">
								Loading profile...
							</div>
						) : (
							<div className="space-y-6">
								{/* Personal Information */}
								<div className="space-y-4">
									<h3 className="text-lg font-semibold">Personal Information</h3>
									
									<div className="space-y-2">
										<Label htmlFor="name">Name</Label>
										<Input
											id="name"
											type="text"
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder="Enter your name"
										/>
									</div>

								<div className="space-y-2">
									<Label>Gender</Label>
									<SegmentedControl
										value={gender}
										onChange={(value) => setGender(value as 'male' | 'female')}
										options={[
											{ value: 'male', label: 'Male' },
											{ value: 'female', label: 'Female' },
										]}
									/>
								</div>

									<div className="space-y-2">
										<Label htmlFor="age">Age</Label>
										<Input
											id="age"
											type="number"
											value={age}
											onChange={(e) => setAge(e.target.value)}
											placeholder="Enter your age"
											min="1"
											max="150"
										/>
									</div>
								</div>

								{/* Body Metrics */}
								<div className="space-y-4 pt-6 border-t">
									<h3 className="text-lg font-semibold">Body Metrics</h3>
									
									<div className="space-y-2">
										<Label htmlFor="weight">Weight (lbs)</Label>
										<Input
											id="weight"
											type="number"
											value={weightLbs}
											onChange={(e) => setWeightLbs(e.target.value)}
											placeholder="Enter your weight"
											min="0"
											step="0.1"
										/>
									</div>

								<div className="space-y-2">
									<Label>Height Unit</Label>
									<SegmentedControl
										value={heightUnit}
										onChange={(value) => handleHeightUnitChange(value as 'imperial' | 'metric')}
										options={[
											{ value: 'imperial', label: 'Feet/Inches' },
											{ value: 'metric', label: 'Centimeters' },
										]}
									/>
								</div>

									{heightUnit === 'imperial' ? (
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="height-feet">Feet</Label>
												<Input
													id="height-feet"
													type="number"
													value={heightFeet}
													onChange={(e) => setHeightFeet(e.target.value)}
													placeholder="Feet"
													min="0"
													max="8"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="height-inches">Inches</Label>
												<Input
													id="height-inches"
													type="number"
													value={heightInches}
													onChange={(e) => setHeightInches(e.target.value)}
													placeholder="Inches"
													min="0"
													max="11"
												/>
											</div>
										</div>
									) : (
										<div className="space-y-2">
											<Label htmlFor="height-cm">Height (cm)</Label>
											<Input
												id="height-cm"
												type="number"
												value={heightCm}
												onChange={(e) => setHeightCm(e.target.value)}
												placeholder="Enter your height in centimeters"
												min="0"
												max="300"
												step="0.1"
											/>
										</div>
									)}

									{/* BMI Display */}
									{bmi && (
										<div className="p-4 bg-muted rounded-lg space-y-1">
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">BMI</span>
												<span className="text-2xl font-bold">{bmi.toFixed(1)}</span>
											</div>
											{bmiCategory && (
												<div className="flex items-center justify-between">
													<span className="text-sm text-muted-foreground">Category</span>
													<span className={`text-sm font-semibold ${bmiCategory.color}`}>
														{bmiCategory.label}
													</span>
												</div>
											)}
										</div>
									)}
								</div>

								{/* Activity Level */}
							<div className="space-y-4 pt-6 border-t">
								<h3 className="text-lg font-semibold flex items-center gap-2">
									<Activity className="h-5 w-5" />
									Activity Level
								</h3>
								<SegmentedControl
									value={activityLevel}
									onChange={(value) => setActivityLevel(value as 'sedentary' | 'moderate' | 'athletic')}
									options={[
										{ value: 'sedentary', label: 'Sedentary' },
										{ value: 'moderate', label: 'Moderate' },
										{ value: 'athletic', label: 'Athletic' },
									]}
								/>
							</div>

								{/* Error/Success Messages */}
								{error && (
									<div className="p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg text-sm">
										{error}
									</div>
								)}
								{success && (
									<div className="p-3 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-lg text-sm">
										Profile saved successfully!
									</div>
								)}

								{/* Action Buttons */}
								<div className="flex gap-3 pt-4">
									<Button
										onClick={handleSave}
										disabled={!hasChanges || saving}
										className="flex-1"
									>
										<Save className="h-4 w-4 mr-2" />
										{saving ? 'Saving...' : 'Save Changes'}
									</Button>
									<Button
										onClick={handleCancel}
										disabled={!hasChanges || saving}
										variant="outline"
									>
										<X className="h-4 w-4 mr-2" />
										Cancel
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* About Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Info className="h-5 w-5" />
							About FitQuest
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-muted-foreground">
							FitQuest is your personal workout tracking companion, designed to
							make fitness tracking engaging and rewarding.
						</p>
						<div className="pt-3 border-t">
							<p className="text-sm text-muted-foreground">Version 1.0.0</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
