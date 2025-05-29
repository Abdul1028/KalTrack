import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Dimensions, 
  Alert, ActivityIndicator, Platform, TouchableOpacity, ScrollView, KeyboardAvoidingView 
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

export default function Setup() {
  const { user } = useUser();
  const router = useRouter();
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('male');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [activityLevel, setActivityLevel] = useState<string>('sedentary');
  const [goal, setGoal] = useState<string>('weight_loss');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkUserData();
  }, [user]);

  const checkUserData = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          router.replace("/(tabs)/home");
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1 && !age) {
      Alert.alert("Ahh Ahh! ", "Please enter your age.");
      return;
    }
    if (currentStep === 2 && !gender) {
      Alert.alert("Ahh Ahh! ", "Please select your gender.");
      return;
    }
    if (currentStep === 3 && !weight) {
      Alert.alert("Ahh Ahh! ", "Please enter your weight.");
      return;
    }
    if (currentStep === 4 && !height) {
      Alert.alert("Ahh Ahh! ", "Please enter your height.");
      return;
    }
    if (currentStep === 5 && !activityLevel) {
      Alert.alert("Ahh Ahh! ", "Please select your activity level.");
      return;
    }
    if (currentStep === 6 && !goal) {
      Alert.alert("Ahh Ahh! ", "Please select your goal.");
      return;
    }

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      if (!user) return;
      try {
        // Get user's email from Clerk
        const userEmail = user.emailAddresses[0]?.emailAddress || '';

        // Calculate BMI
        const heightInMeters = parseFloat(height) / 100;
        const weightInKg = parseFloat(weight);
        const bmi = weightInKg / (heightInMeters * heightInMeters);

        // Calculate BMR using Harris-Benedict equation
        let bmr;
        if (gender === 'male') {
          bmr = 88.362 + (13.397 * weightInKg) + (4.799 * parseFloat(height)) - (5.677 * parseInt(age));
        } else {
          bmr = 447.593 + (9.247 * weightInKg) + (3.098 * parseFloat(height)) - (4.330 * parseInt(age));
        }

        // Calculate maintenance calories based on activity level
        let activityMultiplier;
        switch (activityLevel) {
          case 'sedentary':
            activityMultiplier = 1.2;
            break;
          case 'light':
            activityMultiplier = 1.375;
            break;
          case 'moderate':
            activityMultiplier = 1.55;
            break;
          case 'active':
            activityMultiplier = 1.725;
            break;
          case 'very_active':
            activityMultiplier = 1.9;
            break;
          default:
            activityMultiplier = 1.2;
        }

        const maintenanceCalories = bmr * activityMultiplier;

        // Adjust target calories based on goal
        let targetCalories = maintenanceCalories;
        switch (goal) {
          case 'weight_loss':
            targetCalories = maintenanceCalories - 500; // 500 calorie deficit
            break;
          case 'weight_gain':
            targetCalories = maintenanceCalories + 500; // 500 calorie surplus
            break;
          // maintain stays the same as maintenance
        }

        // Save all data to Firebase with email
        await setDoc(doc(db, 'users', user.id), {
          email: userEmail, // Add email field
          age: parseInt(age),
          gender,
          weight: parseFloat(weight),
          height: parseFloat(height),
          activityLevel,
          userGoal:goal,
          bmi: Math.round(bmi * 10) / 10,
          bmr: Math.round(bmr),
          maintenanceCalories: Math.round(maintenanceCalories),
          targetCalories: Math.round(targetCalories),
          caloriesConsumed: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        router.replace("/(tabs)/home");
      } catch (error) {
        console.error("Error saving data:", error);
        Alert.alert("Error", "Failed to save your information");
      }
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <LinearGradient
          colors={['#ffffff', '#fff5f5']}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { width: `${(currentStep / 6) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.stepText}>Step {currentStep} of 6</Text>
            </View>

            <View style={styles.cardWrapper}>
              <Animated.View 
                entering={SlideInRight}
                style={styles.mainCard}
              >
                <View style={styles.contentContainer}>
                  {currentStep === 1 && (
                    <Animated.View entering={FadeIn} style={styles.stepContent}>
                      <LottieView
                        source={require('../assets/animations/hourglass.json')}
                        autoPlay
                        loop
                        style={styles.lottie}
                      />
                      <Text style={styles.title}>How old are you?</Text>
                      <Text style={styles.subtitle}>This helps us personalize your experience</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={age}
                          onChangeText={setAge}
                          placeholder="Your age"
                          placeholderTextColor="#999"
                          maxLength={2}
                          returnKeyType="done"
                        />
                        <Text style={styles.inputLabel}>years</Text>
                      </View>
                    </Animated.View>
                  )}

                  {currentStep === 2 && (
                    <Animated.View entering={FadeIn} style={styles.stepContent}>
                      <LottieView
                        source={require('../assets/animations/gender.json')}
                        autoPlay
                        loop
                        style={styles.lottie}
                      />
                      <Text style={styles.title}>Select your gender</Text>
                      <View style={styles.genderContainer}>
                        {[
                          { id: 'male', icon: 'male-outline', label: 'Male' },
                          { id: 'female', icon: 'female-outline', label: 'Female' }
                        ].map((option) => (
                          <TouchableOpacity
                            key={option.id}
                            style={[
                              styles.genderOption,
                              gender === option.id && styles.selectedGender
                            ]}
                            onPress={() => setGender(option.id)}
                          >
                            <Ionicons
                              name={option.icon as any}
                              size={32}
                              color={gender === option.id ? '#FF6B6B' : '#666'}
                            />
                            <Text style={[
                              styles.genderLabel,
                              gender === option.id && styles.selectedLabel
                            ]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </Animated.View>
                  )}

                  {currentStep === 3 && (
                    <Animated.View entering={FadeIn} style={styles.stepContent}>
                      <LottieView
                        source={require('../assets/animations/weight.json')}
                        autoPlay
                        loop
                        style={styles.lottie}
                      />
                      <Text style={styles.title}>What's your weight?</Text>
                      <Text style={styles.subtitle}>You can always change this later</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={weight}
                          onChangeText={setWeight}
                          placeholder="Your weight"
                          placeholderTextColor="#999"
                          maxLength={3}
                          returnKeyType="done"
                        />
                        <Text style={styles.inputLabel}>kg</Text>
                      </View>
                    </Animated.View>
                  )}

                  {currentStep === 4 && (
                    <Animated.View entering={FadeIn} style={styles.stepContent}>
                      <LottieView
                        source={require('../assets/animations/height.json')}
                        autoPlay
                        loop
                        style={styles.lottie}
                      />
                      <Text style={styles.title}>What's your height?</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={height}
                          onChangeText={setHeight}
                          placeholder="Your height"
                          placeholderTextColor="#999"
                          maxLength={3}
                          returnKeyType="done"
                        />
                        <Text style={styles.inputLabel}>cm</Text>
                      </View>
                    </Animated.View>
                  )}

                  {currentStep === 5 && (
                    <Animated.View entering={FadeIn} style={styles.stepContent}>
                      <Text style={styles.title}>Activity Level</Text>
                      <Text style={styles.subtitle}>Select your typical activity level</Text>
                      <ScrollView 
                        style={styles.activityScrollContainer}
                        contentContainerStyle={styles.activityContentContainer}
                        showsVerticalScrollIndicator={false}
                      >
                        {[
                          { id: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                          { id: 'light', label: 'Light', desc: '1-3 days/week' },
                          { id: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
                          { id: 'active', label: 'Active', desc: '6-7 days/week' },
                          { id: 'very_active', label: 'Very Active', desc: 'Professional athlete' }
                        ].map((option) => (
                          <TouchableOpacity
                            key={option.id}
                            style={[
                              styles.activityOption,
                              activityLevel === option.id && styles.selectedActivity
                            ]}
                            onPress={() => setActivityLevel(option.id)}
                          >
                            <View style={styles.activityInfo}>
                              <Text style={[
                                styles.activityLabel,
                                activityLevel === option.id && styles.selectedActivityText
                              ]}>
                                {option.label}
                              </Text>
                              <Text style={styles.activityDesc}>{option.desc}</Text>
                            </View>
                            {activityLevel === option.id && (
                              <Ionicons 
                                name="checkmark-circle" 
                                size={24} 
                                color="#FF6B6B"
                                style={styles.checkIcon}
                              />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </Animated.View>
                  )}

                  {currentStep === 6 && (
                    <Animated.View entering={FadeIn} style={styles.stepContent}>
                      <Text style={styles.title}>What's your goal?</Text>
                      <View style={styles.goalContainer}>
                        {[
                          { id: 'weight_loss', label: 'Lose Weight', icon: 'trending-down-outline' },
                          { id: 'maintain', label: 'Maintain', icon: 'fitness-outline' },
                          { id: 'weight_gain', label: 'Gain Weight', icon: 'trending-up-outline' }
                        ].map((option) => (
                          <TouchableOpacity
                            key={option.id}
                            style={[
                              styles.goalOption,
                              goal === option.id && styles.selectedGoal
                            ]}
                            onPress={() => setGoal(option.id)}
                          >
                            <Ionicons
                              name={option.icon as any}
                              size={24}
                              color={goal === option.id ? '#FF6B6B' : '#666'}
                            />
                            <Text style={[
                              styles.goalLabel,
                              goal === option.id && styles.selectedLabel
                            ]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </Animated.View>
                  )}
                </View>

                <View style={styles.buttonContainer}>
                  {currentStep > 1 && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBackStep}
                    >
                      <LinearGradient
                        colors={['#FF8E53', '#FF6B6B']}
                        style={styles.gradientButton}
                      >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.nextButton,
                      { width: currentStep === 1 ? '100%' : 120 }
                    ]}
                    onPress={handleNextStep}
                  >
                    <LinearGradient
                      colors={['#FF6B6B', '#FF8E53']}
                      style={[styles.gradientButton, styles.nextGradient]}
                    >
                      <Text style={styles.nextButtonText}>
                        {currentStep === 6 ? 'Finish' : 'Continue'}
                      </Text>
                      {currentStep < 6 && (
                        <Ionicons name="arrow-forward" size={24} color="#fff" style={styles.nextIcon} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#FFE5E5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    height: height * 0.7,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  lottie: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginTop: 20,
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    fontSize: 18,
    padding: 12,
    color: '#333',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    color: '#666',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 20,
  },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 12,
  },
  selectedGender: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  genderLabel: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  selectedLabel: {
    color: '#FF6B6B',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  backButton: {
    width: 45,
    height: 45,
  },
  nextButton: {
    height: 45,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextGradient: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  nextIcon: {
    marginLeft: 4,
  },
  activityScrollContainer: {
    width: '100%',
    maxHeight: height * 0.45,
  },
  activityContentContainer: {
    paddingRight: 5,
    gap: 8,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    width: '100%',
  },
  selectedActivity: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  activityInfo: {
    flex: 1,
    marginRight: 10,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  selectedActivityText: {
    color: '#FF6B6B',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  goalContainer: {
    width: '100%',
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedGoal: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginLeft: 12,
  },
  selectedGoalText: {
    color: '#FF6B6B',
  },
});
