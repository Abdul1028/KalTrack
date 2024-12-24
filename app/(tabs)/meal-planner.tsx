import React, { useState, useEffect } from 'react';
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
  Keyboard
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
  const [searchQuery, setSearchQuery] = useState('');
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
    if (selectedFoods.length === 0) {
      Alert.alert('Error', 'Please add at least one food item');
      return;
    }

    try {
      const mealId = `${selectedDate}-${selectedMealType}-${Date.now()}`;
      const mealRef = doc(db, `users/${user?.id}/plannedMeals/${mealId}`);
      
      const mealData = {
        id: mealId,
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
        },
        mealType: selectedMealType,
        date: selectedDate,
        createdAt: new Date().toISOString(),
        userId: user?.id
      };

      await setDoc(mealRef, mealData);

      fetchPlannedMeals();
      
      setModalVisible(false);
      setSelectedFoods([]);
      setSearchResults([]);
      setSearchQuery('');
      
      Alert.alert('Success', 'Meal added to your plan');
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Error', 'Failed to add meal to your plan');
    }
  };

  const searchFoods = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSearchView(true);
    setModalVisible(false);
    Keyboard.dismiss();
    
    try {
      const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodeURIComponent(searchQuery)}`;
      
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
          quantity: 1,
          measureURI: hint.measures?.[0]?.uri,
          measureLabel: hint.measures?.[0]?.label
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

  const renderModalContent = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Add Food to {selectedMealType}</Text>
      
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchFoods}
          returnKeyType="search"


        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={searchFoods}
          disabled={!searchQuery.trim()}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.modalMainContent}>
        <View style={styles.selectedFoodsSection}>
          <Text style={styles.sectionTitle}>Selected Foods</Text>
          <ScrollView style={styles.selectedFoodsScroll}>
            {selectedFoods.length === 0 ? (
              <Text style={styles.emptyMessage}>No foods selected yet</Text>
            ) : (
              <>
                {selectedFoods.map((food, index) => (
                  <View key={index} style={styles.selectedFoodItem}>
                    {food.image && (
                      <Image 
                        source={{ uri: food.image }} 
                        style={styles.foodImage}
                        defaultSource={require('../../assets/images/APPLOGO.png')}
                      />
                    )}
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodTitle}>{food.label}</Text>
                      <View style={styles.quantityContainer}>
                        <TextInput
                          style={styles.quantityInput}
                          value={food.quantity.toString()}
                          onChangeText={(text) => updateFoodQuantity(index, Number(text) || 1)}
                          keyboardType="numeric"
                          returnKeyType='done'
                        />
                        <Text style={styles.measureLabel}>{food.measureLabel}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveFood(index)}>
                      <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <View style={styles.nutrientsSummary}>
                  <Text style={styles.summaryTitle}>Total Nutrients</Text>
                  <Text style={styles.nutrientText}>Calories: {Math.round(totalNutrients.calories)} kcal</Text>
                  <Text style={styles.nutrientText}>Protein: {Math.round(totalNutrients.protein)}g</Text>
                  <Text style={styles.nutrientText}>Fat: {Math.round(totalNutrients.fat)}g</Text>
                  <Text style={styles.nutrientText}>Carbs: {Math.round(totalNutrients.carbs)}g</Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>

        <View style={styles.searchResultsSection}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <ScrollView style={styles.searchResultsScroll}>
            {isSearching ? (
              <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
            ) : searchResults.length === 0 ? (
              <Text style={styles.emptyMessage}>Search for foods to add</Text>
            ) : (
              searchResults.map((item, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => handleFoodSelect(item)}
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
                    <Text style={styles.foodTitle}>{item.label}</Text>
                    <Text style={styles.foodNutrients}>
                      {Math.round(item.nutrients.ENERC_KCAL)} kcal | 
                      P: {Math.round(item.nutrients.PROCNT)}g | 
                      F: {Math.round(item.nutrients.FAT)}g | 
                      C: {Math.round(item.nutrients.CHOCDF)}g
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => {
            setModalVisible(false);
            setSelectedFoods([]);
            setSearchResults([]);
            setSearchQuery('');
          }}
        >
          <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
        </TouchableOpacity>
        
        {selectedFoods.length > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.addButton]}
            onPress={handleAddMeal}
          >
            <Text style={[styles.buttonText, styles.addButtonText]}>Add Meal</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const SearchResultsView = () => (
    <View style={styles.searchViewContainer}>
      <View style={styles.searchHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            setShowSearchView(false);
            setModalVisible(true);
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.searchTitle}>Search Results</Text>
      </View>

      {selectedFoods.length > 0 && (
        <TouchableOpacity
          style={styles.selectedFoodsSummaryButton}
          onPress={() => {
            setShowSearchView(false);
            router.push({
              pathname: "/selected-foods",
              params: {
                selectedFoods: JSON.stringify(selectedFoods),
                mealType: selectedMealType,
                date: selectedDate
              }
            });
          }}
        >
          <Text style={styles.selectedFoodsSummaryText}>
            {selectedFoods.length} items selected
          </Text>
          <Text style={styles.totalCaloriesText}>
            {Math.round(totalNutrients.calories)} cal
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.fullSearchInput}
          placeholder="Search foods..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchFoods}
          autoFocus
          returnKeyType="search"
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={searchFoods}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isSearching ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
      ) : (
        <ScrollView style={styles.fullSearchResults}>
          {searchResults.map((item, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.fullSearchItem}
              onPress={() => handleFoodSelect(item)}
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
                <Text style={styles.foodTitle}>{item.label}</Text>
                <Text style={styles.foodNutrients}>
                  {Math.round(item.nutrients.ENERC_KCAL)} kcal | 
                  P: {Math.round(item.nutrients.PROCNT)}g | 
                  F: {Math.round(item.nutrients.FAT)}g | 
                  C: {Math.round(item.nutrients.CHOCDF)}g
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedFoods.length > 0 && (
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={() => {
            setShowSearchView(false);
            setModalVisible(true);
          }}
        >
          <Text style={styles.doneButtonText}>
            Done ({selectedFoods.length} items)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {showSearchView ? (
        <SearchResultsView />
      ) : (
        <>
          <Text style={styles.headerTitle}>Meal Planner</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
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
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
              }}
            />

            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateText}>
                {moment(selectedDate).format('MMMM D, YYYY')}
              </Text>
            </View>

            <View style={styles.mealsContainer}>
              {mealTimes.map((meal) => (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealIconContainer}>
                      <Ionicons name={meal.icon} size={24} color="#FF6B6B" />
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealTitle}>{meal.title}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectedMealType(meal.id);
                        setModalVisible(true);
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.mealContent}>
                    {renderMealItems(meal.id)}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              {renderModalContent()}
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 20,
    textAlign: 'center',
  },
  selectedDateContainer: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  mealsContainer: {
    gap: 20,
    marginBottom: 20,
  },
  mealCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealIconContainer: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 8,
    marginRight: 10,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
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
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  selectedFoodsSummaryButton: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedFoodsSummaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  totalCaloriesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  fullSearchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  fullSearchResults: {
    flex: 1,
    marginBottom: 20,
  },
  fullSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  doneButton: {
    backgroundColor: '#FF6B6B',
    margin: 20,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedFoodsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  selectedFoodsModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  closeButton: {
    padding: 5,
  },
  selectedFoodsScroll: {
    padding: 20,
  },
  selectedFoodCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  foodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedFoodImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  selectedFoodInfo: {
    flex: 1,
  },
  selectedFoodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 4,
  },
  selectedFoodNutrients: {
    fontSize: 13,
    color: '#636E72',
  },
  servingContainer: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  servingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 10,
  },
  sliderContainer: {
    marginVertical: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 5,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  measurePickerContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  measurePicker: {
    height: 40,
    width: '100%',
  },
  totalNutrientsCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  totalNutrientsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  totalNutrientsText: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 4,
  },
});

export default MealPlanner; 
