import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { collection, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { useUser } from '@clerk/clerk-expo';
import { db } from '../../firebaseConfig'; // Your Firebase config
import moment, { min } from 'moment';
import { black, orange100 } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

const screenWidth = Dimensions.get('window').width;

const Statistics = () => {
  const { user } = useUser();
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [maintenanceCalories, setMaintenanceCalories] = useState(2359); // Default to avoid division by zero
  const date = moment().format('DD-MM-YYYY');
  const [caloriesData, setCaloriesData] = useState<number[]>([]);
  const [dateLabels, setDateLabels] = useState<string[]>([]);

  async function getUserDocument(userId: string) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        // Document data is available
        return userDoc.data();
      } else {
        // No such document!
        console.log("No such document!");
        return null;
      }
    } catch (e) {
      console.error("Error getting document: ", e);
      return null;
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const nutritionRef = doc(db, `users/${user.id}/NutritionData/${date}`);
          const nutritionSnap = await getDoc(nutritionRef);

          if (nutritionSnap.exists()) {
            const data = nutritionSnap.data();
            setCaloriesConsumed(Math.floor(data.calories )|| 0); // Calories consumed for the day
          }
        } catch (error) {
          console.error("Error fetching nutrition data:", error);
        }

        try {
          const data = await getUserDocument(user.id); // Use user.id from Clerk
          setMaintenanceCalories(Math.floor(data['maintenanceCalories']));
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      }
    };

    fetchData();
  }, [user, date]);

  useEffect(() => {
    const fetchCaloriesData = async () => {
      const caloriesCollectionRef = collection(db, `users/${user?.id}/NutritionData`);
      const querySnapshot = await getDocs(caloriesCollectionRef);

      const caloriesArray: number[] = [];
      const dateLabels: string[] = [];

      querySnapshot.forEach((doc) => {
        const date = doc.id; // Document ID in DD-MM-YYYY format
        const data = doc.data();
        if (data.calories) {
          const shortDate = date.substring(0, 5);
          dateLabels.push(shortDate);
          caloriesArray.push(Math.floor(data.calories));
        }
      });

      setCaloriesData(caloriesArray);
      setDateLabels(dateLabels);
    };

    fetchCaloriesData();
  }, [user, caloriesConsumed]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, `users/${user.id}/NutritionData`), (querySnapshot) => {
      const caloriesArray: number[] = [];
      const dateLabels: string[] = [];

      querySnapshot.forEach((doc) => {
        const date = doc.id;
        const data = doc.data();
        if (data.calories) {
          const shortDate = date.substring(0, 5);
          dateLabels.push(shortDate);
          caloriesArray.push(Math.floor(data.calories));
        }
      });

      setCaloriesData(caloriesArray);
      setDateLabels(dateLabels);
    });

    return () => unsubscribe(); // Cleanup the listener on unmount
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    // Listen for changes to today's NutritionData
    const unsubscribe = onSnapshot(doc(db, `users/${user.id}/NutritionData/${date}`), (nutritionSnap) => {
      if (nutritionSnap.exists()) {
        const data = nutritionSnap.data();
        console.log("Calories for today:", data.calories); // Debugging: Log the fetched calories
        setCaloriesConsumed(Math.floor(data.calories || 0)); // Set the consumed calories
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [user, date]);



  const percentageConsumed = (caloriesConsumed / maintenanceCalories) * 100;
  let remaining = 100-percentageConsumed;

  if (remaining <= 0) {
    remaining = 0;
  }

  const chartData = [
    {
      name: 'Consumed',
      calories: percentageConsumed,
      color: 'orange',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    },
    {
      name: 'Remaining',
      calories: remaining ,
      color: 'grey',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    },
  ];

  // Data for the bar chart
  const barChartData = {
    labels: dateLabels,
    datasets: [
      {
        data: caloriesData,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: "white", padding: 9, borderWidth: 1, borderColor: "black", borderRadius: 10, alignSelf:"flex-start"}}>
        <Text style={styles.title}>Weekly Calorie Stats</Text>
      </View>
      {/* Bar Chart */}
      <BarChart
        data={barChartData}
        width={screenWidth - 20} // Adjusting for padding
        height={220}
        chartConfig={chartConfig}
        fromZero={true}
        verticalLabelRotation={0}
        style={styles.chart}

      />

      <View style={{ backgroundColor: "white", padding: 9, borderWidth: 1, borderColor: "black", borderRadius: 10,alignSelf:"flex-start" }}>
        <Text style={styles.title}> Consumed Vs Maintainance </Text>
      </View>

      {/* Pie Chart */}
      <PieChart
        data={chartData}
        width={screenWidth - 20} // Adjusting for padding
        height={220}
        chartConfig={chartConfig}
        accessor="calories"
        backgroundColor="transparent"
        paddingLeft="15"
      />

      <View style={styles.statsContainer}>
        <Text style={styles.statText}>You have consumed {caloriesConsumed} calories from  {maintenanceCalories} Maintainance Calories</Text>
      </View>

    </View>
  );
};

// Chart configuration for the charts
const chartConfig = {
  backgroundColor: '#e26a00',
  backgroundGradientFrom: '#fb8c00',
  backgroundGradientTo: '#ffa726',
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.5,
  propsForBackgroundLines: {
    strokeDasharray: "", // solid background lines with no dash
  },
  min: 100,

};

// Styling for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsContainer: {

    marginTop: 20,
  },
  statText: {
    textAlign:"center",
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    marginBottom: 30,
  },
});

export default Statistics;


// import React, { useEffect, useState } from 'react';
// import { View, Text, Dimensions, StyleSheet } from 'react-native';
// import { PieChart, BarChart } from 'react-native-chart-kit';
// import { collection, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
// import { useUser } from '@clerk/clerk-expo';
// import { db } from '../../firebaseConfig'; // Your Firebase config
// import moment from 'moment';

// const screenWidth = Dimensions.get('window').width;

// const Statistics = () => {
//   const { user } = useUser();
//   const [caloriesConsumed, setCaloriesConsumed] = useState(0);
//   const [maintenanceCalories, setMaintenanceCalories] = useState(2359); // Default to avoid division by zero
//   const date = moment().format('DD-MM-YYYY');
//   const [caloriesData, setCaloriesData] = useState<number[]>([]);
//   const [dateLabels, setDateLabels] = useState<string[]>([]);

//   async function getUserDocument(userId: string) {
//     try {
//       const userDocRef = doc(db, 'users', userId);
//       const userDoc = await getDoc(userDocRef);

//       if (userDoc.exists()) {
//         return userDoc.data();
//       } else {
//         console.log("No such document!");
//         return null;
//       }
//     } catch (e) {
//       console.error("Error getting document: ", e);
//       return null;
//     }
//   }

//   useEffect(() => {
//     const fetchData = async () => {
//       if (user) {
//         try {
//           const nutritionRef = doc(db, `users/${user.id}/NutritionData/${date}`);
//           const nutritionSnap = await getDoc(nutritionRef);

//           if (nutritionSnap.exists()) {
//             const data = nutritionSnap.data();
//             setCaloriesConsumed(Math.floor(data.calories) || 0); // Calories consumed for the day
//           }
//         } catch (error) {
//           console.error("Error fetching nutrition data:", error);
//         }

//         try {
//           const data = await getUserDocument(user.id); // Use user.id from Clerk
//           setMaintenanceCalories(Math.floor(data['maintenanceCalories']));
//         } catch (error) {
//           console.error("Error fetching user data: ", error);
//         }
//       }
//     };

//     fetchData();
//   }, [user, date]);

//   useEffect(() => {
//     const fetchCaloriesData = async () => {
//       const caloriesCollectionRef = collection(db, `users/${user?.id}/NutritionData`);
//       const querySnapshot = await getDocs(caloriesCollectionRef);

//       const caloriesArray: number[] = [];
//       const dateLabels: string[] = [];

//       querySnapshot.forEach((doc) => {
//         const date = doc.id; // Document ID in DD-MM-YYYY format
//         const data = doc.data();
//         if (data.calories) {
//           const shortDate = date.substring(0, 5);
//           dateLabels.push(shortDate);
//           caloriesArray.push(Math.floor(data.calories));
//         }
//       });

//       setCaloriesData(caloriesArray);
//       setDateLabels(dateLabels);
//     };

//     fetchCaloriesData();
//   }, [user, caloriesConsumed]);

//   useEffect(() => {
//     if (!user) return;

//     const unsubscribe = onSnapshot(collection(db, `users/${user.id}/NutritionData`), (querySnapshot) => {
//       const caloriesArray: number[] = [];
//       const dateLabels: string[] = [];

//       querySnapshot.forEach((doc) => {
//         const date = doc.id;
//         const data = doc.data();
//         if (data.calories) {
//           const shortDate = date.substring(0, 5);
//           dateLabels.push(shortDate);
//           caloriesArray.push(Math.floor(data.calories));
//         }
//       });

//       setCaloriesData(caloriesArray);
//       setDateLabels(dateLabels);
//     });

//     return () => unsubscribe(); // Cleanup the listener on unmount
//   }, [user?.id]);

//   // Recalculate chart data when caloriesConsumed or maintenanceCalories changes
//   const percentageConsumed = (caloriesConsumed / maintenanceCalories) * 100;
//   let remaining = 100 - percentageConsumed;

//   if (remaining <= 0) {
//     remaining = 0;
//   }

//   // Dynamic chart data
//   const chartData = [
//     {
//       name: 'Consumed',
//       calories: percentageConsumed,
//       color: 'orange',
//       legendFontColor: '#7F7F7F',
//       legendFontSize: 15,
//     },
//     {
//       name: 'Remaining',
//       calories: remaining,
//       color: 'grey',
//       legendFontColor: '#7F7F7F',
//       legendFontSize: 15,
//     },
//   ];

//   // Data for the bar chart
//   const barChartData = {
//     labels: dateLabels.slice(-5), // Only show last 5 entries
//     datasets: [
//       {
//         data: caloriesData.slice(-5), // Limit data to last 5 entries
//       },
//     ],
//   };

//   return (
//     <View style={styles.container}>
//       <View style={{ backgroundColor: "white", padding: 9, borderWidth: 1, borderColor: "black", borderRadius: 10, alignSelf: "flex-start" }}>
//         <Text style={styles.title}>Weekly Calorie Stats</Text>
//       </View>
//       {/* Bar Chart */}
//       <BarChart
//         data={barChartData}
//         width={screenWidth - 20} // Adjusting for padding
//         height={220}
//         chartConfig={chartConfig}
//         fromZero={true}
//         verticalLabelRotation={0}
//         style={styles.chart}
//       />

//       <View style={{ backgroundColor: "white", padding: 9, borderWidth: 1, borderColor: "black", borderRadius: 10, alignSelf: "flex-start" }}>
//         <Text style={styles.title}>Consumed Vs Maintenance</Text>
//       </View>

//       {/* Pie Chart */}
//       <PieChart
//         data={chartData} // Dynamically updated chart data
//         width={screenWidth - 20} // Adjusting for padding
//         height={220}
//         chartConfig={chartConfig}
//         accessor="calories"
//         backgroundColor="transparent"
//         paddingLeft="15"
//       />

//       <View style={styles.statsContainer}>
//         <Text style={styles.statText}>
//           You have consumed {caloriesConsumed} calories from {maintenanceCalories} Maintenance Calories
//         </Text>
//       </View>
//     </View>
//   );
// };

// // Chart configuration for the charts
// const chartConfig = {
//   backgroundColor: '#e26a00',
//   backgroundGradientFrom: '#fb8c00',
//   backgroundGradientTo: '#ffa726',
//   color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
//   labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
//   strokeWidth: 2, // optional, default 3
//   barPercentage: 0.5,
//   propsForBackgroundLines: {
//     strokeDasharray: "", // solid background lines with no dash
//   },
// };

// // Styling for the component
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 10,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   statsContainer: {
//     marginTop: 20,
//   },
//   statText: {
//     textAlign: "center",
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//   },
//   chart: {
//     marginVertical: 8,
//     borderRadius: 16,
//     marginBottom: 30,
//   },
// });

// export default Statistics;
