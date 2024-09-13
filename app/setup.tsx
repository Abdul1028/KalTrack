import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SignedOut, useUser } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Import your Firebase config
import { Redirect, useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function setup() {
  const { user } = useUser();
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [isHeightInputVisible, setHeightInputVisible] = useState<boolean>(false);
  const [bmi, setBmi] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // State to manage loading

  const navigation = useNavigation();
  const router = useRouter();

  // Check if the user data exists
  useEffect(() => {
    const checkUserData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.id);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          console.log("data exists");
          router.replace("/(tabs)/home");

        } else {
          // If the document does not exist, allow the user to input data
          setLoading(false);
        }
      }
    };

    checkUserData();
  }, [user]);

  const handleWeightSubmit = () => {
    setHeightInputVisible(true);
  };

  const handleHeightSubmit = async () => {
    if (!user) return;

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(weightNum) || isNaN(heightNum) || heightNum <= 0 || weightNum <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid weight and height values.');
      return;
    }
    const heightInMeters = heightNum/100;

    const calculatedBmi = weightNum / (heightInMeters * heightInMeters);
    setBmi(calculatedBmi);
    console.log(calculatedBmi);

    try {
      const userDocRef = doc(db, 'users', user.id);

      await setDoc(userDocRef, {
        weight: weightNum,
        height: heightNum,
        bmi: calculatedBmi,
      }, { merge: true });

      console.log("Data inserted");
      Alert.alert("BMI Calculated Redirecting you to the App");
      router.replace("/(tabs)/home");
    } catch (e) {
      console.log(e);
    }
  };

  if (loading) {
    // Show a loading indicator while checking if user data exists
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="orange" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isHeightInputVisible ? (
        <>
          <Text style={styles.label}>What's the weight of the user?</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
            placeholder="Enter weight (kg)"
          />
          <Button
            title="Next"
            onPress={handleWeightSubmit}
            color="orange"
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>What's the height of the user?</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
            placeholder="Enter height in (centimeters cm)"
          />
          <Button
            title="Calculate BMI"
            onPress={handleHeightSubmit}
            color="orange"
          />
        </>
      )}
      {bmi !== null && (
        <Text style={styles.bmiResult}>Your BMI is {bmi.toFixed(2)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    height: 40,
    width: width * 0.8,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  bmiResult: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
});
