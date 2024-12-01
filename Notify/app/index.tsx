
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import {View, Text, Button, StyleSheet } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
console.log("Start");

const trigger = new Date(Date.now() + 10 * 1000); // Changed from 60 * 60 * 1000 to 10 * 1000
trigger.setMinutes(0);
trigger.setSeconds(0);

// Notifications.scheduleNotificationAsync({
//   content: {
//     title: "Remember to drink water!",
//   },
//   trigger: {
//     seconds: 10,
//     repeats: false,
//   },
// });

export default function App() {
  useEffect(() => {
    scheduleNotificationHandler();
  }, []);
  const scheduleNotificationHandler = async () => {
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Remember to drink water!",
      },
      trigger,
    });
  };
  return (
    <View style={styles.container}>
    <Text style={styles.text}>Drink Water Reminder App</Text>
    <Button title="Start Reminders" onPress={scheduleNotificationHandler} />
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
});
