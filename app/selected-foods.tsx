import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';
import { doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'
import { useUser } from '@clerk/clerk-expo';
import moment from 'moment';

const { width, height } = Dimensions.get('window');

const commonMeasures = [
  { label: 'Grams', value: 'g' },
  { label: 'Kilograms', value: 'kg' },
  { label: 'Ounces', value: 'oz' },
  { label: 'Pounds', value: 'lb' },
  { label: 'Cups', value: 'cup' },
  { label: 'Tablespoons', value: 'tbsp' },
  { label: 'Teaspoons', value: 'tsp' }
];

// Add conversion factors
const MEASURE_CONVERSIONS = {
  g: 1, // base unit (grams)
  oz: 28.3495, // 1 oz = 28.3495 grams
  lb: 453.592, // 1 lb = 453.592 grams
  kg: 1000, // 1 kg = 1000 grams
  cup: 240, // approximate for general use
  tbsp: 15, // approximate
  tsp: 5, // approximate
  piece: 100, // default 100g per piece, should be customized per food
};

// Add measure ranges
const MEASURE_RANGES = {
  g: { min: 0, max: 1000, step: 10 },    // 0-1000 grams, steps of 10g
  kg: { min: 0, max: 1, step: 0.1 },     // 0-1 kg, steps of 0.1kg
  oz: { min: 0, max: 35, step: 1 },      // 0-35 oz, steps of 1oz
  lb: { min: 0, max: 2.2, step: 0.1 },   // 0-2.2 lbs, steps of 0.1lb
  cup: { min: 0, max: 4, step: 0.25 },   // 0-4 cups, steps of 0.25
  tbsp: { min: 0, max: 64, step: 1 },    // 0-64 tbsp, steps of 1
  tsp: { min: 0, max: 192, step: 1 }     // 0-192 tsp, steps of 1
};

export default function SelectedFoods() {
  const { user } = useUser();
  const params = useLocalSearchParams();
  const [foods, setFoods] = useState([]);
  const [totalNutrients, setTotalNutrients] = useState({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0
  });
  const [showMeasurePicker, setShowMeasurePicker] = useState(false);
  const [activeFoodIndex, setActiveFoodIndex] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (params.selectedFoods) {
      try {
        const parsedFoods = JSON.parse(params.selectedFoods).map(food => ({
          ...food,
          measureLabel: 'g',
          quantity: 10,
          nutrients: {
            ENERC_KCAL: food.nutrients?.ENERC_KCAL || 0,
            PROCNT: food.nutrients?.PROCNT || 0,
            FAT: food.nutrients?.FAT || 0,
            CHOCDF: food.nutrients?.CHOCDF || 0
          }
        }));
        setFoods(parsedFoods);
        updateTotalNutrients(parsedFoods);
      } catch (error) {
        console.error('Error parsing foods:', error);
        setFoods([]);
        setTotalNutrients({
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0
        });
      }
    }
  }, []);

  const updateTotalNutrients = (currentFoods) => {
    const totals = currentFoods.reduce((acc, food) => {
      const measureType = food.measureLabel || 'g';
      const gramsMultiplier = MEASURE_CONVERSIONS[measureType];
      const quantityInGrams = (food.quantity || 10) * gramsMultiplier;
      const baseQuantity = quantityInGrams / 100; // nutrients are usually per 100g

      return {
        calories: acc.calories + ((food.nutrients?.ENERC_KCAL || 0) * baseQuantity),
        protein: acc.protein + ((food.nutrients?.PROCNT || 0) * baseQuantity),
        fat: acc.fat + ((food.nutrients?.FAT || 0) * baseQuantity),
        carbs: acc.carbs + ((food.nutrients?.CHOCDF || 0) * baseQuantity)
      };
    }, {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0
    });

    setTotalNutrients({
      calories: isNaN(totals.calories) ? 0 : totals.calories,
      protein: isNaN(totals.protein) ? 0 : totals.protein,
      fat: isNaN(totals.fat) ? 0 : totals.fat,
      carbs: isNaN(totals.carbs) ? 0 : totals.carbs
    });
  };

  const updateFoodQuantity = (index, quantity) => {
    const newFoods = [...foods];
    newFoods[index] = { ...newFoods[index], quantity };
    setFoods(newFoods);
    updateTotalNutrients(newFoods);
  };

  const handleRemoveFood = (index) => {
    const newFoods = foods.filter((_, i) => i !== index);
    setFoods(newFoods);
    updateTotalNutrients(newFoods);
  };

  const handleCreateMeal = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'Please sign in to add meals');
        return;
      }

      setIsSaving(true);

      const mealId = `${params.date}-${params.mealType}-${Date.now()}`;
      const mealRef = doc(db, `users/${user.id}/plannedMeals/${mealId}`);
      
      const mealData = {
        id: mealId,
        foods: foods.map(food => ({
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
        mealType: params.mealType,
        date: params.date,
        createdAt: new Date().toISOString(),
        userId: user.id
      };

      await setDoc(mealRef, mealData);

      Alert.alert(
        'Success',
        'Meal has been added to your plan!',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsSaving(false);
              setShowConfirmModal(false);
              router.back();
            }
          }
        ],
        { cancelable: false }
      );

    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal');
      setIsSaving(false);
    }
  };

  const ConfirmationModal = () => (
    <Modal
      visible={showConfirmModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowConfirmModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationTitle}>Confirm Meal Plan</Text>
          <Text style={styles.confirmationText}>
            Are you sure these portions are correct?
          </Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.confirmButtonCancel]}
              onPress={() => setShowConfirmModal(false)}
              disabled={isSaving}
            >
              <Text style={styles.confirmButtonTextCancel}>Adjust More</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                styles.confirmButtonConfirm,
                isSaving && styles.confirmButtonDisabled
              ]}
              onPress={handleCreateMeal}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.confirmButtonTextConfirm}>Plan This Meal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adjust Portions</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Total Nutrients Card */}
      <View style={styles.totalNutrientsCard}>
        <View style={styles.nutrientsGrid}>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>{Math.round(totalNutrients.calories)}</Text>
            <Text style={styles.nutrientLabel}>Calories</Text>
          </View>
          <View style={[styles.nutrientItem, styles.nutrientDivider]}>
            <Text style={styles.nutrientValue}>{Math.round(totalNutrients.protein)}g</Text>
            <Text style={styles.nutrientLabel}>Protein</Text>
          </View>
          <View style={[styles.nutrientItem, styles.nutrientDivider]}>
            <Text style={styles.nutrientValue}>{Math.round(totalNutrients.fat)}g</Text>
            <Text style={styles.nutrientLabel}>Fat</Text>
          </View>
          <View style={[styles.nutrientItem, styles.nutrientDivider]}>
            <Text style={styles.nutrientValue}>{Math.round(totalNutrients.carbs)}g</Text>
            <Text style={styles.nutrientLabel}>Carbs</Text>
          </View>
        </View>
      </View>

      {/* Foods List */}
      <ScrollView style={styles.content}>
        {foods.map((food, index) => (
          <View key={index} style={styles.foodCard}>
            <View style={styles.foodHeader}>
              <Image 
                source={{ uri: food.image }} 
                style={styles.foodImage}
                defaultSource={require('../assets/images/APPLOGO.png')}
              />
              <View style={styles.foodInfo}>
                <Text style={styles.foodTitle} numberOfLines={1}>{food.label}</Text>
                <Text style={styles.foodNutrients}>
                  {Math.round(food.nutrients.ENERC_KCAL * food.quantity)} cal
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleRemoveFood(index)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
              </TouchableOpacity>
            </View>

            <View style={styles.servingContainer}>
              <View style={styles.servingRow}>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={MEASURE_RANGES[food.measureLabel || 'g'].min}
                    maximumValue={MEASURE_RANGES[food.measureLabel || 'g'].max}
                    step={MEASURE_RANGES[food.measureLabel || 'g'].step}
                    value={food.quantity || 10}
                    onValueChange={(value) => {
                      const newFoods = [...foods];
                      newFoods[index] = { 
                        ...food, 
                        quantity: value,
                        measureLabel: food.measureLabel || 'g'
                      };
                      setFoods(newFoods);
                      updateTotalNutrients(newFoods);
                    }}
                    minimumTrackTintColor="#FF6B6B"
                    maximumTrackTintColor="#ddd"
                    thumbTintColor="#FF6B6B"
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>
                      {`${MEASURE_RANGES[food.measureLabel || 'g'].min}${food.measureLabel || 'g'}`}
                    </Text>
                    <Text style={styles.quantityText}>
                      {(food.quantity || 10).toFixed(1)}{food.measureLabel || 'g'}
                    </Text>
                    <Text style={styles.sliderLabel}>
                      {`${MEASURE_RANGES[food.measureLabel || 'g'].max}${food.measureLabel || 'g'}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.measurePickerContainer}>
                  <TouchableOpacity 
                    style={styles.measureSelector}
                    onPress={() => {
                      setActiveFoodIndex(index);
                      setShowMeasurePicker(true);
                    }}
                  >
                    <Text style={styles.measureSelectorText}>
                      {food.measureLabel ? commonMeasures.find(m => m.value === food.measureLabel)?.label : 'Grams'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#636E72" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Done Button */}
      <TouchableOpacity 
        style={styles.createMealButton}
        onPress={() => setShowConfirmModal(true)}
      >
        <Text style={styles.createMealButtonText}>Create Meal</Text>
      </TouchableOpacity>

      <Modal
        visible={showMeasurePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMeasurePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMeasurePicker(false)}
        >
          <View style={styles.measureListContainer}>
            <ScrollView>
              {commonMeasures.map((measure) => (
                <TouchableOpacity
                  key={measure.value}
                  style={styles.measureItem}
                  onPress={() => {
                    const oldMeasure = foods[activeFoodIndex].measureLabel || 'g';
                    const newMeasure = measure.value;
                    
                    // Calculate conversion factor
                    const oldToGrams = MEASURE_CONVERSIONS[oldMeasure];
                    const gramsToNew = 1 / MEASURE_CONVERSIONS[newMeasure];
                    const conversionFactor = oldToGrams * gramsToNew;
                    
                    // Update food with new measure and adjusted quantity
                    const newFoods = [...foods];
                    const oldQuantity = newFoods[activeFoodIndex].quantity;
                    let newQuantity = oldQuantity * conversionFactor;
                    
                    // Clamp the new quantity to the measure's range
                    const range = MEASURE_RANGES[newMeasure];
                    newQuantity = Math.min(Math.max(newQuantity, range.min), range.max);
                    
                    newFoods[activeFoodIndex] = {
                      ...newFoods[activeFoodIndex],
                      measureLabel: newMeasure,
                      quantity: newQuantity
                    };
                    
                    setFoods(newFoods);
                    updateTotalNutrients(newFoods);
                    setShowMeasurePicker(false);
                  }}
                >
                  <Text style={[
                    styles.measureItemText,
                    foods[activeFoodIndex]?.measureLabel === measure.value && 
                    styles.measureItemTextSelected
                  ]}>
                    {measure.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <ConfirmationModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  totalNutrientsCard: {
    margin: 12,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nutrientsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutrientItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutrientDivider: {
    borderLeftWidth: 1,
    borderLeftColor: '#F0F0F0',
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  nutrientLabel: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  foodCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 2,
  },
  foodNutrients: {
    fontSize: 13,
    color: '#636E72',
  },
  removeButton: {
    padding: 6,
  },
  servingContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderContainer: {
    flex: 1,
    marginRight: 12,
  },
  slider: {
    height: 32,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 4,
  },
  measurePickerContainer: {
    width: 120,
  },
  measureSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 8,
    height: 36,
  },
  measureSelectorText: {
    fontSize: 14,
    color: '#2D3436',
  },
  createMealButton: {
    backgroundColor: '#FF6B6B',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createMealButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  measureListContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: width * 0.8,
    maxHeight: height * 0.6,
    overflow: 'hidden',
  },
  measureList: {
    maxHeight: height * 0.6,
  },
  measureItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  measureItemText: {
    fontSize: 16,
    color: '#2D3436',
  },
  measureItemTextSelected: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B6B',
  },
  confirmationCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: width * 0.85,
    alignItems: 'center',
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  confirmButtonCancel: {
    backgroundColor: '#F0F0F0',
  },
  confirmButtonConfirm: {
    backgroundColor: '#FF6B6B',
  },
  confirmButtonTextCancel: {
    color: '#636E72',
    fontSize: 15,
    fontWeight: '500',
  },
  confirmButtonTextConfirm: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
}); 