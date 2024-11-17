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
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { scheduleMidnightNotification } from '../nutritionval';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const isSmallDevice = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH > 768;

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

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeight, setSelectedWeight] = useState(100);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

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

  const renderMealCategory = ({ item }) => (
    <TouchableOpacity 
      onPress={() => setSelectedMeal(item.id)}
      style={[styles.categoryCard, selectedMeal === item.id && styles.selectedCategory]}
    >
      <LinearGradient
        colors={item.gradient}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={item.icon} size={24} color="white" />
      </LinearGradient>
      <Text style={styles.categoryLabel}>{item.label}</Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.header, { transform: [{ translateY: headerY }] }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Find Your Food</Text>
          <Text style={styles.headerSubtitle}>Track your daily nutrition</Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={24} color="gray" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for food..."
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={24} color="gray" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={mealCategories}
            keyExtractor={(item) => item.id}
            renderItem={renderMealCategory}
            contentContainerStyle={styles.categoriesContainer}
            style={styles.flatListContainer}
            snapToAlignment="start"
            decelerationRate="fast"
            snapToInterval={
              isTablet ? 
                SCREEN_WIDTH * 0.15 : 
                isSmallDevice ? 
                  SCREEN_WIDTH * 0.22 : 
                  SCREEN_WIDTH * 0.2
            }
            getItemLayout={(data, index) => ({
              length: isTablet ? 
                SCREEN_WIDTH * 0.15 : 
                isSmallDevice ? 
                  SCREEN_WIDTH * 0.22 : 
                  SCREEN_WIDTH * 0.2,
              offset: (isTablet ? 
                SCREEN_WIDTH * 0.15 : 
                isSmallDevice ? 
                  SCREEN_WIDTH * 0.22 : 
                  SCREEN_WIDTH * 0.2) * index,
              index,
            })}
          />
        </View>

        <View style={styles.resultsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <LottieView
                source={require('@/assets/animations/food-loading.json')}
                autoPlay
                loop
                style={styles.loadingAnimation}
              />
            </View>
          ) : dishes.length > 0 ? (
            <FlatList
              data={dishes}
              keyExtractor={(item) => item.food.foodId}
              renderItem={renderFoodItem}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          ) : searchQuery.length > 0 && (
            <View style={styles.emptyStateContainer}>
              <LottieView
                source={require('@/assets/animations/food-loading.json')}
                autoPlay
                loop
                style={styles.emptyAnimation}
              />
              <Text style={styles.emptyStateText}>No results found</Text>
            </View>
          )}
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
    padding: isSmallDevice ? 15 : 20,
    marginTop: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.02 : 0, // Extra margin for iOS
  },
  headerTitle: {
    fontSize: isTablet ? 32 : isSmallDevice ? 24 : 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: isTablet ? 18 : isSmallDevice ? 14 : 16,
    color: '#666',
    marginTop: isSmallDevice ? 3 : 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: SCREEN_WIDTH * 0.05,
    borderRadius: isSmallDevice ? 12 : 15,
    paddingHorizontal: isSmallDevice ? 12 : 15,
    paddingVertical: isSmallDevice ? 8 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: isSmallDevice ? 8 : 10,
    fontSize: isTablet ? 28 : 24,
  },
  searchInput: {
    flex: 1,
    fontSize: isTablet ? 18 : isSmallDevice ? 14 : 16,
    color: '#333',
    paddingVertical: isSmallDevice ? 6 : 8,
  },
  categoriesSection: {
    marginBottom: SCREEN_HEIGHT * 0.02,
    paddingHorizontal: SCREEN_WIDTH * 0.02, // Add horizontal padding
  },
  sectionTitle: {
    fontSize: isTablet ? 24 : isSmallDevice ? 18 : 20,
    fontWeight: '600',
    marginHorizontal: SCREEN_WIDTH * 0.05,
    marginBottom: SCREEN_HEIGHT * 0.015,
    color: '#333',
  },
  categoriesContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.02,
    paddingRight: SCREEN_WIDTH * 0.04, // Add extra padding on right to prevent cutoff
  },
  categoryCard: {
    marginHorizontal: SCREEN_WIDTH * 0.015, // Reduce horizontal margin
    alignItems: 'center',
    width: isTablet ? 
      SCREEN_WIDTH * 0.15 : // Smaller width for tablets
      isSmallDevice ? 
        SCREEN_WIDTH * 0.22 : // Smaller width for small devices
        SCREEN_WIDTH * 0.2,   // Regular width for normal devices
    paddingVertical: isSmallDevice ? 8 : 10,
  },
  categoryGradient: {
    width: isTablet ? 80 : isSmallDevice ? 48 : 56,
    height: isTablet ? 80 : isSmallDevice ? 48 : 56,
    borderRadius: isTablet ? 40 : isSmallDevice ? 24 : 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 6 : 8,
  },
  selectedCategory: {
    transform: [{ scale: 1.05 }],
  },
  categoryLabel: {
    fontSize: isTablet ? 16 : isSmallDevice ? 12 : 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
  },
  foodCard: {
    marginBottom: SCREEN_HEIGHT * 0.02,
    borderRadius: isSmallDevice ? 12 : 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodImage: {
    width: '100%',
    height: isTablet ? SCREEN_WIDTH * 0.3 : SCREEN_WIDTH * 0.5,
    borderRadius: isSmallDevice ? 12 : 15,
  },
  foodInfoBlur: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: isSmallDevice ? 12 : 15,
    borderBottomLeftRadius: isSmallDevice ? 12 : 15,
    borderBottomRightRadius: isSmallDevice ? 12 : 15,
  },
  foodInfo: {
    flex: 1,
  },
  foodTitle: {
    fontSize: isTablet ? 20 : isSmallDevice ? 14 : 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: isSmallDevice ? 3 : 5,
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  foodCalories: {
    fontSize: isTablet ? 18 : isSmallDevice ? 14 : 16,
    color: '#fff',
    fontWeight: '500',
  },
  macroContainer: {
    flexDirection: 'row',
    gap: isSmallDevice ? 8 : 10,
    flexWrap: 'wrap',
  },
  macroText: {
    fontSize: isTablet ? 16 : isSmallDevice ? 12 : 14,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: SCREEN_HEIGHT * 0.3,
  },
  loadingAnimation: {
    width: isTablet ? SCREEN_WIDTH * 0.2 : SCREEN_WIDTH * 0.3,
    height: isTablet ? SCREEN_WIDTH * 0.2 : SCREEN_WIDTH * 0.3,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.1,
    minHeight: SCREEN_HEIGHT * 0.3,
  },
  emptyAnimation: {
    width: isTablet ? SCREEN_WIDTH * 0.3 : SCREEN_WIDTH * 0.4,
    height: isTablet ? SCREEN_WIDTH * 0.3 : SCREEN_WIDTH * 0.4,
  },
  emptyStateText: {
    fontSize: isTablet ? 20 : isSmallDevice ? 14 : 16,
    color: '#666',
    marginTop: SCREEN_HEIGHT * 0.02,
    textAlign: 'center',
  },
  flatListContainer: {
    marginHorizontal: -SCREEN_WIDTH * 0.02, // Negative margin to offset parent padding
  },
});

export default Home;
