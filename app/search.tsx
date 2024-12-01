import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchDishes = async () => {
    if (!searchQuery) return;
    
    setLoading(true);
    const app_id = '56082498';
    const app_key = '7e45de6c1b73f0dd65efc3eb5ab33ea5';
    
    try {
      const response = await axios.get(`https://api.edamam.com/api/food-database/v2/parser`, {
        params: {
          app_id,
          app_key,
          ingr: searchQuery,
        },
      });
      setDishes(response.data.hints);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchDishes();
    }
  };

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodCard}
      onPress={() => {
        router.push({
          pathname: "/portion-selector",
          params: {
            foodId: item.food.foodId,
            foodLabel: item.food.label,
            image: item.food.image || "",
            baseCalories: item.food.nutrients?.ENERC_KCAL || 0,
            baseProtein: item.food.nutrients?.PROCNT || 0,
            baseFat: item.food.nutrients?.FAT || 0,
            baseCarbs: item.food.nutrients?.CHOCDF || 0,
            baseFiber: item.food.nutrients?.FIBTG || 0,
            defaultWeight: 100
          }
        });
      }}
    >
      <Image 
        source={{ uri: item.food.image || "https://via.placeholder.com/150" }}
        style={styles.foodImage}
      />
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
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={24} color="gray" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for food..."
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="gray" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#FF8C00" />
      ) : (
        <FlatList
          data={dishes}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.food.foodId}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No results found' : 'Start typing to search'}
              </Text>
            </View>
          )}
        />
      )}
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
    paddingTop: Platform.OS === 'android' ? 40 : 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    padding: 15,
  },
  foodCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  foodInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  foodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  nutritionInfo: {
    flexDirection: 'column',
  },
  foodCalories: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  macroContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  macroText: {
    fontSize: 12,
    color: '#888',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  searchButton: {
    marginLeft: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#FF8C00',
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 