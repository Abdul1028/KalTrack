import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { collection, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { useUser } from '@clerk/clerk-expo';
import { db } from '../../firebaseConfig';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  useSharedValue,
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const Statistics = () => {
  const { user } = useUser();
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [maintenanceCalories, setMaintenanceCalories] = useState(2359); // Default to avoid division by zero
  const date = moment().format('DD-MM-YYYY');
  const [caloriesData, setCaloriesData] = useState<number[]>([]);
  const [dateLabels, setDateLabels] = useState<string[]>([]);

  const barAnimation = useSharedValue(0);
  const pieAnimation = useSharedValue(0);

  useEffect(() => {
    barAnimation.value = withSequence(
      withTiming(1.1, { duration: 500 }),
      withSpring(1)
    );
    pieAnimation.value = withTiming(1, { duration: 1000 });
  }, [caloriesData]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: barAnimation.value }],
    opacity: barAnimation.value,
  }));

  const animatedPieStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pieAnimation.value }],
    opacity: pieAnimation.value,
  }));

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

      //ONLY 7 DAYS DATA
      setCaloriesData(caloriesArray.slice(-7));
      setDateLabels(dateLabels.slice(-7));

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

  const percentageConsumed = maintenanceCalories > 0 
    ? (caloriesConsumed / maintenanceCalories) * 100 
    : 0;

  let remaining = maintenanceCalories > 0 
    ? Math.max(0, 100 - percentageConsumed)
    : 0;

  const chartData = [
    {
      name: 'Consumed',
      calories: isNaN(percentageConsumed) ? 0 : percentageConsumed,
      color: '#FF6B6B', // Vibrant red
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Remaining',
      calories: isNaN(remaining) ? 0 : remaining,
      color: '#FFE0E0', // Light pink
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
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

  const renderStatCard = (title: string, value: string, icon: string, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  // Enhanced Bar Chart Configuration
  const barChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 160, 122, ${opacity})`, // Light orange color
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: "6 6",
      stroke: "#e3e3e3",
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 11,
      fontWeight: '500',
      color: '#666666',
    },
    barPercentage: 0.5, // Make bars thinner
    fillShadowGradient: '#FFA07A',
    fillShadowGradientOpacity: 0.3, // Reduce opacity to make it lighter
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics</Text>
        <Text style={styles.headerSubtitle}>Track your progress</Text>
      </View>

      <View style={styles.cardsContainer}>
        {renderStatCard(
          'Daily Goal',
          `${maintenanceCalories} cal`,
          'fitness-outline',
          '#FF6B6B'
        )}
        {renderStatCard(
          'Consumed',
          `${caloriesConsumed} cal`,
          'restaurant-outline',
          '#4ECDC4'
        )}
        {renderStatCard(
          'Remaining',
          `${Math.max(0, maintenanceCalories - caloriesConsumed)} cal`,
          'timer-outline',
          '#45B7D1'
        )}
      </View>

      <Animated.View style={[styles.chartContainer, animatedBarStyle]}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Weekly Progress</Text>
          <LinearGradient
            colors={['#FF6B6B', '#FFA07A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBadge}
          >
            <Text style={styles.badgeText}>Last 7 Days</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.chartWrapper}>
          <BarChart
            data={barChartData}
            width={width - 80} // Reduce width to prevent overflow
            height={220}
            chartConfig={barChartConfig}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars
            segments={5}
            withInnerLines={true}
            flatColor={true}
            withHorizontalLabels={true}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>
      </Animated.View>

      <Animated.View style={[styles.pieChartContainer, animatedPieStyle]}>
        <Text style={styles.chartTitle}>Today's Progress</Text>
        <View style={styles.pieWrapper}>
          <PieChart
            data={chartData}
            width={width - 60}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="calories"
            backgroundColor="transparent"
            paddingLeft="0"
            center={[(width - 60) / 4, 0]}
            absolute
            hasLegend={false}
            avoidFalseZero
          />
          <View style={styles.centerLabel}>
            <Text style={styles.centerValue}>
              {Math.round(percentageConsumed)}%
            </Text>
            <Text style={styles.centerText}>Consumed</Text>
          </View>
        </View>
        
        <View style={styles.legendContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.name}</Text>
              <Text style={styles.legendValue}>{Math.round(item.calories)}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(percentageConsumed, 100)}%`,
                  backgroundColor: percentageConsumed > 100 ? '#FF4444' : '#FF6B6B' 
                }
              ]} 
            />
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    flexWrap: 'wrap',
  },
  statCard: {
    width: width * 0.28,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 15,
    margin: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chartLegend: {
    flexDirection: 'row',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  chart: {
    marginVertical: 10,
    borderRadius: 16,
  },
  pieChartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pieWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -30 }],
  },
  centerValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  centerText: {
    fontSize: 14,
    color: '#666',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBarContainer: {
    marginTop: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#FFE0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  gradientBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chartWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
});

export default Statistics;
