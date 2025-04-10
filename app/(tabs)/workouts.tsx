import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig'; // Adjust path if necessary
import moment from 'moment';

// Placeholder: Define Workout interface later
interface Workout {
  id: string;
  type: string;
  durationMinutes: number;
  caloriesBurned: number;
  createdAt: Timestamp;
}

// Placeholder: Today's Workouts Component
const TodaysWorkouts = ({ workouts, isLoading }: { workouts: Workout[], isLoading: boolean }) => {
  if (isLoading) {
    return <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 20 }} />;
  }

  if (workouts.length === 0) {
    return <Text style={styles.emptyText}>No workouts logged today.</Text>;
  }

  return (
    <View style={styles.workoutListContainer}>
      {workouts.map((workout) => (
        <View key={workout.id} style={styles.workoutCard}>
          <Ionicons name="barbell-outline" size={24} color="#FF6B6B" style={styles.workoutIcon} />
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutType}>{workout.type}</Text>
            <Text style={styles.workoutDetails}>
              {workout.durationMinutes} min • {Math.round(workout.caloriesBurned)} kcal
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};


export default function WorkoutsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [todaysWorkouts, setTodaysWorkouts] = useState<Workout[]>([]);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentDateDocId = () => moment().format('DD-MM-YYYY');

  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!user) return;
      setIsLoading(true);
      const dateId = getCurrentDateDocId();
      const userId = user.id;

      try {
        // Fetch total calories burned from summary
        const summaryDocRef = doc(db, 'users', userId, 'NutritionData', dateId);
        const summarySnap = await getDoc(summaryDocRef);
        if (summarySnap.exists()) {
          setTotalCaloriesBurned(summarySnap.data()?.totalCaloriesBurnedExercise || 0);
        } else {
          setTotalCaloriesBurned(0);
        }

        // Fetch workout documents
        const workoutsRef = collection(db, 'users', userId, 'NutritionData', dateId, 'Workouts');
        const q = query(workoutsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedWorkouts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workout));
        setTodaysWorkouts(fetchedWorkouts);

      } catch (error) {
        console.error("Error fetching workout data:", error);
        // Handle error display if needed
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkoutData();
  }, [user]); // Refetch if user changes

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>Workouts</Text>

        {/* Summary Section */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Calories Burned Today</Text>
          <Text style={styles.summaryValue}>{Math.round(totalCaloriesBurned)} kcal</Text>
        </View>

        {/* Log Workout Button */}
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => router.push('/log-workout')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.logButtonText}>Log New Workout</Text>
        </TouchableOpacity>

        {/* Today's Workouts Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <TodaysWorkouts workouts={todaysWorkouts} isLoading={isLoading} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Light background
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B', // Theme color
  },
  logButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B', // Theme color
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  workoutListContainer: {
    // Styles for the list container if needed
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  workoutIcon: {
    marginRight: 15,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  workoutDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  }
}); 