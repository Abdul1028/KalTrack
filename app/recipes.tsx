import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@clerk/clerk-expo';
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const EDAMAM_APP_ID = '56082498';
const EDAMAM_APP_KEY = '7e45de6c1b73f0dd65efc3eb5ab33ea5';



interface Recipe {
  uri: string;
  label: string;
  image: string;
  source: string;
  dietLabels: string[];
  healthLabels: string[];
  calories: number;
  totalTime: number;
}

export default function RecipesScreen() {
  const { user } = useUser();
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedDiet, setSelectedDiet] = useState<string>('');

  const dietTypes = [
    { label: 'All', value: '' },
    { label: 'Keto', value: 'keto-friendly' },
    { label: 'Vegan', value: 'vegan' },
    { label: 'Vegetarian', value: 'vegetarian' },
    { label: 'Paleo', value: 'paleo' },
  ];

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.id));
    if (userDoc.exists() && userDoc.data().favoriteRecipes) {
      setFavorites(userDoc.data().favoriteRecipes);
    }
  };

  const searchRecipes = async () => {
    if (!ingredients.trim()) return;

    setLoading(true);
    try {
      let url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(
        ingredients
      )}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`;

      if (selectedDiet) {
        url += `&health=${selectedDiet}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      console.log('API Response:', data);

      if (data && data.hits && Array.isArray(data.hits)) {
        setRecipes(data.hits.map((hit: any) => ({
          uri: hit.recipe.uri,
          label: hit.recipe.label,
          image: hit.recipe.image,
          source: hit.recipe.source,
          dietLabels: hit.recipe.dietLabels || [],
          healthLabels: hit.recipe.healthLabels || [],
          calories: hit.recipe.calories || 0,
          totalTime: hit.recipe.totalTime || 0
        })));
      } else {
        console.log('No recipes found or invalid response format');
        setRecipes([]);
      }
    } catch (error) {
      console.error('Error searching recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (recipe: Recipe) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.id);
    const recipeId = recipe.uri.split('#recipe_')[1];

    if (favorites.includes(recipeId)) {
      await updateDoc(userRef, {
        favoriteRecipes: arrayRemove(recipeId),
      });
      setFavorites(favorites.filter(id => id !== recipeId));
    } else {
      await updateDoc(userRef, {
        favoriteRecipes: arrayUnion(recipeId),
      });
      setFavorites([...favorites, recipeId]);
    }
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => {
    const recipeId = item.uri.split('#recipe_')[1];
    const isFavorite = favorites.includes(recipeId);

    return (
      <TouchableOpacity style={styles.recipeCard}>
        <Image source={{ uri: item.image }} style={styles.recipeImage} />
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle}>{item.label}</Text>
          <Text style={styles.recipeDetails}>
            {Math.round(item.calories)} cal | {item.totalTime} min
          </Text>
          <View style={styles.dietLabels}>
            {item.dietLabels.map((label, index) => (
              <Text key={index} style={styles.dietLabel}>
                {label}
              </Text>
            ))}
          </View>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#FF6B6B' : '#666'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter ingredients (e.g., chicken, rice)"
          value={ingredients}
          onChangeText={setIngredients}
          onSubmitEditing={searchRecipes}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchRecipes}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dietFilters}
      >
        {dietTypes.map((diet) => (
          <TouchableOpacity
            key={diet.value}
            style={[
              styles.dietFilter,
              selectedDiet === diet.value && styles.selectedDietFilter,
            ]}
            onPress={() => setSelectedDiet(diet.value)}
          >
            <Text
              style={[
                styles.dietFilterText,
                selectedDiet === diet.value && styles.selectedDietFilterText,
              ]}
            >
              {diet.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.uri}
          contentContainerStyle={styles.recipeList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    fontSize: 16,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dietFilters: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  dietFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  selectedDietFilter: {
    backgroundColor: '#FF6B6B',
  },
  dietFilterText: {
    color: '#666',
    fontSize: 14,
  },
  selectedDietFilterText: {
    color: '#fff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeList: {
    padding: 16,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recipeDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dietLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dietLabel: {
    fontSize: 12,
    color: '#FF6B6B',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  favoriteButton: {
    padding: 12,
  },
}); 