import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/firebaseConfig'; // Adjust path if necessary
import { WORKOUT_TYPES, WORKOUT_MET_VALUES } from './constants'; // Adjust path if necessary
import { Picker } from '@react-native-picker/picker'; // Standard Picker
import moment from 'moment';

export default function LogWorkoutScreen() {
    const router = useRouter();
    const { user } = useUser();
    const [selectedWorkout, setSelectedWorkout] = useState<string | null>(WORKOUT_TYPES[0] || null); // Default to first type
    const [duration, setDuration] = useState(''); // Duration in minutes as string
    const [estimatedCalories, setEstimatedCalories] = useState(0);
    const [userWeightKg, setUserWeightKg] = useState<number | null>(null);
    const [isLoadingWeight, setIsLoadingWeight] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPickerVisible, setIsPickerVisible] = useState(false); // State for modal visibility

    // Fetch user weight
    useEffect(() => {
        const fetchUserWeight = async () => {
            if (!user) return;
            setIsLoadingWeight(true);
            try {
                const userDocRef = doc(db, 'users', user.id);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const weight = userDocSnap.data()?.weight;
                    if (weight && typeof weight === 'number') {
                        setUserWeightKg(weight);
                    } else {
                         Alert.alert("Missing Info", "Your weight is needed to estimate calories. Please update your profile.");
                        // Optionally navigate to profile or disable saving
                    }
                }
            } catch (error) {
                console.error("Error fetching user weight:", error);
                Alert.alert("Error", "Could not fetch user profile data.");
            } finally {
                setIsLoadingWeight(false);
            }
        };
        fetchUserWeight();
    }, [user]);

    // Calculate estimated calories
    useEffect(() => {
        if (selectedWorkout && duration && userWeightKg) {
            const durationMinutes = parseFloat(duration);
            const metValue = WORKOUT_MET_VALUES[selectedWorkout];
            if (!isNaN(durationMinutes) && durationMinutes > 0 && metValue && userWeightKg > 0) {
                const calories = metValue * userWeightKg * (durationMinutes / 60);
                setEstimatedCalories(Math.round(calories));
            } else {
                setEstimatedCalories(0);
            }
        } else {
            setEstimatedCalories(0);
        }
    }, [selectedWorkout, duration, userWeightKg]);

    const handleSave = async () => {
        if (isSaving || isLoadingWeight) return; // Prevent double taps or saving without weight

        const durationMinutes = parseFloat(duration);

        // Validation
        if (!selectedWorkout) {
            Alert.alert('Missing Info', 'Please select a workout type.');
            return;
        }
        if (isNaN(durationMinutes) || durationMinutes <= 0) {
            Alert.alert('Invalid Duration', 'Please enter a valid duration in minutes (greater than 0).');
            return;
        }
         if (!userWeightKg) {
            Alert.alert("Missing Weight", "Cannot save workout without user weight for calorie calculation.");
            return;
        }
        if (estimatedCalories <= 0) {
             Alert.alert("Invalid Calculation", "Calculated calories seem incorrect. Please check inputs.");
             return;
        }


        setIsSaving(true);
        try {
            const dateId = moment().format('DD-MM-YYYY');
            const userId = user!.id; // User should exist if we got here

            // References
            const workoutCollRef = collection(db, 'users', userId, 'NutritionData', dateId, 'Workouts');
            // Use collection ref to let Firestore generate ID implicitly with addDoc in batch
            const newWorkoutRef = doc(workoutCollRef); // Creates a ref with a unique ID
            const summaryDocRef = doc(db, 'users', userId, 'NutritionData', dateId);

            const workoutData = {
                type: selectedWorkout,
                durationMinutes: durationMinutes,
                caloriesBurned: estimatedCalories,
                createdAt: Timestamp.now(),
            };

            // Use a batch write for atomicity
            const batch = writeBatch(db);

            batch.set(newWorkoutRef, workoutData); // Set the workout doc using the ref with generated ID
            // Update summary: Increment total exercise calories. Creates doc/field if non-existent
            batch.set(summaryDocRef, {
                 // Ensure FieldValue is imported if you use increment
                 // totalCaloriesBurnedExercise: FieldValue.increment(estimatedCalories),
                 // Using set with merge and manual increment is safer if FieldValue isn't readily available/configured
                 updatedAt: Timestamp.now() // Also update timestamp
            }, { merge: true }); // Create or merge summary doc

            // Fetch current summary to manually increment (alternative to FieldValue.increment)
            const summarySnap = await getDoc(summaryDocRef);
            const currentBurned = summarySnap.data()?.totalCaloriesBurnedExercise || 0;
            batch.update(summaryDocRef, {
                totalCaloriesBurnedExercise: currentBurned + estimatedCalories
            });


            await batch.commit();

            Alert.alert('Success', 'Workout logged successfully!');
            router.back(); // Go back to the workouts tab

        } catch (error) {
            console.error("Error saving workout:", error);
            Alert.alert('Error', 'Failed to save workout. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Add this line for debugging:
    console.log('WORKOUT_TYPES:', WORKOUT_TYPES.length > 0 ? `${WORKOUT_TYPES.length} types loaded` : 'EMPTY!');

    return (
        <SafeAreaView style={styles.safeArea}>
             {/* Configure header */}
             <Stack.Screen options={{
                 headerShown: true,
                 headerTitle: "Log Workout",
                 headerLeft: () => (
                     <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                         <Ionicons name="chevron-back" size={24} color="#333" />
                     </TouchableOpacity>
                 ),
                 headerTitleAlign: 'center',
                 headerStyle: { backgroundColor: '#f8f9fa'},
                 headerShadowVisible: false, // No shadow for a cleaner look
            }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    {isLoadingWeight && <ActivityIndicator size="small" color="#FF6B6B" />}

                    {/* Workout Type Button */}
                    <Text style={styles.label}>Workout Type</Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setIsPickerVisible(true)} // Open modal on press
                    >
                        <Text style={styles.pickerButtonText}>
                            {selectedWorkout || 'Select Workout Type'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    {/* Duration Input */}
                    <Text style={styles.label}>Duration (minutes)</Text>
                    <TextInput
                        style={styles.input}
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="numeric"
                        placeholder="e.g., 30"
                        placeholderTextColor="#999"
                    />

                    {/* Estimated Calories */}
                    <View style={styles.calorieDisplay}>
                        <Text style={styles.calorieLabel}>Estimated Calories Burned:</Text>
                        <Text style={styles.calorieValue}>
                            {isLoadingWeight ? '...' : `${estimatedCalories} kcal`}
                        </Text>
                    </View>


                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, (isSaving || isLoadingWeight || !userWeightKg) && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving || isLoadingWeight || !userWeightKg}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Workout</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Picker Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isPickerVisible}
                onRequestClose={() => setIsPickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setIsPickerVisible(false)}
                >
                    {/* Ensure this View doesn't get pressed, allow children */}
                     <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                         <TouchableOpacity
                            style={styles.modalDoneButton}
                            onPress={() => setIsPickerVisible(false)}
                        >
                            <Text style={styles.modalDoneButtonText}>Done</Text>
                        </TouchableOpacity>

                        {/* Wrap Picker in a View */}
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={selectedWorkout}
                                onValueChange={(itemValue) => setSelectedWorkout(itemValue)}
                                style={styles.modalPicker}
                                itemStyle={styles.modalPickerItem} // Apply style with color
                            >
                                {WORKOUT_TYPES.map((type) => (
                                    <Picker.Item key={type} label={type} value={type} />
                                ))}
                            </Picker>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 50, // Ensure space below button
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#444',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        marginBottom: 15,
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 14, // Adjust padding for button appearance
        marginBottom: 15,
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#333',
    },
    calorieDisplay: {
        marginTop: 25,
        paddingVertical: 15,
        paddingHorizontal: 15,
        backgroundColor: '#e9ecef', // Light grey background
        borderRadius: 10,
        alignItems: 'center',
    },
    calorieLabel: {
        fontSize: 14,
        color: '#666',
    },
    calorieValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B6B', // Theme color
        marginTop: 5,
    },
    saveButton: {
        backgroundColor: '#FF6B6B',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    saveButtonDisabled: {
        backgroundColor: '#FFa0a0', // Lighter color when disabled
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20, // More padding for safe area
    },
    modalDoneButton: {
        padding: 15,
        alignItems: 'flex-end',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    modalDoneButtonText: {
        fontSize: 16,
        color: '#FF6B6B',
        fontWeight: '600',
    },
    pickerWrapper: {
        height: 220, // Match the picker height
        width: '100%',
    },
    modalPicker: {
        width: '100%',
        height: '100%', // Fill the wrapper
        color: '#333', // Ensure picker text color isn't white/transparent (Android mainly)
    },
    modalPickerItem: {
        fontSize: 18,
        color: '#000000', // Explicitly set item color to black for iOS test
    },
}); 