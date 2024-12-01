import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

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

interface FoodSearchViewProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Food[];
  selectedFoods: Food[];
  isSearching: boolean;
  totalNutrients: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  onSearch: () => void;
  onFoodSelect: (food: Food) => void;
  onFoodRemove: (index: number) => void;
  onQuantityChange: (index: number, quantity: number) => void;
  onBack: () => void;
  onDone: () => void;
}

const FoodSearchView: React.FC<FoodSearchViewProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  selectedFoods,
  isSearching,
  totalNutrients,
  onSearch,
  onFoodSelect,
  onFoodRemove,
  onQuantityChange,
  onBack,
  onDone,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.searchTitle}>Search Foods</Text>
      </View>

      {selectedFoods.length > 0 && (
        <View style={styles.selectedFoodsSummary}>
          <Text style={styles.summaryTitle}>Selected Foods ({selectedFoods.length})</Text>
          
          <ScrollView style={styles.selectedFoodsCardsScroll}>
            {selectedFoods.map((food, index) => (
              <View key={index} style={styles.selectedFoodCard}>
                <View style={styles.foodCardHeader}>
                  {food.image ? (
                    <Image 
                      source={{ uri: food.image }} 
                      style={styles.selectedFoodImage}
                      defaultSource={require('../../assets/images/APPLOGO.png')}
                    />
                  ) : (
                    <View style={[styles.selectedFoodImage, styles.defaultFoodImage]}>
                      <Ionicons name="restaurant" size={24} color="#FF6B6B" />
                    </View>
                  )}
                  <View style={styles.selectedFoodInfo}>
                    <Text style={styles.selectedFoodTitle}>{food.label}</Text>
                    <Text style={styles.selectedFoodNutrients}>
                      {Math.round(food.nutrients.ENERC_KCAL * food.quantity)} cal | 
                      P: {Math.round(food.nutrients.PROCNT * food.quantity)}g | 
                      F: {Math.round(food.nutrients.FAT * food.quantity)}g | 
                      C: {Math.round(food.nutrients.CHOCDF * food.quantity)}g
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => onFoodRemove(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.servingContainer}>
                  <Text style={styles.servingLabel}>Serving Size:</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => onQuantityChange(index, Math.max(0.5, food.quantity - 0.5))}
                    >
                      <Ionicons name="remove" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                    
                    <TextInput
                      style={styles.quantityInput}
                      value={food.quantity.toString()}
                      onChangeText={(text) => {
                        const newQuantity = parseFloat(text) || 0.5;
                        onQuantityChange(index, newQuantity);
                      }}
                      keyboardType="numeric"
                    />
                    
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => onQuantityChange(index, food.quantity + 0.5)}
                    >
                      <Ionicons name="add" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                    
                    <Text style={styles.measureLabel}>{food.measureLabel}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.nutrientsSummary}>
            <Text style={styles.nutrientsSummaryTitle}>Total Nutrients</Text>
            <Text style={styles.nutrientText}>
              Calories: {Math.round(totalNutrients.calories)} | 
              Protein: {Math.round(totalNutrients.protein)}g | 
              Fat: {Math.round(totalNutrients.fat)}g | 
              Carbs: {Math.round(totalNutrients.carbs)}g
            </Text>
          </View>
        </View>
      )}

      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => {
            Keyboard.dismiss();
            onSearch();
          }}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => {
            Keyboard.dismiss();
            onSearch();
          }}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isSearching ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
      ) : (
        <ScrollView style={styles.searchResults}>
          {searchResults.map((item, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.searchResultItem}
              onPress={() => onFoodSelect(item)}
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
                  {Math.round(item.nutrients.ENERC_KCAL)} cal | 
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
          onPress={onDone}
        >
          <Text style={styles.doneButtonText}>
            Done ({selectedFoods.length} items)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
  },
  // ... (rest of your existing styles)
});

export default FoodSearchView; 