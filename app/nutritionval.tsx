import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { StyleSheet, Image, Text, View, Dimensions, Pressable, TouchableOpacity, Alert, ScrollView, Platform } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle, 
  withSpring,
  withTiming,
  useSharedValue
} from 'react-native-reanimated';

const { width } = Dimensions.get("window");

import * as Notifications from 'expo-notifications';
import Constants from "expo-constants";

import { addDoc, arrayUnion, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import moment from 'moment';
import { useUser } from "@clerk/clerk-expo";
import { ActivityIndicator } from "react-native-paper";
import { setLogLevel } from "firebase/app";


// Define the notification actions no need as of now
// const notificationActions = [
//   {
//     identifier: 'RESET_ACTION',
//     buttonTitle: 'Okay Reset',
//     options: { opensAppToForeground: true },  // Ensures the app opens
//   },
//   {
//     identifier: 'NO_ACTION',
//     buttonTitle: 'No',
//     options: { opensAppToForeground: false },  // The app stays in the background
//   },
// ];

// Request permission and schedule the notification with actions
export async function scheduleMidnightNotification(id:any) {
  console.log("notifications scheduled")

  // Cancel any previously scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  let token;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to send notifications was denied');
    return;
  }
// Schedule the notification with action buttons
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Health Update",
      body: await getNotificationBody(id),
      sound: true,
    },

    trigger: {
      hour: 23,      // 5 PM
      minute: 59,     // Time for daily notification
      repeats: true, // Repeat every day
    },
  });
}


export async function getNotificationBody(userId: any) {
  const currentDate = moment().format('DD-MM-YYYY');

  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  // Check if user document exists
  if (!userDocSnap.exists()) {
    throw new Error('User data not found');
  }

  // Get maintenanceCalories from user's main document
  const userData = userDocSnap.data();
  const maintenanceCalories = userData?.maintenanceCalories;
  const goal = userData?.userGoal;

  if (maintenanceCalories === undefined) {
    throw new Error('Maintenance calories not found for user');
  }

  // Reference to user's nutrition data for the current day
  const nutritionDocRef = doc(db, `users/${userId}/NutritionData/${currentDate}`);
  const nutritionDocSnap = await getDoc(nutritionDocRef);
  let totalCalories;
  // If nutrition document exists, fetch totalCalories
  if (nutritionDocSnap.exists()) {
    const nutritionData = nutritionDocSnap.data();
    totalCalories = nutritionData?.calories // Default to 0 if calories is missing
  }
  console.log(Math.floor(maintenanceCalories));
  console.log(Math.floor(totalCalories));
  console.log(goal);

  if(goal === "weight gain"){

          // Compare totalCal,ories with maintenanceCalories and create the notification body
  if (Math.floor(totalCalories) >= Math.floor(maintenanceCalories)) {
    return `Hurray 🎉 You've eaten ${Math.floor(totalCalories) - Math.floor(maintenanceCalories) } calories in surplus today!`;
  } 
  
  else if(Math.floor(maintenanceCalories) == Math.floor(totalCalories)){
    return "You did it 😊!!! You are maintaining up with your calories"
  }

  else {
    return `Hard luck, You are ${Math.floor(maintenanceCalories)-Math.floor(totalCalories)} calories deficit today 😥`;
  }

  }
  else{

    if (Math.floor(totalCalories) >= Math.floor(maintenanceCalories)) {
      return `Hard Luck 💔 You've eaten ${Math.floor(totalCalories) - Math.floor(maintenanceCalories) } calories in surplus today 😥`;
    } 
    
    else if(Math.floor(maintenanceCalories) == Math.floor(totalCalories)){
      return "You did it 😊!!! You are maintaining up with your calories"
    }
  
    else {
      return `Hurray 🎉, You are ${Math.floor(maintenanceCalories)-Math.floor(totalCalories)} calories deficit today `;
    }

  }
}


// Set up the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function updateMealsTaken(userId:any,meals:any,mealType:any){
  const currentDate = moment().format('DD-MM-YYYY'); // Format current date
    // Reference to the Meals collection inside NutritionData for the specific date and meal type
    const mealsCollectionRef = collection(db, `users/${userId}/NutritionData/${currentDate}/Meals`);

    try {
      await addDoc(mealsCollectionRef, {name:meals.name,protien:meals.pros,calorie:meals.energy,carbohydrates:meals.carbs,mealType:mealType});
      console.log("New meal added successfully");
    } catch (error) {
      console.error("Error adding meal: ", error);
    }

}


export default function nutritionval() {

const {user} = useUser();

const [loading,setLoading] = useState(false);

async function updateNutritionData(userId:any, foodData:any, mealType:any) {
  setLoading(true);
  const currentDate = moment().format('DD-MM-YYYY'); // Format current date
  const nutritionDocRef = doc(db, `users/${userId}/NutritionData/${currentDate}`);

  // Fetch existing data if it exists
  const docSnap = await getDoc(nutritionDocRef);

  // Calculate new nutrition values
  const newCalories = Number(foodData.energy); // Ensure the value is a number
  const newProtein = Number(foodData.pros);
  const newCarbs = Number(foodData.carbs);

  if (docSnap.exists()) {
    // If document exists, update the existing values
    const existingData = docSnap.data();
    const updatedData = {
      calories: Number(existingData.calories || 0) + newCalories,
      protein: Number(existingData.protein || 0) + newProtein,
      carbs: Number(existingData.carbs || 0) + newCarbs,
    };

    await setDoc(nutritionDocRef, updatedData);
  } else {
    const newData = {
      calories: newCalories,
      protein: newProtein,
      carbs: newCarbs,
    };

    await setDoc(nutritionDocRef, newData);
  }
  setLoading(false);
  Alert.alert("Meals Nutrition Updated")
  console.log("Nutrition data updated for date:", currentDate);
  console.log("meal type is in update call fnc: "+mealType);
  updateMealsTaken(userId,foodData,mealType);
}

  const item = useLocalSearchParams();
  getNotificationBody(user?.id);
  
  const formatToTwoDecimals = (num:any) => {
    if (isNaN(num)) return '0.00'; // Handle non-numeric values
    return (Math.round(num * 100) / 100).toFixed(2);
  };

  const getToken = async ()=>{
    let token;
    try {
      console.log("token called: ")
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        console.log(projectId);
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(token);
    } catch (e) {
      token = `${e}`;
    }
  }

  const renderNutrientCard = (label: string, value: any, unit: string, icon: string, color: string) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50);

    useEffect(() => {
      opacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(0, { delay: 300 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }]
    }));

    return (
      <Animated.View style={[styles.nutrientCard, { backgroundColor: `${color}10` }, animatedStyle]}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.nutrientLabel}>{label}</Text>
        <Text style={[styles.nutrientValue, { color }]}>
          {value ? formatToTwoDecimals(value) : '0.00'} {unit}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInDown.duration(500)}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Pressable 
            style={styles.backButton}
            onPress={() => { router.navigate("/(tabs)/home") }}
          >
            <Ionicons name="arrow-back" color="#FF6B6B" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Nutrition Details</Text>
        </View>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#666" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View 
        entering={FadeInUp.duration(500)}
        style={styles.imageContainer}
      >
        <Image
          style={styles.mainImage}
          source={
            item.pic 
              ? { uri: item.pic }
              : require('../assets/images/splash.png') // Add a default food image to your assets
          }
          defaultSource={require('../assets/images/splash.png')}
          onError={(e) => {
            console.log('Image loading error:', e.nativeEvent.error);
            // You could set a state here to show the default image
          }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        >
          <Text style={styles.dishTitle}>{item.name || 'Food Item'}</Text>
          <View style={styles.caloriesBadge}>
            <Ionicons name="flame" size={20} color="#FF6B6B" />
            <Text style={styles.caloriesText}>
              {Math.floor(item?.energy || 0)} calories
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {!item || Object.keys(item).length === 0 ? (
        <View style={styles.noDataContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.noDataText}>Loading nutritional information...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            <View style={styles.servingContainer}>
              <Text style={styles.sectionTitle}>Serving Size</Text>
              <View style={styles.servingBadge}>
                <Text style={styles.servingText}>{item.servings}g</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Nutrition Facts</Text>
            <View style={styles.nutrientsGrid}>
              {renderNutrientCard('Protein', item?.pros, 'g', 'fitness-outline', '#FF6B6B')}
              {renderNutrientCard('Carbs', item?.carbs, 'g', 'restaurant-outline', '#4ECDC4')}
              {renderNutrientCard('Fat', item?.fats, 'g', 'water-outline', '#45B7D1')}
              {renderNutrientCard('Fiber', item?.fibres, 'g', 'leaf-outline', '#96CEB4')}
            </View>

            <View style={styles.buttonContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#FF6B6B" />
              ) : (
                <TouchableOpacity
                  style={styles.consumeButton}
                  onPress={
                    () => updateNutritionData(user?.id, {
                    energy: item.energy,
                    pros: item.pros,
                    carbs: item.carbs,
                    name: item.name
                  }, item.mealType)}
                >
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Ionicons name="add-circle-outline" size={24} color="white" />
                    <Text style={styles.consumeButtonText}>Add to Daily Intake</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb-outline" size={24} color="#FFB347" />
                <Text style={styles.tipTitle}>Nutrition Tip</Text>
              </View>
              <Text style={styles.tipText}>
                A balanced diet with proper nutrition is key to maintaining good health and energy levels throughout the day.
              </Text>
            </View>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 15,
    color: '#333',
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    height: width * 0.6,
    width: '100%',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  dishTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginLeft: 5,
  },
  contentContainer: {
    padding: 20,
  },
  servingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  servingBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  servingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  nutrientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  nutrientCard: {
    width: '48%',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  nutrientLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 5,
  },
  nutrientValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  consumeButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  consumeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  tipCard: {
    backgroundColor: '#FFF9E7',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFB347',
    marginLeft: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
