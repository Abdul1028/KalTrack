import * as Notifications from 'expo-notifications';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import moment from 'moment';

import { useUser } from "@clerk/clerk-expo";
import { Platform } from 'react-native';


// Configure the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Function to determine the notification message
export async function getNotificationBody(userId: string): Promise<string> {
  const currentDate = moment().format('DD-MM-YYYY');

  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    throw new Error('User data not found');
  }

  const userData = userDocSnap.data();
  const maintenanceCalories = userData?.maintenanceCalories;
  const goal = userData?.userGoal;

  if (maintenanceCalories === undefined) {
    throw new Error('Maintenance calories not found for user');
  }

  const nutritionDocRef = doc(db, `users/${userId}/NutritionData/${currentDate}`);
  const nutritionDocSnap = await getDoc(nutritionDocRef);

  let totalCalories = 0;
  if (nutritionDocSnap.exists()) {
    const nutritionData = nutritionDocSnap.data();
    totalCalories = nutritionData?.calories || 0;
  }

  if (goal === 'weight_gain') {
    if (Math.floor(totalCalories) > Math.floor(maintenanceCalories)) {
      return `Hurray 🎉 You've eaten ${Math.floor(totalCalories) - Math.floor(maintenanceCalories)} calories in surplus today!`;
    } else if (Math.floor(totalCalories) === Math.floor(maintenanceCalories)) {
      return 'You did it 😊!!! You are maintaining up with your calories';
    } else {
      return `Hard luck, You are ${Math.floor(maintenanceCalories) - Math.floor(totalCalories)} calories deficit today 😥`;
    }
  } else if (goal == "weight_loss") {
    if (Math.floor(totalCalories) > Math.floor(maintenanceCalories)) {
      return `Hard Luck 💔 You've eaten ${Math.floor(totalCalories) - Math.floor(maintenanceCalories)} calories in surplus today 😥`;
    } else if (Math.floor(totalCalories) === Math.floor(maintenanceCalories)) {
      return 'You did it 😊!!! You are maintaining up with your calories';
    } else {
      return `Hurray 🎉, You are ${Math.floor(maintenanceCalories) - Math.floor(totalCalories)} calories deficit today`;
    }
  }

  else if (goal === 'maintain') {
    const diff = Math.abs(totalCalories - maintenanceCalories);
    
    if (diff <= 100) {
      return "⚖️ Excellent! You’re maintaining your calorie goal really well.";
    } else if (totalCalories > maintenanceCalories) {
      return `🔺 You’re ${diff} calories over your maintenance today. Try balancing it out tomorrow!`;
    } else {
      return `🔻 You’re ${diff} calories under today. Slight adjustments can help you stay consistent.`;
    }
  }

  else{
    return "⚠️ No goal set. Please update your preferences to receive personalized reminders.";
  }

}

// Function to schedule the daily notification at 12:00 AM
export async function scheduleDailyNotification(userId: string) {

  console.log("function triggered:")

  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permissions not granted');
    return;
  }

  // Set notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily Reminder',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF8C00',
    });
  }

  // Cancel existing notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();


  // Fetch user data to get goal for dynamic title
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    console.error('User data not found');
    return;
  }

  const userData = userDocSnap.data();
  const goal = userData?.userGoal || '';

   // 🌟 Determine dynamic title based on goal
   let notificationTitle = "🥗 Your Daily Nutrition Report";
   if (goal === 'weight_gain') {
     notificationTitle = "🏋️ Fueling Your Gains!";
   } else if (goal === 'weight_loss') {
     notificationTitle = "🔥 Crushing Your Calorie Goals!";
   } else if (goal === 'maintain') {
     notificationTitle = "⚖️ Balanced & Healthy!";
   }

  // Get the notification message
  const notificationBody = await getNotificationBody(userId);
  console.log(notificationBody)


  // Schedule the notification
  Notifications.scheduleNotificationAsync({
    content: {
      title: notificationTitle,
      body: await getNotificationBody(userId),
      data :{type:'daily-reminder'}
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 0,
      minute: 0,
      channelId:'daily-reminder'
    },
  });

  console.log('Daily notification scheduled at 12:00 AM');
}

export async function scheduleSundayMotivation() {
  console.log("Scheduling Sunday motivational notification...");

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permissions not granted');
    return;
  }

  // Set Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sunday-motivation', {
      name: 'Sunday Motivation',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#32CD32', // LimeGreen
    });
  }
  
  // Optional: Cancel existing Sunday motivation to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule for Sunday (weekday: 0), 9:00 AM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌞 Enjoy your Sunday!",
      body: "Take a break, relax, but don't forget to nourish your body with healthy choices! 🥗💪",
      data: { type: 'sunday-motivation' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 9,  
      minute:0 ,
      channelId: 'sunday-motivation',
    },
  });

  console.log("✅ Sunday motivation scheduled for every Sunday at 9:00 AM");
}
