import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView,
  Modal,
  TextInput,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
  SafeAreaView
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

const EDAMAM_APP_ID = '56082498';
const EDAMAM_APP_KEY = '7e45de6c1b73f0dd65efc3eb5ab33ea5';

interface Food {
  foodId: string;
  label: string;
  nutrients: {
    ENERC_KCAL: number;
    PROCNT: number;
    FAT: number;
    CHOCDF: number;
  };
  image?: string;
  quantity: number;
  measureURI?: string;
  measureLabel?: string;
}

interface MealNutrients {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

const commonMeasures = [
  { label: 'Grams', value: 'g' },
  { label: 'Ounces', value: 'oz' },
  { label: 'Pounds', value: 'lb' },
  { label: 'Kilograms', value: 'kg' },
  { label: 'Cups', value: 'cup' },
  { label: 'Tablespoons', value: 'tbsp' },
  { label: 'Teaspoons', value: 'tsp' },
  { label: 'Pieces', value: 'piece' }
];

const MealPlanner = () => {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('');
  const [mealName, setMealName] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [plannedMeals, setPlannedMeals] = useState<any>({});
  const { user } = useUser();
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
  const [totalNutrients, setTotalNutrients] = useState<MealNutrients>({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0
  });
  const [showSearchView, setShowSearchView] = useState(false);
  const params = useLocalSearchParams();

  const mealTimes = [
    { id: 'breakfast', title: 'Breakfast', icon: 'sunny-outline' },
    { id: 'lunch', title: 'Lunch', icon: 'restaurant-outline' },
    { id: 'dinner', title: 'Dinner', icon: 'moon-outline' },
    { id: 'snacks', title: 'Snacks', icon: 'cafe-outline' },
  ];

  useEffect(() => {
    if (selectedDate) {
      fetchPlannedMeals();
    }
  }, [selectedDate]);

  useEffect(() => {
    setSelectedFoods([]);
    setTotalNutrients({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0
    });
  }, [selectedDate]);

  const fetchPlannedMeals = async () => {
    if (!user) return;
    try {
      const mealsRef = collection(db, `users/${user.id}/plannedMeals`);
      const q = query(mealsRef, where('date', '==', selectedDate));
      const querySnapshot = await getDocs(q);
      
      const meals: any = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!meals[data.mealType]) {
          meals[data.mealType] = [];
        }
        meals[data.mealType].push(data);
      });
      
      setPlannedMeals(meals);
    } catch (error) {
      console.error('Error fetching planned meals:', error);
    }
  };

  const handleAddMeal = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to add meals');
      return;
    }

    if (selectedFoods.length === 0) {
      Alert.alert('Error', 'Please add at least one food item');
      return;
    }

    try {
      const mealId = `${selectedDate}-${selectedMealType}-${Date.now()}`;
      const mealRef = doc(db, `users/${user.id}/plannedMeals/${mealId}`);
      
      const mealData = {
        id: mealId,
        date: selectedDate,
        mealType: selectedMealType,
        foods: selectedFoods.map(food => ({
          foodId: food.foodId,
          label: food.label,
          quantity: food.quantity,
          measureLabel: food.measureLabel,
          nutrients: {
            calories: food.nutrients.ENERC_KCAL * food.quantity,
            protein: food.nutrients.PROCNT * food.quantity,
            fat: food.nutrients.FAT * food.quantity,
            carbs: food.nutrients.CHOCDF * food.quantity
          },
          image: food.image || null
        })),
        totalNutrients: {
          calories: Math.round(totalNutrients.calories),
          protein: Math.round(totalNutrients.protein),
          fat: Math.round(totalNutrients.fat),
          carbs: Math.round(totalNutrients.carbs)
        }
      };

      await setDoc(mealRef, mealData);
      
      // Reset states and close modal
      setSelectedFoods([]);
      setTotalNutrients({
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
      });
      setShowSearchView(false);
      fetchPlannedMeals(); // Refresh the meals list
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  };

  const SearchInput = React.memo(({ 
    value, 
    onChangeText, 
    onSearch 
  }: { 
    value: string, 
    onChangeText: (text: string) => void,
    onSearch: () => void
  }) => (
    <View style={styles.searchInputContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search foods..."
        placeholderTextColor="#95A5A6"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSearch}
        autoFocus
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={20} color="#95A5A6" />
        </TouchableOpacity>
      )}
    </View>
  ));

  const SearchResultsView = () => {
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    
    const handleSearch = async () => {
      if (!localSearchQuery.trim()) return;
      
      setIsSearching(true);
      try {
        const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(localSearchQuery)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.hints && Array.isArray(data.hints)) {
          const mappedResults = data.hints.map((hint: any) => ({
            foodId: hint.food.foodId,
            label: hint.food.label,
            nutrients: {
              ENERC_KCAL: hint.food.nutrients.ENERC_KCAL || 0,
              PROCNT: hint.food.nutrients.PROCNT || 0,
              FAT: hint.food.nutrients.FAT || 0,
              CHOCDF: hint.food.nutrients.CHOCDF || 0
            },
            image: hint.food.image,
            quantity: 10,
            measureLabel: 'g'
          }));
          setSearchResults(mappedResults);
        }
      } catch (error) {
        console.error('Search Error:', error);
        Alert.alert('Error', 'Failed to search foods');
      } finally {
        setIsSearching(false);
      }
    };

    const handleSelectFood = (food: Food) => {
      // Check if food is already selected
      const isAlreadySelected = selectedFoods.some(f => f.foodId === food.foodId);
      
      if (!isAlreadySelected) {
        setSelectedFoods([...selectedFoods, food]);
        updateTotalNutrients([...selectedFoods, food]);
      } else {
        Alert.alert('Already Selected', 'This food item is already in your selection.');
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.searchHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#2D3436" />
          </TouchableOpacity>
          <Text style={styles.searchTitle}>Add to {selectedMealType}</Text>
        </View>

        {selectedFoods.length > 0 && (
          <TouchableOpacity 
            style={styles.reviewSelectedButton}
            onPress={() => {
              router.push({
                pathname: '/selected-foods',
                params: {
                  selectedFoods: JSON.stringify(selectedFoods),
                  mealType: selectedMealType,
                  date: selectedDate
                }
              });
            }}
          >
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{selectedFoods.length}</Text>
            </View>
            <Text style={styles.reviewButtonText}>Review Selected</Text>
          </TouchableOpacity>
        )}

        <SearchInput
          value={localSearchQuery}
          onChangeText={setLocalSearchQuery}
          onSearch={handleSearch}
        />

        <View style={styles.resultsContainer}>
          {isSearching ? (
            <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.foodId}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.searchResultItem,
                    selectedFoods.some(f => f.foodId === item.foodId) && styles.selectedSearchItem
                  ]}
                  onPress={() => handleSelectFood(item)}
                >
                  {item.image ? (
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.foodImage}
                      defaultSource={require('../../assets/images/APPLOGO.png')}
                    />
                  ) : (
                    <View style={[styles.foodImage, styles.defaultFoodImage]}>
                      <Ionicons name="restaurant" size={24} color="#FF6B6B" />
                    </View>
                  )}
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodTitle} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text style={styles.foodNutrients}>
                      {Math.round(item.nutrients.ENERC_KCAL)} kcal | 
                      P: {Math.round(item.nutrients.PROCNT)}g | 
                      F: {Math.round(item.nutrients.FAT)}g | 
                      C: {Math.round(item.nutrients.CHOCDF)}g
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    );
  };

  const handleFoodSelect = (food: Food) => {
    setSelectedFoods([...selectedFoods, food]);
    updateTotalNutrients([...selectedFoods, food]);
  };

  const handleRemoveFood = (index: number) => {
    const newFoods = selectedFoods.filter((_, i) => i !== index);
    setSelectedFoods(newFoods);
    updateTotalNutrients(newFoods);
  };

  const updateFoodQuantity = (index: number, quantity: number) => {
    const newFoods = [...selectedFoods];
    newFoods[index] = { ...newFoods[index], quantity };
    setSelectedFoods(newFoods);
    updateTotalNutrients(newFoods);
  };

  const updateTotalNutrients = (foods: Food[]) => {
    const totals = foods.reduce((acc, food) => ({
      calories: acc.calories + (food.nutrients.ENERC_KCAL * food.quantity),
      protein: acc.protein + (food.nutrients.PROCNT * food.quantity),
      fat: acc.fat + (food.nutrients.FAT * food.quantity),
      carbs: acc.carbs + (food.nutrients.CHOCDF * food.quantity)
    }), {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0
    });

    setTotalNutrients(totals);
  };

  const renderMealItems = (mealType: string) => {
    const meals = plannedMeals[mealType] || [];
    if (meals.length === 0) {
      return <Text style={styles.mealSubtitle}>No meals planned</Text>;
    }
    
    return meals.map((meal: any, index: number) => (
      <View key={index} style={styles.plannedMealItem}>
        <View style={styles.plannedMealHeader}>
          <View style={styles.plannedMealInfo}>
            <Text style={styles.plannedMealTime}>
              {moment(meal.createdAt).format('h:mm A')}
            </Text>
            <TouchableOpacity 
              onPress={() => handleDeleteMeal(meal.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.foodsList}>
          {meal.foods.map((food: any, foodIndex: number) => (
            <View key={foodIndex} style={styles.foodItem}>
              {food.image && (
                <Image 
                  source={{ uri: food.image }} 
                  style={styles.smallFoodImage} 
                />
              )}
              <View style={styles.foodDetails}>
                <Text style={styles.foodName}>
                  {food.label} ({food.quantity} {food.measureLabel})
                </Text>
                <Text style={styles.foodNutrients}>
                  {Math.round(food.nutrients.calories)} cal
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalNutrients}>
          <Text style={styles.totalNutrientsTitle}>Total Nutrients:</Text>
          <Text style={styles.nutrientText}>
            Calories: {meal.totalNutrients.calories} | 
            Protein: {meal.totalNutrients.protein}g | 
            Fat: {meal.totalNutrients.fat}g | 
            Carbs: {meal.totalNutrients.carbs}g
          </Text>
        </View>
      </View>
    ));
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      const mealRef = doc(db, `users/${user?.id}/plannedMeals/${mealId}`);
      await deleteDoc(mealRef);
      fetchPlannedMeals();
    } catch (error) {
      console.error('Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal');
    }
  };

  const handleMealTypePress = (mealType: string) => {
    setSelectedMealType(mealType);
    setShowSearchView(true);
    setSearchResults([]);
    setSelectedFoods([]);
    setTotalNutrients({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0
    });
  };

  const getMealGradient = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return ['#FFE5E5', '#FFF0F0'];
      case 'lunch':
        return ['#E5F9FF', '#F0FAFF'];
      case 'dinner':
        return ['#E5FFE9', '#F0FFF2'];
      case 'snacks':
        return ['#FFE5F6', '#FFF0F9'];
      default:
        return ['#FFF', '#FFF'];
    }
  };

  const handleBackPress = () => {
    setShowSearchView(false);
    setSelectedFoods([]);
    setSearchResults([]);
    setTotalNutrients({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0
    });
  };

  return (
    <View style={styles.container}>
      {showSearchView ? (
        <SearchResultsView />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#FF6B6B', '#FFA5A5']}
            style={styles.introContainer}
          >
            <Text style={styles.welcomeText}>Welcome to Meal Planner</Text>
            <Text style={styles.introText}>
              Plan your meals, track nutrients, and maintain a healthy lifestyle
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{Object.keys(plannedMeals).length}</Text>
                <Text style={styles.statLabel}>Planned Meals</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {moment(selectedDate).format('DD')}
                </Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={day => setSelectedDate(day.dateString)}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: '#FF6B6B' }
              }}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                selectedDayBackgroundColor: '#FF6B6B',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#FF6B6B',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#FF6B6B',
                monthTextColor: '#2d4150',
                textDayFontSize: 14,
                textMonthFontSize: 14,
                textDayHeaderFontSize: 12,
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
              }}
            />
          </View>

          <View style={styles.mealsGrid}>
            {mealTimes.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                style={styles.mealCard}
                onPress={() => handleMealTypePress(meal.id)}
              >
                <LinearGradient
                  colors={getMealGradient(meal.id)}
                  style={styles.mealCardGradient}
                >
                  <View style={styles.mealIconContainer}>
                    <Ionicons name={meal.icon} size={24} color="#FF6B6B" />
                  </View>
                  <Text style={styles.mealCardTitle}>{meal.title}</Text>
                  {plannedMeals[meal.id]?.length > 0 ? (
                    <View style={styles.mealCountBadge}>
                      <Text style={styles.mealCountText}>
                        {plannedMeals[meal.id].length} {plannedMeals[meal.id].length === 1 ? 'plan' : 'plans'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.addMealText}>Add meal</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.plannedMealsContainer}>
            {mealTimes.map((meal) => (
              <View key={meal.id}>
                {plannedMeals[meal.id]?.length > 0 && (
                  <View style={styles.mealSection}>
                    <Text style={styles.mealSectionTitle}>{meal.title}</Text>
                    {renderMealItems(meal.id)}
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  introContainer: {
    padding: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  introText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  calendarContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 3,
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  mealCard: {
    width: '47%',
    height: 90,
    marginHorizontal: '1.5%',
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  mealCardGradient: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3436',
    textAlign: 'center',
  },
  mealCountBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  mealCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addMealText: {
    fontSize: 11,
    color: '#95A5A6',
    marginTop: 4,
  },
  plannedMealsContainer: {
    padding: 20,
  },
  mealSection: {
    marginBottom: 20,
  },
  mealSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 10,
  },
  mealSubtitle: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 10,
    textAlign: 'center',
  },
  plannedMealItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  plannedMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  plannedMealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plannedMealTime: {
    fontSize: 14,
    color: '#636E72',
    marginRight: 10,
  },
  deleteButton: {
    padding: 5,
  },
  foodsList: {
    marginBottom: 10,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  smallFoodImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  foodDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
  },
  foodNutrients: {
    fontSize: 12,
    color: '#636E72',
  },
  totalNutrients: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  totalNutrientsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 5,
  },
  nutrientText: {
    fontSize: 12,
    color: '#636E72',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: height * 0.1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '95%',
    maxHeight: height * 0.7,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 10,
  },
  modalMainContent: {
    flexDirection: 'column',
    gap: 12,
    marginVertical: 12,
  },
  selectedFoodsSection: {
    maxHeight: height * 0.25,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
  },
  searchResultsSection: {
    maxHeight: height * 0.25,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 10,
  },
  selectedFoodsScroll: {
    flex: 1,
  },
  selectedFoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  foodImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultFoodImage: {
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  foodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  foodNutrients: {
    fontSize: 13,
    color: '#636E72',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityInput: {
    width: 50,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  measureLabel: {
    fontSize: 14,
    color: '#636E72',
  },
  nutrientsSummary: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  nutrientText: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 4,
  },
  searchResultsScroll: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  loader: {
    marginTop: 20,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFF0F0',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    marginLeft: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  backButton: {
    marginRight: 15,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3436',
    marginRight: 10,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchResultItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  defaultFoodImage: {
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  foodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 4,
  },
  foodNutrients: {
    fontSize: 13,
    color: '#636E72',
  },
  loader: {
    marginTop: 20,
  },
  emptyResults: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
  },
  selectedSearchItem: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF6B6B',
  },
  selectedFoodsCounter: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  counterBadge: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  counterText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  counterLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  counterBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  counterText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MealPlanner; 
