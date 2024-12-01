import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@clerk/clerk-expo';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import moment from 'moment';

export default function AddMeal() {
  const { mealType } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!mealType) {
      Alert.alert('Error', 'Please select a meal category first');
      router.back();
    }
  }, []);

  const searchFood = async (query: string) => {
    if (!mealType) {
      Alert.alert('Error', 'Please select a meal category first');
      return;
    }
    if (query.length < 2) return;
    setLoading(true);
    
    try {
      const APP_ID = '56082498';
      const APP_KEY = '7e45de6c1b73f0dd65efc3eb5ab33ea5';
      
      const response = await fetch(
        `https://api.edamam.com/api/food-database/v2/parser?app_id=${APP_ID}&app_key=${APP_KEY}&ingr=${query}`
      );
      const data = await response.json();
      setSearchResults(data.hints || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to search for food');
    } finally {
      setLoading(false);
    }
  };

  const addFoodToMeal = async (food: any) => {
    if (!user || !mealType) return;
    
    try {
      router.push({
        pathname: "/portion-selector",
        params: {
          foodId: food.food.foodId,
          foodLabel: food.food.label,
          image: food.food.image || "",
          baseCalories: food.food.nutrients?.ENERC_KCAL || 0,
          baseProtein: food.food.nutrients?.PROCNT || 0,
          baseFat: food.food.nutrients?.FAT || 0,
          baseCarbs: food.food.nutrients?.CHOCDF || 0,
          baseFiber: food.food.nutrients?.FIBTG || 0,
          mealType: mealType,
          defaultWeight: 100
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to add food to meal');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Add to {mealType}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for food..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            searchFood(text);
          }}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
      ) : (
        <ScrollView style={styles.resultsList}>
          {searchResults.map((result: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.resultItem}
              onPress={() => addFoodToMeal(result)}
            >
              <View style={styles.resultContent}>
                <Text style={styles.foodName}>{result.food.label}</Text>
                <Text style={styles.calories}>
                  {Math.round(result.food.nutrients.ENERC_KCAL)} calories
                </Text>
              </View>
              <Ionicons name="add-circle-outline" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    margin: 15,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  loader: {
    marginTop: 20,
  },
  resultsList: {
    padding: 15,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultContent: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  calories: {
    fontSize: 14,
    color: '#666',
  },
}); 