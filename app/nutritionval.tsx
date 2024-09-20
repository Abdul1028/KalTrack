import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Image, Text, View, Dimensions, Pressable, TouchableOpacity, Alert } from "react-native";

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
  // Get current date in DD-MM-YYYY format
  const currentDate = moment().format('DD-MM-YYYY');

  // Reference to user's main document (to get maintenanceCalories)
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
      await addDoc(mealsCollectionRef, {name:meals.name,protien:meals.pros,calorie:meals.energy,carbohydrates:meals.carbs,mealTime:mealType});
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
  updateMealsTaken(userId,foodData,mealType);

  scheduleMidnightNotification(userId);
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





  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Pressable onPress={() => { router.navigate("/(tabs)/home") }}>
            <Ionicons name="arrow-back" color={"orange"} size={24} />
          </Pressable>
        </View>
        <Text style={styles.headerTitle}>Nutritional Value</Text>
        <View style={styles.iconWrapper}>
          <Ionicons name="menu" color={"orange"} size={24} />
        </View>
      </View>

      {/* Main Image */}
      <Image
        style={styles.mainImage}
        source={{uri:item.pic} }
      />

      {/* Nutrition Info */}
      <View style={styles.nutritionInfo}>
        <View style={styles.nutritionHeader}>
          <Text style={styles.dishTitle}>{item.name}</Text>
          <Text style={styles.nutritionValue}>Nutrition value</Text>
        </View>
        <View style={styles.nutritionDetails}>
          <Text style={styles.servingSize}>100g</Text>
          <Text style={styles.calories}>{Math.floor(item?.energy)} cal</Text>
        </View>
      </View>

      {/* Nutrition Breakdown */}
      <View style={styles.nutritionBreakdown}>
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Protein</Text>
          <Text style={styles.nutritionValueDetail}>{formatToTwoDecimals(item?.pros)} g</Text>
        </View>
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Carbs</Text>
          <Text style={styles.nutritionValueDetail}>{formatToTwoDecimals(item?.carbs)} g</Text>
        </View>
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Fat</Text>
          <Text style={styles.nutritionValueDetail}>{formatToTwoDecimals(item?.fats)} g</Text>
        </View>
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionLabel}>Fibres</Text>
          <Text style={styles.nutritionValueDetail}>{formatToTwoDecimals(item?.fibres)} g</Text>
        </View>
      </View>

      {/* Consume Button */}
      <View style={styles.buttonContainer}>
        {/* Show loading indicator when loading */}
        {loading ? (
          <ActivityIndicator size="large" color="orange" />
        ) : (
          <TouchableOpacity
            style={styles.consumeButton}
            onPress={() => updateNutritionData(user?.id, { energy: item.energy, pros: item.pros, carbs: item.carbs, name: item.name }, item.mealType)}
          >
            <Text style={styles.consumeButtonText}>Consume</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Call to Action */}
      <View style={styles.cta}>
        <Text style={styles.ctaText}>Health body comes with good nutrition</Text>
        <Text style={styles.ctaSubtext}>Get good nutrition now!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: "14%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.4)",
  },
  icon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: width * 0.06, // Responsive font size
    fontWeight: "500",
  },
  mainImage: {
    width: "100%",
    height: width * 0.5, // Make the height relative to the width
    resizeMode: "cover",
  },
  nutritionInfo: {
    padding: 16,
  },
  nutritionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dishTitle: {
    fontSize: width * 0.06, // Responsive font size
    fontWeight: "500",
  },
  nutritionValue: {
    fontSize: width * 0.04,
    color: "orange",
  },
  nutritionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  servingSize: {
    fontSize: width * 0.05,
    fontWeight: "500",
  },
  calories: {
    fontSize: width * 0.04,
    color: "orange",
  },
  nutritionBreakdown: {
    padding: 16,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  nutritionLabel: {
    fontSize: width * 0.05,
    fontWeight: "600",
  },
  nutritionValueDetail: {
    fontSize: width * 0.04,
    color: "orange",
  },
  buttonContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  consumeButton: {
    backgroundColor: "orange",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  consumeButtonText: {
    color: "white",
    fontSize: width * 0.05,
    fontWeight: "500",
  },
  cta: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
    alignItems: "center",
  },
  ctaText: {
    fontSize: width * 0.045,
    fontWeight: "500",
  },
  ctaSubtext: {
    fontSize: width * 0.035,
    color: "#808080",
    marginTop: 4,
  },
});
