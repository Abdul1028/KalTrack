import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { scheduleMidnightNotification } from '../nutritionval';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import { Pedometer } from 'expo-sensors';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
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

const QuickStats = ({ stepCount }: { stepCount: StepCountData }) => (
  <View style={styles.quickStats}>
    <View style={styles.statCard}>
      <MaterialCommunityIcons name="fire" size={24} color="#FF6B6B" />
      <Text style={styles.statValue}>1,200</Text>
      <Text style={styles.statLabel}>Calories Left</Text>
    </View>
    <View style={styles.statCard}>
      <FontAwesome5 name="walking" size={24} color="#4ECDC4" />
      {stepCount.loading ? (
        <ActivityIndicator size="small" color="#4ECDC4" />
      ) : (
        <Text style={styles.statValue}>
          {stepCount.error ? '--' : stepCount.steps.toLocaleString()}
        </Text>
      )}
      <Text style={styles.statLabel}>Steps</Text>
    </View>
    <View style={styles.statCard}>
      <MaterialCommunityIcons name="water" size={24} color="#45B7D1" />
      <Text style={styles.statValue}>4/8</Text>
      <Text style={styles.statLabel}>Water (cups)</Text>
    </View>
  </View>
);

const TodaysMeals = () => {
  const [meals, setMeals] = useState([]);
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
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMealCard = ({ item }) => (
    <View style={styles.mealCard}>
      <View style={styles.mealImageContainer}>
        <Image 
          source={{ uri: mealImages[item.mealType] || mealImages.snacks }}
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

  const {user} = useUser();

  const scrollY = new Animated.Value(0);
  const diffClampScrollY = Animated.diffClamp(scrollY, 0, 50);
  const headerY = diffClampScrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -50]
  });

  const onRefresh = async () => {
  setRefreshing(true);
  await fetchDishes();
  setRefreshing(false);
  };

  const formatToTwoDecimals = (num:any) => {
    if (isNaN(num)) return '0.00'; // Handle non-numeric values
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
      console.error(error);
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchDishes();
  }, [selectedMeal, selectedWeight]);

  useEffect(() => {
    if (user) {
      // Schedule the notification after login
      scheduleMidnightNotification(user.id);
    }
  }, [user]);

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

        // Get steps from midnight until now
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

        // Start subscription for real-time updates
        subscription = Pedometer.watchStepCount(result => {
          setStepCount(prev => ({
            ...prev,
            steps: initialSteps + result.steps,
            loading: false
          }));
        });

      } catch (error) {
        console.error('Pedometer error:', error);
        setStepCount(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load step count'
        }));
      }
    };

    getStepCount();

    // Set up interval to refresh total steps periodically
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
        console.error('Step refresh error:', error);
      }
    }, 60000); // Refresh every minute

    // Cleanup subscriptions
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

  const [selectedMealCategory, setSelectedMealCategory] = useState(null);

  const renderMealCategory = ({ item }) => (
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
        colors={item.gradient}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.categoryContent}>
          <Ionicons name={item.icon} size={28} color="white" />
          <Text style={styles.categoryLabel}>{item.label}</Text>
          <Text style={styles.categorySubLabel}>Add Food</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodCard}
      onPress={() => {
        router.push({
          pathname: "/nutritionval",
          params: {
            pic: item.food.image || "",
            name: item.food.label || "Food Item",
            energy: item.food.nutrients?.ENERC_KCAL || 0,
            pros: item.food.nutrients?.PROCNT || 0,
            fats: item.food.nutrients?.FAT || 0,
            carbs: item.food.nutrients?.CHOCDF || 0,
            fibres: item.food.nutrients?.FIBTG || 0,
            mealType: selectedMeal,
          }
        });
      }}
    >
      <Image 
        source={{ uri: item.food.image || "https://cdn.pixabay.com/photo/2017/02/21/08/49/food-2085075_1280.png" }}
        style={styles.foodImage}
      />
      <BlurView intensity={80} style={styles.foodInfoBlur}>
        <View style={styles.foodInfo}>
          <Text style={styles.foodTitle} numberOfLines={1}>{item.food.label}</Text>
          <View style={styles.nutritionInfo}>
            <Text style={styles.foodCalories}>{Math.round(item.food.nutrients.ENERC_KCAL)} kcal</Text>
            <View style={styles.macroContainer}>
              <Text style={styles.macroText}>P: {Math.round(item.food.nutrients.PROCNT)}g</Text>
              <Text style={styles.macroText}>C: {Math.round(item.food.nutrients.CHOCDF)}g</Text>
              <Text style={styles.macroText}>F: {Math.round(item.food.nutrients.FAT)}g</Text>
            </View>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  const renderMealType = ({ item }: { item: MealType }) => (
    <TouchableOpacity
      style={styles.mealTypeCard}
      onPress={() => router.push({
        pathname: "/addMeal",
        params: { mealType: item.id }
      })}
    >
      <LinearGradient
        colors={item.gradient}
        style={styles.mealGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={item.icon} size={24} color="white" />
        <Text style={styles.mealTypeLabel}>{item.label}</Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <FixedHeader />
      <Animated.ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.mainContent}>
          <QuickStats stepCount={stepCount} />
          
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
      SCREEN_HEIGHT * 0.05 : // More top padding for Android
      SCREEN_HEIGHT * 0.02,  // Less top padding for iOS
    zIndex: 1000,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    marginTop: SCREEN_HEIGHT * 0.03, // Add top margin
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF8C00',
  },
  initialsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fixedHeader: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
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
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
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
