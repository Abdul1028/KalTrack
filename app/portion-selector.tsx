import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

export default function PortionSelector() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [weight, setWeight] = useState('100');
  const [inputWeight, setInputWeight] = useState('100');
  const [sliderValue, setSliderValue] = useState(100);
  const [value, setValue] = useState(100);
  const [nutrients, setNutrients] = useState({
    calories: Number(params.baseCalories),
    protein: Number(params.baseProtein),  
    fat: Number(params.baseFat),
    carbs: Number(params.baseCarbs),
    fiber: Number(params.baseFiber)
  });

  // Store base values in a ref to avoid dependency issues
  const baseNutrients = React.useRef({
    calories: Number(params.baseCalories),
    protein: Number(params.baseProtein),
    fat: Number(params.baseFat),
    carbs: Number(params.baseCarbs),
    fiber: Number(params.baseFiber)
  });

  // Calculate nutrients based on weight
  useEffect(() => {
    const weightNum = parseFloat(weight);
    const ratio = weightNum / 100; // Calculate ratio based on 100g

    setNutrients({
      calories: Math.round(baseNutrients.current.calories * ratio),
      protein: Math.round(baseNutrients.current.protein * ratio * 10) / 10,
      fat: Math.round(baseNutrients.current.fat * ratio * 10) / 10,
      carbs: Math.round(baseNutrients.current.carbs * ratio * 10) / 10,
      fiber: Math.round(baseNutrients.current.fiber * ratio * 10) / 10,
    });
  }, [weight]); // Only depend on weight changes

  // When weight input changes, update only the inputWeight state
  const handleWeightInputChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setInputWeight(numericText);
    const rounded = Math.round(value);
    setSliderValue(rounded);
  };

  // When user finishes editing input, update weight and slider
  const handleWeightInputEnd = () => {
    if (inputWeight === '') {
      setInputWeight(weight); // revert to last valid value
      return;
    }
    const parsed = parseInt(inputWeight);
    if (!isNaN(parsed)) {
      setWeight(parsed.toString());
      setSliderValue(parsed);
    }
  };

  // When slider changes, update both states
  const handleSliderChange = (value: number) => {
    const rounded = Math.round(value);
    setSliderValue(rounded);
    setWeight(rounded.toString());
    setInputWeight(rounded.toString());
  };

  const handleConfirm = () => {
    router.push({
      pathname: "/nutritionval",
      params: {
        pic: params.image,
        name: params.foodLabel,
        weight: weight,
        energy: nutrients.calories,
        pros: nutrients.protein,
        fats: nutrients.fat,
        carbs: nutrients.carbs,
        fibres: nutrients.fiber,
        servings: weight,
        mealType: params.mealType,
      }
    });
    console.log("meal type is: "+params.mealType);

  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Portion</Text>
      </View>

      <ScrollView style={styles.content}>
        <Image
          source={{ uri: params.image as string }}
          style={styles.foodImage}
        />
        <Text style={styles.foodName}>{params.foodLabel}</Text>

        <View style={styles.portionSelector}>
          <Text style={styles.label}>Portion Size (grams)</Text>
          
          <View style={styles.weightInput}>
            <TextInput
              style={styles.input}
              value={inputWeight}
              onChangeText={handleWeightInputChange}
              onBlur={handleWeightInputEnd}
              onSubmitEditing={handleWeightInputEnd}
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={styles.unit}>g</Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={500}
            value={sliderValue}
            step={1}
            onSlidingComplete={value => {
              const rounded = Math.round(value);
              setSliderValue(rounded);
              setWeight(rounded.toString());
              setInputWeight(rounded.toString());
            }}
            minimumTrackTintColor="#FF8C00"
            maximumTrackTintColor="#ddd"
          />

          <View style={styles.sliderLabels}>
            <Text>0g</Text>
            <Text>250g</Text>
            <Text>500g</Text>
          </View>
        </View>

        <View style={styles.nutritionPreview}>
          <Text style={styles.previewTitle}>Nutrition Values</Text>
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Calories:</Text>
            <Text style={styles.nutrientValue}>{nutrients.calories} kcal</Text>
          </View>
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Protein:</Text>
            <Text style={styles.nutrientValue}>{nutrients.protein}g</Text>
          </View>
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Carbs:</Text>
            <Text style={styles.nutrientValue}>{nutrients.carbs}g</Text>
          </View>
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Fat:</Text>
            <Text style={styles.nutrientValue}>{nutrients.fat}g</Text>
          </View>
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Fiber:</Text>
            <Text style={styles.nutrientValue}>{nutrients.fiber}g</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>Confirm Portion</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  foodImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 20,
  },
  foodName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
  },
  portionSelector: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  weightInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    width: 100,
    fontSize: 18,
    marginRight: 10,
  },
  unit: {
    fontSize: 18,
    color: '#666',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  nutritionPreview: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nutrientLabel: {
    fontSize: 16,
    color: '#666',
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#FF8C00',
    padding: 16,
    borderRadius: 12,
    margin: 20,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 