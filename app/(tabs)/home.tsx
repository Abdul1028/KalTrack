import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, FlatList, Text, TouchableOpacity, Image, ActivityIndicator, VirtualizedList, Alert } from 'react-native';
// import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';
import { withDecay } from 'react-native-reanimated';
import { green } from 'react-native-reanimated/lib/typescript/reanimated2/Colors';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { orange100 } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';
import { useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { scheduleMidnightNotification} from '../nutritionval';


const mealCategories = [
  { id: 'breakfast', label: 'Breakfast', image: 'data:image/jpeg;base64,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' },
  { id: 'lunch', label: 'Lunch', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIxVVd9Kpqtz5l5TwsM_f8bLZBPSNPaQ9mLw&s' },
  { id: 'dinner', label: 'Dinner', image: 'data:image/jpeg;base64,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' },
];


const home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeight, setSelectedWeight] = useState(100);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const {user} = useUser();

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

  return (
    <View style={styles.container}>
      {/* Search Bar and Dropdown */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="What do you want to eat?"
          placeholderTextColor={"gray"}
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
        <View style={{width:"20%" , height:50,borderColor:"black",borderRadius:25,borderWidth:1}}>
        {/* <RNPickerSelect
          onValueChange={(value) => setSelectedWeight(value)}
          placeholder={{color:"black",label:"gms", }}
          items={[
            { label: '100g', value: 100 },
            { label: '200g', value: 200 },
            { label: '300g', value: 300 },
            { label: '400g', value: 400 },
            { label: '500g', value: 500 },
            { label: '600g', value: 600 },
            { label: '700g', value: 700 },
            { label: '800g', value: 800 },
            { label: '900g', value: 900 },
            { label: '1000g', value: 1000 },
          ]}
          style={pickerSelectStyles}
        /> */}
        </View>
      </View>

      <View >
        <Text style={styles.categoryHeader}>Categories </Text>
      </View>

      {/* Horizontal FlatList for Meal Categories */}
      <View style={{alignItems:"center"}}>
      <FlatList
        data={mealCategories}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedMeal(item.id)}>
            <View style={styles.categoryItem }>
              <Image source={{ uri: item.image} } style={styles.categoryImage} />
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
      </View>

      {/* Dishes List */}

      {/* <View style={styles.dishesContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="orange" />
        ) : (
          <FlatList
            data={dishes}
            keyExtractor={(item) => item.food.foodId}
            renderItem={({ item }) => (
              <TouchableOpacity  onPress={() => {
                router.push({pathname:"/nutritionval",params:{
                  pic:item.food.image || "https://cdn.pixabay.com/photo/2017/02/21/08/49/food-2085075_1280.png",
                  name:item.food.label,
                  energy:item.food.nutrients.ENERC_KCAL,
                  pros:item.food.nutrients.PROCNT,
                  fats:item.food.nutrients.FAT,
                  carbs:item.food.nutrients.CHOCDF,
                  fibres:item.food.nutrients.FIBTG,
                }})
                console.log("sent")
                console.log()
              }}  >
                <View style={styles.dishItem}>
                  <Image source={{ uri: item.food.image ? item.food.image :"https://cdn.pixabay.com/photo/2017/02/21/08/49/food-2085075_1280.png"  } } style={styles.dishImage} />
                  <View style={styles.dishDetails}>
                    <Text style={styles.dishLabel}>{item.food.label}</Text>
                    <Text>Calories: {formatToTwoDecimals(item.food.nutrients.ENERC_KCAL)}</Text>
                    <Text>Weight: {selectedWeight}g</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View> */}

<View style={styles.dishesContainer}>
  {loading ? (
    <ActivityIndicator size="large" color="orange" />
  ) : (
    <FlatList
      data={dishes}
      keyExtractor={(item) => item.food.foodId}
      renderItem={({ item }) => {
        // Find the serving size (assuming the first measure is the standard serving)
        const servingMeasure = item.food.measures?.find(measure => measure.label.toLowerCase() === 'serving');
        console.log(servingMeasure);
        const servingSize = servingMeasure ? servingMeasure.weight : 100; // Fallback to 100g if not found
        const servings = (selectedWeight / servingSize).toFixed(2); // Calculate servings based on selected weight

        return (
          <TouchableOpacity onPress={() => {
            router.push({
              pathname: "/nutritionval",
              params: {
                pic: item.food.image || "https://cdn.pixabay.com/photo/2017/02/21/08/49/food-2085075_1280.png",
                name: item.food.label,
                energy: item.food.nutrients.ENERC_KCAL,
                pros: item.food.nutrients.PROCNT,
                fats: item.food.nutrients.FAT,
                carbs: item.food.nutrients.CHOCDF,
                fibres: item.food.nutrients.FIBTG,
                mealType:selectedMeal,
              }
            });
            console.log("sent");
          }}>
            <View style={styles.dishItem}>
              <Image source={{ uri: item.food.image || "https://cdn.pixabay.com/photo/2017/02/21/08/49/food-2085075_1280.png" }} style={styles.dishImage} />
              <View style={styles.dishDetails}>
                <Text style={styles.dishLabel}>{item.food.label}</Text>
                <Text>Calories: {formatToTwoDecimals(item.food.nutrients.ENERC_KCAL * servings)} kcal</Text>
                <Text>Servings: {servings} (per {selectedWeight}g)</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  )}
</View>


    </View>
  );
};

export default home;


const styles = StyleSheet.create({
  container: {
    marginTop:"10%",
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'black',
    width:"80%",
    borderRadius: 25,
    paddingLeft: 15,
    marginRight: 10,
    height: 50,
  },
  categoryHeader:{
    alignItems:"flex-start",
    fontSize:20,
    fontWeight:"bold",
    marginBottom:14,
    marginLeft:4,
  },
  categoryItem: {
    marginRight: 15,
    alignItems: 'center',
  },
  categoryImage: {
    width: 105,
    height: 100,
    borderRadius: 10,
  },
  categoryLabel: {
    marginTop: 5,
    fontSize: 16,
  },
  dishesContainer: {
    flex: 1,
    marginTop: 20,
  },
  dishItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dishImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  dishDetails: {
    marginLeft: 15,
  },
  dishLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

const pickerSelectStyles = {

  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: 'black',
    paddingRight: 30,
  },

  inputAndroid:{
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius:25,
    borderColor: 'gray',
    color: 'black',
    paddingRight: 30,
  },

};
