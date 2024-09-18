
// import React, { useState, useEffect } from 'react';
// import { View, Text, TextInput, Button, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
// import { RadioButton } from 'react-native-paper'; // Import RadioButton
// import { SignedOut, useUser } from '@clerk/clerk-expo';
// import { useNavigation } from '@react-navigation/native';
// import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
// import { db } from '../firebaseConfig'; // Import your Firebase config
// import { Redirect, useRouter } from 'expo-router';

// const { width, height } = Dimensions.get('window');

// export default function Setup() {
//   const { user } = useUser();
//   const [weight, setWeight] = useState<string>('');
//   const [height, setHeight] = useState<string>('');
//   const [age, setAge] = useState<string>(''); // State for age
//   const [gender, setGender] = useState<string>('male'); // State for gender
//   const [activityLevel, setActivityLevel] = useState<string>('sedentary'); // State for activity level
//   const [currentStep, setCurrentStep] = useState<number>(1); // State for form step
//   const [bmi, setBmi] = useState<number | null>(null);
//   const [bmr, setBmr] = useState<number | null>(null); // State for BMR
//   const [maintenanceCalories, setMaintenanceCalories] = useState<number | null>(null); // State for maintenance calories
//   const [loading, setLoading] = useState<boolean>(true); // State to manage loading

//   const navigation = useNavigation();
//   const router = useRouter();

//   // Check if the user data exists
//   useEffect(() => {
//     const checkUserData = async () => {
//       if (user) {
//         const userDocRef = doc(db, 'users', user.id);
//         const docSnap = await getDoc(userDocRef);

//         if (docSnap.exists()) {
//           console.log("data exists");
//           router.replace("/(tabs)/home");
//         } else {
//           // If the document does not exist, allow the user to input data
//           setLoading(false);
//         }
//       }
//     };

//     checkUserData();
//   }, [user]);

//   const handleNextStep = async () => {
//     if (currentStep === 5) {
//       // Final step, handle BMI, BMR, and maintenance calories calculations
//       if (!user) return;

//       const weightNum = parseFloat(weight);
//       const heightNum = parseFloat(height);
//       const ageNum = parseInt(age);

//       if (isNaN(weightNum) || isNaN(heightNum) || isNaN(ageNum) || heightNum <= 0 || weightNum <= 0 || ageNum <= 0) {
//         Alert.alert('Invalid Input', 'Please enter valid weight, height, and age values.');
//         return;
//       }

//       const heightInMeters = heightNum / 100;
//       const calculatedBmi = weightNum / (heightInMeters * heightInMeters);
//       setBmi(calculatedBmi);

//       // Calculate BMR based on gender
//       let calculatedBmr;
//       if (gender === 'male') {
//         calculatedBmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
//       } else {
//         calculatedBmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
//       }
//       setBmr(calculatedBmr);

//       // Calculate maintenance calories based on activity level
//       let activityFactor = 1.2; // Default for sedentary
//       switch (activityLevel) {
//         case 'lightly active':
//           activityFactor = 1.375;
//           break;
//         case 'moderately active':
//           activityFactor = 1.55;
//           break;
//         case 'very active':
//           activityFactor = 1.725;
//           break;
//         case 'super active':
//           activityFactor = 1.9;
//           break;
//         default:
//           activityFactor = 1.2;
//       }
//       const calculatedMaintenanceCalories = calculatedBmr * activityFactor;
//       setMaintenanceCalories(calculatedMaintenanceCalories);

//       try {
//         const userDocRef = doc(db, 'users', user.id);

//         await setDoc(userDocRef, {
//           email: user?.emailAddresses[0].emailAddress,
//           age: ageNum,
//           gender,
//           weight: weightNum,
//           height: heightNum,
//           activityLevel,
//           bmi: calculatedBmi,
//           bmr: calculatedBmr,
//           maintenanceCalories: calculatedMaintenanceCalories,
//         }, { merge: true });

//         console.log("Data inserted");
//         Alert.alert("BMI Calculated. Redirecting you to the App");
//         router.replace("/(tabs)/home");
//       } catch (e) {
//         console.log(e);
//       }
//     } else {
//       setCurrentStep(currentStep + 1);
//     }
//   };

//   if (loading) {
//     // Show a loading indicator while checking if user data exists
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="orange" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {currentStep === 1 && (
//         <>
//           <Text style={styles.label}>What's the age of the user?</Text>
//           <TextInput
//             style={styles.input}
//             keyboardType="numeric"
//             value={age}
//             onChangeText={setAge}
//             placeholder="Enter age (years)"
//           />
//           <Button
//             title="Next"
//             onPress={handleNextStep}
//             color="orange"
//           />
//         </>
//       )}
//       {currentStep === 2 && (
//         <>
//           <Text style={styles.label}>Select Gender:</Text>
//           <RadioButton.Group onValueChange={setGender} value={gender}>
//             <View style={styles.radioContainer}>
//               <RadioButton value="male" />
//               <Text>Male</Text>
//             </View>
//             <View style={styles.radioContainer}>
//               <RadioButton value="female" />
//               <Text>Female</Text>
//             </View>
//           </RadioButton.Group>
//           <Button
//             title="Next"
//             onPress={handleNextStep}
//             color="orange"
//           />
//         </>
//       )}
//       {currentStep === 3 && (
//         <>
//           <Text style={styles.label}>What's the weight of the user?</Text>
//           <TextInput
//             style={styles.input}
//             keyboardType="numeric"
//             value={weight}
//             onChangeText={setWeight}
//             placeholder="Enter weight (kg)"
//           />
//           <Button
//             title="Next"
//             onPress={handleNextStep}
//             color="orange"
//           />
//         </>
//       )}
//       {currentStep === 4 && (
//         <>
//           <Text style={styles.label}>What's the height of the user?</Text>
//           <TextInput
//             style={styles.input}
//             keyboardType="numeric"
//             value={height}
//             onChangeText={setHeight}
//             placeholder="Enter height (centimeters cm)"
//           />
//           <Button
//             title="Next"
//             onPress={handleNextStep}
//             color="orange"
//           />
//         </>
//       )}
//       {currentStep === 5 && (
//         <>
//           <Text style={styles.label}>Select Activity Level:</Text>
//           <RadioButton.Group onValueChange={setActivityLevel} value={activityLevel}>
//             <View style={styles.radioContainer}>
//               <RadioButton value="sedentary" />
//               <Text>Sedentary</Text>
//             </View>
//             <View style={styles.radioContainer}>
//               <RadioButton value="lightly active" />
//               <Text>Lightly Active</Text>
//             </View>
//             <View style={styles.radioContainer}>
//               <RadioButton value="moderately active" />
//               <Text>Moderately Active</Text>
//             </View>
//             <View style={styles.radioContainer}>
//               <RadioButton value="very active" />
//               <Text>Very Active</Text>
//             </View>
//             <View style={styles.radioContainer}>
//               <RadioButton value="super active" />
//               <Text>Super Active</Text>
//             </View>
//           </RadioButton.Group>
//           <Button
//             title="Calculate"
//             onPress={handleNextStep}
//             color="orange"
//           />
//         </>
//       )}
//       {bmi !== null && (
//         <Text style={styles.bmiResult}>Your BMI is {bmi.toFixed(2)}</Text>
//       )}
//       {bmr !== null && (
//         <Text style={styles.bmrResult}>Your BMR is {bmr.toFixed(2)}</Text>
//       )}
//       {maintenanceCalories !== null && (
//         <Text style={styles.caloriesResult}>Your Maintenance Calories are {maintenanceCalories.toFixed(2)}</Text>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   label: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   input: {
//     height: 40,
//     width: width * 0.8,
//     borderColor: 'gray',
//     borderWidth: 1,
//     marginBottom: 20,
//     paddingHorizontal: 10,
//   },
//   bmiResult: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginTop: 20,
//   },
//   bmrResult: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginTop: 20,
//   },
//   caloriesResult: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginTop: 20,
//   },
//   radioContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 5,
//   },
// });


import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { RadioButton } from 'react-native-paper'; // Import RadioButton
import { SignedOut, useUser } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Import your Firebase config
import { Redirect, useRouter } from 'expo-router';
import { red } from 'react-native-reanimated/lib/typescript/reanimated2/Colors';

const { width, height } = Dimensions.get('window');

export default function Setup() {
  const { user } = useUser();
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [age, setAge] = useState<string>(''); // State for age
  const [gender, setGender] = useState<string>('male'); // State for gender
  const [activityLevel, setActivityLevel] = useState<string>('sedentary'); // State for activity level
  const [currentStep, setCurrentStep] = useState<number>(1); // State for form step
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmr, setBmr] = useState<number | null>(null); // State for BMR
  const [maintenanceCalories, setMaintenanceCalories] = useState<number | null>(null); // State for maintenance calories
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

  const handleNextStep = async () => {
    if (currentStep === 5) {
      // Final step, handle BMI, BMR, and maintenance calories calculations
      if (!user) return;

      const weightNum = parseFloat(weight);
      const heightNum = parseFloat(height);
      const ageNum = parseInt(age);

      if (isNaN(weightNum) || isNaN(heightNum) || isNaN(ageNum) || heightNum <= 0 || weightNum <= 0 || ageNum <= 0) {
        Alert.alert('Invalid Input', 'Please enter valid weight, height, and age values.');
        return;
      }

      const heightInMeters = heightNum / 100;
      const calculatedBmi = weightNum / (heightInMeters * heightInMeters);
      setBmi(calculatedBmi);

      // Calculate BMR based on gender
      let calculatedBmr;
      if (gender === 'male') {
        calculatedBmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
      } else {
        calculatedBmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
      }
      setBmr(calculatedBmr);

      // Calculate maintenance calories based on activity level
      let activityFactor = 1.2; // Default for sedentary
      switch (activityLevel) {
        case 'lightly active':
          activityFactor = 1.375;
          break;
        case 'moderately active':
          activityFactor = 1.55;
          break;
        case 'very active':
          activityFactor = 1.725;
          break;
        case 'super active':
          activityFactor = 1.9;
          break;
        default:
          activityFactor = 1.2;
      }
      const calculatedMaintenanceCalories = calculatedBmr * activityFactor;
      setMaintenanceCalories(calculatedMaintenanceCalories);

      try {
        const userDocRef = doc(db, 'users', user.id);

        await setDoc(userDocRef, {
          email: user?.emailAddresses[0].emailAddress,
          age: ageNum,
          gender,
          weight: weightNum,
          height: heightNum,
          activityLevel,
          bmi: calculatedBmi,
          bmr: calculatedBmr,
          maintenanceCalories: calculatedMaintenanceCalories,
          caloriesConsumed:0,
        }, { merge: true });

        console.log("Data inserted");
        Alert.alert("BMI Calculated. Redirecting you to the App");
        router.replace("/(tabs)/home");
      } catch (e) {
        console.log(e);
      }
    } else {
      setCurrentStep(currentStep + 1);
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

  const handleBackStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <View style={styles.container}>
      {currentStep === 1 && (
        <>
          <Text style={styles.label}>What's the age of the user?</Text>
          <View style={styles.combinedInput} >
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
            placeholder="Age in"
            placeholderTextColor="#999" 
            returnKeyType="done" 
          />
          <Text style={styles.sideText}>
            years
          </Text>
          </View>
           <View style={styles.navigationButtonContainer}>
          <Button
            title="Next"
            onPress={handleNextStep}
            color="orange"
          />

          <Button
            title="Back"
            onPress={handleBackStep}
            color="orange"
            disabled={currentStep === 1} // Disable the button on the first step
          />
          </View>

        </>
      )}
      {currentStep === 2 && (
        <>
          <Text style={styles.label}>Select Gender:</Text>
          <RadioButton.Group onValueChange={setGender} value={gender}>
            <View style={styles.radioContainer}>
              <View style={styles.radioButton}>
                <RadioButton value="male" color='orange' />
              </View>
              <Text style={styles.radioButtonText} >Male</Text>
            </View>
            <View style={styles.radioContainer}>
              <View style={styles.radioButton}>
                <RadioButton value="female" />
              </View>

              <Text style={styles.radioButtonText}>Female</Text>
            </View>
          </RadioButton.Group>
          <View style={styles.navigationButtonContainer}>
          <Button
            title="Next"
            onPress={handleNextStep}
            color="orange"
          />

          <Button
            title="Back"
            onPress={handleBackStep}
            color="orange"
          />
          </View>
        </>
      )}
      {currentStep === 3 && (
        <>
          <Text style={styles.label}>What's the weight of the user?</Text>
          <View style={styles.combinedInput}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
            placeholder="weight"
            placeholderTextColor="#999" 
            returnKeyType="done" 
          />
          <Text style={styles.sideText}>
            kgs
          </Text>
          </View>
           <View style={styles.navigationButtonContainer}>
          <Button
            title="Next"
            onPress={handleNextStep}
            color="orange"
          />
          <Button
            title="Back"
            onPress={handleBackStep}
            color="orange"
          />
          </View>
          
        </>
      )}
      {currentStep === 4 && (
        <>
          <Text style={styles.label}>What's the height of the user?</Text>
          <View style={styles.combinedInput}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
            placeholder="height"
            placeholderTextColor="#999" 
            returnKeyType="done" 
          />
           <Text style={styles.sideText}>
            cms
          </Text>
          </View>
          <View style={styles.navigationButtonContainer}>
          <Button
            title="Next"
            onPress={handleNextStep}
            color="orange"
          />
          <Button
            title="Back"
            onPress={handleBackStep}
            color="orange"
          />
          </View>
        </>
      )}
      {currentStep === 5 && (
        <>
          <Text style={styles.label}>Select Activity Level:</Text>
          <RadioButton.Group onValueChange={setActivityLevel} value={activityLevel}>
            <View style={styles.radioContainer}>
              <View style={styles.radioButton}>
                <RadioButton value="sedentary" color='orange' />
              </View>
              <Text style={styles.radioButtonText}>Sedentary</Text>
            </View>
            <View style={styles.radioContainer}>
              <View style={styles.radioButton}>
                <RadioButton value="lightly active" color='orange' />
              </View>
              <Text style={styles.radioButtonText}>Lightly Active</Text>
            </View>
            <View style={styles.radioContainer}>
              <View style={styles.radioButton}>
                <RadioButton value="moderately active" color='orange'/>
              </View>
              <Text style={styles.radioButtonText}>Moderately Active</Text>
            </View>
            <View style={styles.radioContainer}>
              <View style={styles.radioButton}>
                <RadioButton value="very active" color='orange'/>
              </View>
              <Text style={styles.radioButtonText}>Very Active</Text>
            </View>
            <View style={styles.radioContainer}>
              <View style={styles.radioButton}>
                <RadioButton value="super active" color='orange'/>
              </View>
              <Text style={styles.radioButtonText}>Super Active</Text>
            </View>
          </RadioButton.Group>
          <View style={styles.navigationButtonContainer}>
          <Button
            title="Calculate"
            onPress={handleNextStep}
            color="orange"
          />
          <Button
            title="Back"
            onPress={handleBackStep}
            color="orange"
          />
          </View>
          
        </>
      )}
      {bmi !== null && (
        <Text style={styles.bmiResult}>Your BMI is {bmi.toFixed(2)}</Text>
      )}
      {bmr !== null && (
        <Text style={styles.bmrResult}>Your BMR is {bmr.toFixed(2)}</Text>
      )}
      {maintenanceCalories !== null && (
        <Text style={styles.caloriesResult}>Your Maintenance Calories are {maintenanceCalories.toFixed(2)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bmiResult: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  bmrResult: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  caloriesResult: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5', // Assuming a light background color
  },
  stepContainer: {
    width: width * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    elevation: 3, // Adds shadow for Android
    shadowColor: '#000', // Adds shadow for iOS
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 20,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333333', // Dark text color for contrast
  },
  input: {
    width:80,
    height: 45,
    borderColor: 'orange',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',

  },

  combinedInput:{
    display:"flex",
    marginBottom: 5,
    flexDirection:"row",
    gap:5,
    justifyContent:"center",
    alignItems:"center",

  },

  sideText:{
    fontSize:16,    
  },

  button: {
    backgroundColor: '#FF5722', // Primary button color
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  radioButton: {
    borderRadius: 50, // Makes the border circular
    borderWidth: 2, // Width of the border
    borderColor: 'orange', // Color of the border
    padding: 5, // Adjust padding to fit the size of the radio button
    marginRight: 2, // Spacing between the radio button and the text
  },
  radioButtonText: {
    marginLeft: 8,
    fontSize: 16,
    marginTop: 15,
  },

  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 15,
    borderWidth: 2, // Border width around the text
    borderColor: 'black', // Border color
    borderRadius: 5,
    padding: 6,

  },
  navigationButtonContainer:{
    display:"flex" ,
    flexDirection:"row-reverse",
    gap:10,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333333',
  },
  resultContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    width: width * 0.9,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },


});
