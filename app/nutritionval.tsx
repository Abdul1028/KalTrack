import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Image, Text, View, Dimensions, Pressable, TouchableOpacity } from "react-native";

const { width } = Dimensions.get("window");

import * as Notifications from 'expo-notifications';
import Constants from "expo-constants";

// Define the notification actions
const notificationActions = [
  {
    identifier: 'RESET_ACTION',
    buttonTitle: 'Okay Reset',
    options: { opensAppToForeground: true },  // Ensures the app opens
  },
  {
    identifier: 'NO_ACTION',
    buttonTitle: 'No',
    options: { opensAppToForeground: false },  // The app stays in the background
  },
];

// Request permission and schedule the notification with actions
export async function scheduleNotificationWithActions() {
  let token;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to send notifications was denied');
    return;
  }


  
// Schedule the notification with action buttons
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Calorie Reminder",
      body: "Do you want to reset your calories?",
      sound: true,
    },
    trigger: {
      hour: 21,      // 5 PM
      minute: 0,     // Time for daily notification
      repeats: true, // Repeat every day
    },
  });
}

// Set up the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});





export default function nutritionval() {
  const item = useLocalSearchParams();
  
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
        source={{ uri: item?.pic }}
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
        <TouchableOpacity style={styles.consumeButton} onPress={getToken}  >
          <Text style={styles.consumeButtonText}>Consume</Text>
        </TouchableOpacity>
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
