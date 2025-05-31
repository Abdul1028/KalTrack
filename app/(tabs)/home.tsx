import React, { useState, useEffect, useCallback } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  TextInput, 
  View, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  Dimensions,
  Platform,
  RefreshControl,
  Animated,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { scheduleMidnightNotification } from '../nutritionval';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import { Pedometer } from 'expo-sensors';
import { collection, query, getDocs, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import moment from 'moment';

const { width, height } = Dimensions.get('window');

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const isSmallDevice = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH > 768;


const THEME = {
  primary: '#FF8C00', // Deep Orange
  secondary: '#FFA500', // Orange
  text: '#333333',
  error: '#FF3B30',
  background: '#FFFFFF',
  inputBorder: '#E0E0E0',
};

const mealCategories = [
  { 
    id: 'breakfast', 
    label: 'Breakfast', 
    image: 'https://your-breakfast-image.jpg',
    icon: 'sunny-outline',
    gradient: ['#FF9966', '#FF5E62']
  },
  { 
    id: 'lunch', 
    label: 'Lunch', 
    image: 'https://your-lunch-image.jpg',
    icon: 'restaurant-outline',
    gradient: ['#4ECDC4', '#45B7D1']
  },
  { 
    id: 'dinner', 
    label: 'Dinner', 
    image: 'https://your-dinner-image.jpg',
    icon: 'moon-outline',
    gradient: ['#834D9B', '#D04ED6']
  },
  { 
    id: 'snacks', 
    label: 'Snacks', 
    image: 'https://your-snacks-image.jpg',
    icon: 'cafe-outline',
    gradient: ['#56CCF2', '#2F80ED']
  }
];

type StepCountData = {
  steps: number;
  loading: boolean;
  error: string | null;
};

// Define props for QuickStats
interface QuickStatsProps {
  stepCount: StepCountData;
  waterIntake: number;
  waterGoal: number;
  isWaterLoading: boolean;
  onUpdateWater: (change: number) => void;
  targetCalories: number;
  totalCaloriesConsumed: number;
  totalCaloriesBurnedExercise: number;
  addExerciseCaloriesToBudget: boolean;
  isLoadingCalories: boolean;
}

const FixedHeader = () => {
  const { user } = useUser();

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.emailAddresses[0]?.emailAddress[0].toUpperCase() || '?';
  };

  return (
    <View style={styles.fixedHeader}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>
            {user?.firstName || user?.emailAddresses[0]?.emailAddress.split('@')[0]}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, styles.initialsContainer]}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const QuickStats = ({ 
  stepCount, 
  waterIntake, 
  waterGoal, 
  isWaterLoading, 
  onUpdateWater,
  targetCalories,
  totalCaloriesConsumed,
  totalCaloriesBurnedExercise,
  addExerciseCaloriesToBudget,
  isLoadingCalories,
}: QuickStatsProps) => {
  const exerciseCaloriesToAdd = addExerciseCaloriesToBudget ? totalCaloriesBurnedExercise : 0;
  const caloriesLeft = Math.round(targetCalories - totalCaloriesConsumed + exerciseCaloriesToAdd);

  return (
    <View style={styles.quickStats}>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="fire" size={styles.iconSize?.fontSize || 24} color="#FF6B6B" style={styles.statIcon} />
        {isLoadingCalories ? (
          <ActivityIndicator size="small" color="#FF6B6B" style={styles.statValueLoader}/>
        ) : (
          <Text style={styles.statValue}>{caloriesLeft >= 0 ? caloriesLeft : 0}</Text>
        )}
        <Text style={styles.statLabel}>Calories Left</Text>
      </View>
      <View style={styles.statCard}>
        <FontAwesome5 name="walking" size={styles.iconSize?.fontSize || 24} color="#4ECDC4" style={styles.statIcon} />
        {stepCount.loading ? (
          <ActivityIndicator size="small" color="#4ECDC4" style={styles.statValueLoader} />
        ) : (
          <Text style={styles.statValue}>
            {stepCount.error ? '--' : stepCount.steps.toLocaleString()}
          </Text>
        )}
        <Text style={styles.statLabel}>Steps</Text>
      </View>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="water" size={styles.iconSize?.fontSize || 24} color="#45B7D1" style={styles.statIcon} />
        {isWaterLoading ? (
          <ActivityIndicator size="small" color="#45B7D1" style={styles.statValueLoader} />
        ) : (
          <Text style={styles.statValue}>{`${waterIntake}/${waterGoal}`}</Text>
        )}
        <Text style={styles.statLabel}>Water (cups)</Text>
        {!isWaterLoading && (
          <View style={styles.waterButtonContainer}>
            <TouchableOpacity onPress={() => onUpdateWater(-1)} style={styles.waterButton} disabled={waterIntake <= 0}>
              <Ionicons name="remove-circle-outline" size={styles.buttonIconSize?.fontSize || 24} color={waterIntake <= 0 ? '#c0c0c0' : '#45B7D1'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onUpdateWater(1)} style={styles.waterButton} disabled={waterIntake >= waterGoal}>
              <Ionicons name="add-circle-outline" size={styles.buttonIconSize?.fontSize || 24} color={waterIntake >= waterGoal ? '#c0c0c0' : '#45B7D1'} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const TodaysMeals = () => {
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const mealImages = {
    breakfast: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?ixlib=rb-4.0.3',
    lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3',
    dinner: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3',
    snacks: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-4.0.3',
  };

  useEffect(() => {
    fetchTodaysMeals();
  }, []);

  const fetchTodaysMeals = async () => {
    try {
      const currentDate = moment().format('DD-MM-YYYY');
      const mealsRef = collection(db, `users/${user?.id}/NutritionData/${currentDate}/Meals`);
      const mealsSnapshot = await getDocs(mealsRef);
      
      const mealsData = mealsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMeals(mealsData);
    } catch (error) {
      console.log('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMealCard = ({ item }: { item: any }) => (
    <View style={styles.mealCard}>
      <View style={styles.mealImageContainer}>
        <Image 
          source={{ uri: mealImages[item.mealType as keyof typeof mealImages] || mealImages.snacks }}
          style={styles.mealImage}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.mealTime}>{item.mealType?.charAt(0).toUpperCase() + item.mealType?.slice(1)}</Text>
      <Text style={styles.mealName}>{item.name}</Text>
      <View style={styles.mealStats}>
        <Text style={styles.mealCalories}>{Math.round(item.calorie)} kcal</Text>
        <Text style={styles.mealMacros}>
          P: {Math.round(item.protien)}g • C: {Math.round(item.carbohydrates)}g
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  if (meals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No meals added today</Text>
      </View>
    );
  }

  return (
    <View style={styles.todaysMealsContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={meals}
        keyExtractor={(item) => item.id}
        renderItem={renderMealCard}
      />
    </View>
  );
};

// Define interface for MealCategory item
interface MealCategory {
  id: string;
  label: string;
  icon: string; // Use string for simplicity
  gradient: string[]; // Keep as string array to match data
  image?: string; // Add optional image property
}

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeight, setSelectedWeight] = useState(100);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [stepCount, setStepCount] = useState<StepCountData>({
    steps: 0,
    loading: true,
    error: null
  });
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(8); // Default goal
  const [isWaterLoading, setIsWaterLoading] = useState(true);

  const {user} = useUser();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const scrollY = new Animated.Value(0);
  const diffClampScrollY = Animated.diffClamp(scrollY, 0, 50);
  const headerY = diffClampScrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -50]
  });

  const getCurrentDateDocId = () => moment().format('DD-MM-YYYY');

  const fetchUserDetails = useCallback(async () => {
    if (!user) return null;
    try {
      const userDocRef = doc(db, 'users', user.id);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return userDocSnap.data();
      }
      return null;
    } catch (error) {
      console.log("Error fetching user details:", error);
      return null;
    }
  }, [user]);

  const fetchDailyData = useCallback(async () => {
    if (!user) return null;
    try {
      const dateId = getCurrentDateDocId();
      const dailyDocRef = doc(db, 'users', user.id, 'NutritionData', dateId);
      const docSnap = await getDoc(dailyDocRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return { waterIntake: 0, totalCaloriesConsumed: 0, totalCaloriesBurnedExercise: 0 };
    } catch (error) {
      console.log("Error fetching daily data:", error);
      return null;
    }
  }, [user]);

  const loadAllData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setUserDetails(null);
      setDailySummary(null);
      setWaterIntake(0);
      return;
    }
    console.log("Home screen loading data...");
    setIsLoading(true);

    const [details, summary] = await Promise.all([
      fetchUserDetails(),
      fetchDailyData()
    ]);

    setUserDetails(details);
    setDailySummary(summary);

    setWaterIntake(summary?.waterIntake || 0);

    setIsLoading(false);
    console.log("Home screen data loaded.");
  }, [user, fetchUserDetails, fetchDailyData]);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  useEffect(() => {
    let subscription: any = null;
    let initialSteps = 0;

    const getStepCount = async () => {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        
        if (!isAvailable) {
          setStepCount(prev => ({
            ...prev,
            loading: false,
            error: 'Pedometer not available'
          }));
          return;
        }

        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const result = await Pedometer.getStepCountAsync(start, end);
        if (result) {
          initialSteps = result.steps;
          setStepCount(prev => ({
            ...prev,
            steps: result.steps,
            loading: false
          }));
        }

        subscription = Pedometer.watchStepCount(result => {
          setStepCount(prev => ({
            ...prev,
            steps: initialSteps + result.steps,
            loading: false
          }));
        });

      } catch (error) {
        console.log('Pedometer error:', error);
        setStepCount(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load step count'
        }));
      }
    };

    getStepCount();

    const refreshInterval = setInterval(async () => {
      try {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const result = await Pedometer.getStepCountAsync(start, end);
        if (result) {
          initialSteps = result.steps;
          setStepCount(prev => ({
            ...prev,
            steps: result.steps,
            loading: false
          }));
        }
      } catch (error) {
        console.log('Step refresh error:', error);
      }
    }, 60000);

    return () => {
      if (subscription) {
        subscription.remove();
      }
      clearInterval(refreshInterval);
    };
  }, []);

  const logNutrients = (nutrients: any) => {
    console.log('Nutrients for the selected dish:');
    console.log(nutrients);
  };

  const router = useRouter();

  const showNutritionValues = (nutrients :any) =>{
    router.push({
      pathname:"/(tabs)/statistics",
      params:{
        nutrients: JSON.stringify(nutrients)
      }
    })
    console.log("sending "+nutrients)

  }

  const [selectedMealCategory, setSelectedMealCategory] = useState<string | null>(null);

  const renderMealCategory = ({ item }: { item: MealCategory }) => (
    <TouchableOpacity 
      onPress={() => {
        setSelectedMealCategory(item.id);
        router.push({
          pathname: "/addMeal",
          params: { mealType: item.id }
        });
      }}
      style={[
        styles.categoryCard, 
        selectedMealCategory === item.id && styles.selectedCategoryCard
      ]}
    >
      <LinearGradient
        colors={item.gradient as any}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.categoryContent}>
          <Ionicons name={item.icon as any} size={28} color="white" />
          <Text style={styles.categoryLabel}>{item.label}</Text>
          <Text style={styles.categorySubLabel}>Add Food</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleSearchPress = () => {
    if (!selectedMealCategory) {
      Alert.alert('Select Meal', 'Please select a meal category first');
      return;
    }
    router.push({
      pathname: "/addMeal",
      params: { mealType: selectedMealCategory }
    });
  };

  const handleUpdateWater = async (change: number) => {
    if (!user) return;

    if (change > 0 && waterIntake >= waterGoal) {
      return;
    }
    
    const newIntake = Math.max(0, waterIntake + change);
    const justReachedGoal = change > 0 && newIntake === waterGoal && waterIntake < waterGoal;

    setWaterIntake(newIntake);

    if (justReachedGoal) {
      Alert.alert("Hurray!", "You are done for the day");
    }

    try {
      const dateId = getCurrentDateDocId();
      const dailyDocRef = doc(db, 'users', user.id, 'NutritionData', dateId);
      
      await setDoc(dailyDocRef, { 
        waterIntake: newIntake,
        updatedAt: Timestamp.now()
      }, { merge: true });

    } catch (error) {
      console.log("Error updating water intake:", error);
      Alert.alert("Error", "Could not update water intake. Please try again.");
      loadAllData();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDishes(),
      loadAllData(),
    ]);
    setRefreshing(false);
  }, [user, loadAllData]);

  const formatToTwoDecimals = (num:any) => {
    if (isNaN(num)) return '0.00';
    return (Math.round(num * 100) / 100).toFixed(2);
  };

  const fetchDishes = async () => {
    if (!searchQuery){
     return 
    }
    console.log("called");

    setLoading(true);
    const app_id = '56082498';
    const app_key = '7e45de6c1b73f0dd65efc3eb5ab33ea5';
    
    try {
      const response = await axios.get(`https://api.edamam.com/api/food-database/v2/parser`, {
        params: {
          app_id,
          app_key,
          ingr: searchQuery + " "+ selectedMeal,
        },
      });
      setDishes(response.data.hints);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const targetCalories = userDetails?.targetCalories || 0;
  const totalCaloriesConsumed = dailySummary?.totalCaloriesConsumed || 0;
  const totalCaloriesBurnedExercise = dailySummary?.totalCaloriesBurnedExercise || 0;
  const addExerciseCaloriesToBudget = userDetails?.addExerciseCaloriesToBudget !== false;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <FixedHeader />
      <Animated.ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadAllData} />
        }
      >
        <View style={styles.mainContent}>
          <QuickStats
            stepCount={stepCount}
            waterIntake={waterIntake}
            waterGoal={waterGoal}
            isWaterLoading={isLoading}
            onUpdateWater={handleUpdateWater}
            targetCalories={targetCalories}
            totalCaloriesConsumed={totalCaloriesConsumed}
            totalCaloriesBurnedExercise={totalCaloriesBurnedExercise}
            addExerciseCaloriesToBudget={addExerciseCaloriesToBudget}
            isLoadingCalories={isLoading}
          />
          
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Add Meal</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={mealCategories}
              keyExtractor={(item) => item.id}
              renderItem={renderMealCategory}
              contentContainerStyle={styles.categoriesContainer}
            />
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Meals</Text>
            </View>
            <TodaysMeals />
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 
      SCREEN_HEIGHT * 0.05 :
      SCREEN_HEIGHT * 0.02,
    zIndex: 1000,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    marginTop: SCREEN_HEIGHT * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  profileButton: {
    marginLeft: 15,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f0f0f0',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF8C00',
  },
  initialsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fixedHeader: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 5,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  mainContent: {
    flex: 1,
    paddingTop: 20,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    marginRight: 12,
    borderRadius: 15,
    overflow: 'hidden',
    width: SCREEN_WIDTH * 0.28,
    aspectRatio: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCategoryCard: {
    transform: [{ scale: 1.02 }],
    borderWidth: 2,
    borderColor: '#fff',
  },
  categoryGradient: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    color: '#fff',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  categorySubLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: isTablet ? 14 : 12,
    marginTop: 5,
  },
  scrollContentPadding: {
    paddingTop: Platform.OS === 'ios' ? 110 : 90,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
  searchButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginVertical: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  iconSize: {
    fontSize: 26,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
    textAlign: 'center',
  },
  statValueLoader: {
    height: 22,
    marginBottom: 3,
    marginTop: 3,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  waterButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '85%',
    paddingTop: 0,
  },
  waterButton: {
    padding: 4,
  },
  buttonIconSize: {
    fontSize: 26,
  },
  todaysMealsContainer: {
    paddingHorizontal: 20,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    width: SCREEN_WIDTH * 0.65,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealImageContainer: {
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  mealTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  mealStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealCalories: {
    fontSize: 14,
    color: '#FF8C00',
    fontWeight: '500',
  },
  mealMacros: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default Home;
