import onboarding1 from "../../assets/images/onboarding1.png";
import onboarding2 from "../..//assets/images/onboarding2.png";
import onboarding3 from "../..//assets/images/onboarding3.png";

export const images = {
  onboarding1,
  onboarding2,
  onboarding3,
};

export const onboarding = [
  {
    id: 1,
    title: "Eat Healthy and stay Fit",
    description:
      "Maintaining good health should be your first priority",
    image: images.onboarding1,
  },
  {
    id: 2,
    title: "Track your health effortlessly",
    description:
      "Discover relentless tools to maintain a good health with us",
    image: images.onboarding2,
  },
  {
    id: 3,
    title: "Wanna start ?? Let's go!",
    description:
      "Enter your goals, sit back, and let us take care of the rest.",
    image: images.onboarding3,
  },
];

export const data = {
  onboarding,
};

// --- Workout Constants ---

/**
 * Approximate Metabolic Equivalent of Task (MET) values for common activities.
 * MET values represent the energy cost relative to resting metabolism (1 MET).
 * Source: Compendium of Physical Activities (Ainsworth et al.) and general fitness data.
 * Note: These are averages; actual energy expenditure can vary.
 */
export const WORKOUT_MET_VALUES: { [key: string]: number } = {
  // Walking
  'Walking (2.5 mph, slow pace)': 2.8,
  'Walking (3.0 mph, moderate pace)': 3.3,
  'Walking (3.5 mph, brisk pace)': 3.8,
  'Walking (4.0 mph, very brisk pace)': 5.0,
  'Walking (uphill, 5% grade)': 6.0,
  'Hiking (cross-country)': 6.0,

  // Running
  'Running (5 mph, 12 min/mile)': 8.3,
  'Running (6 mph, 10 min/mile)': 10.0,
  'Running (7 mph, 8.5 min/mile)': 11.0,
  'Running (8 mph, 7.5 min/mile)': 12.8,

  // Cycling
  'Cycling (leisure, <10 mph)': 4.0,
  'Cycling (moderate, 12-14 mph)': 8.0,
  'Cycling (vigorous, 14-16 mph)': 10.0,
  'Stationary Cycling (moderate)': 7.0,
  'Stationary Cycling (vigorous)': 10.5,

  // Swimming
  'Swimming (leisurely)': 5.8,
  'Swimming (freestyle, moderate)': 7.0,
  'Swimming (freestyle, vigorous)': 10.0,
  'Swimming (backstroke)': 4.8,
  'Swimming (breaststroke)': 5.3,

  // Strength Training
  'Weight Lifting (general, moderate effort)': 3.5,
  'Weight Lifting (vigorous effort)': 6.0,
  'Circuit Training (general)': 8.0,
  'Bodyweight Exercises (moderate, e.g., pushups, situps)': 3.8,
  'Bodyweight Exercises (vigorous, e.g., burpees)': 8.0,

  // Sports
  'Basketball (game)': 8.0,
  'Soccer (casual)': 7.0,
  'Tennis (singles)': 8.0,
  'Tennis (doubles)': 6.0,

  // Other Activities
  'Yoga (Hatha)': 2.5,
  'Yoga (Power/Vinyasa)': 4.0,
  'Pilates': 3.0,
  'Elliptical Trainer (moderate)': 5.0,
  'Rowing Machine (moderate)': 7.0,
  'Dancing (moderate, e.g., ballroom)': 4.5,
  'Dancing (vigorous, e.g., aerobic)': 7.0,
  'Gardening (general)': 3.8,
};

/**
 * An array of workout type names, derived from WORKOUT_MET_VALUES.
 * Useful for populating selection inputs (Pickers, Dropdowns).
 */
export const WORKOUT_TYPES = Object.keys(WORKOUT_MET_VALUES).sort();

// --- End Workout Constants ---
