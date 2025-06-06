import { Redirect, Stack } from "expo-router";
import { ClerkProvider, ClerkLoaded, SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { Slot } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import Home from "./setup";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
// import { scheduleMidnightNotification } from "./nutritionval";


import { Alert, View, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key)
      if (item) {
        console.log(`${key} was used 🔐 \n`)
      } else {
        console.log('No values stored under key: ' + key)
      }
      return item
    } catch (error) {
      console.error('SecureStore get item error: ', error)
      await SecureStore.deleteItemAsync(key)
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch (err) {
      return
    }
  },
}
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  )
}

export default function RootLayout() {


  // // Function to handle notification click
  // function handleNotificationClick(response :any) {
  //   const { notification } = response;
  //   const actionIdentifier = response.actionIdentifier;

  //   // Show an alert box
  //   Alert.alert(
  //     "Notification Clicked",
  //     notification.request.content.body,
  //     [
  //       { text: "OK", onPress: () => console.log("OK Pressed") },
  //       { text: "Cancel", onPress: () => console.log("Cancel Pressed") }
  //     ]
  //   );
  // }
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack>
      <Stack.Screen name="index" options={
        {
          headerShown:false,
        }
      } />

<Stack.Screen name="setup" options={
        {
          headerShown:false,
        }
      } />

<Stack.Screen name="login" options={
        {
          headerShown:false,
        }
      } />

<Stack.Screen name="addMeal" options={
        {
          headerShown:false,
        }
      } />


<Stack.Screen name="nutritionval" options={
        {
          headerShown:false,
        }
      } />

<Stack.Screen name="(tabs)" options={
        {
          headerShown:false,
        }
      } />

<Stack.Screen name="search" options={
        {
          headerShown:false,
        }
      } />

<Stack.Screen name="portion-selector" options={
        {
          headerShown:false,
        }
      } />

    <Stack.Screen name="selected-foods" options={
        {
          headerShown:false,
        }
      } />


<Stack.Screen name="privacy" options={
        {
          headerShown:false,
        }
      } />

<Stack.Screen name="about" options={
        {
          headerShown:false,
        }
      } />

<Stack.Screen name="help-support" options={
        {
          headerShown:false,
        }
      } />

<Stack.Screen name="edit-profile" options={
        {
          headerShown:false,
        }
      } />
    <Stack.Screen
      name="log-workout"
      options={{
        headerShown: false // We configure header inside the screen itself
        // Or customize presentation style if needed, e.g., modal
        // presentation: 'modal',
      }}
    />
    </Stack>

    

    




    </GestureHandlerRootView>

    </ClerkLoaded>
    </ClerkProvider>
    
  );

}
