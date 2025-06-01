import React, { useEffect, useState, useCallback, ComponentProps } from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Define the type for Ionicons names
type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface DailyStat {
    date: string; // e.g., "MM/DD"
    consumed: number;
    burned: number;
}

const screenWidth = Dimensions.get("window").width;

const Statistics = () => {
  const { user } = useUser();
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [maintenanceCalories, setMaintenanceCalories] = useState(2359); // Default to avoid division by zero
  const date = moment().format('DD-MM-YYYY');
  const [barChartCaloriesData, setBarChartCaloriesData] = useState<number[]>([]);
  const [barChartDateLabels, setBarChartDateLabels] = useState<string[]>([]);
  const [lineChartStatsData, setLineChartStatsData] = useState<DailyStat[]>([]);
  const [isLoadingLineChart, setIsLoadingLineChart] = useState(true);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(true);
  const [isLoadingBarChart, setIsLoadingBarChart] = useState(true);
  const [isLoadingPieChart, setIsLoadingPieChart] = useState(true);

  const barAnimation = useSharedValue(0);
  const pieAnimation = useSharedValue(0);

  useEffect(() => {
    if (!isLoadingBarChart) {
      barAnimation.value = withSequence(
        withTiming(1.1, { duration: 500 }),
        withSpring(1)
      );
    }
    if (!isLoadingPieChart) {
      pieAnimation.value = withTiming(1, { duration: 1000 });
    }
  }, [isLoadingBarChart, isLoadingPieChart]);

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

  const fetchPieChartData = useCallback(async () => {
    if (!user) {
      setIsLoadingUserDetails(false);
      setIsLoadingPieChart(false);
      setMaintenanceCalories(2359); // Reset to default
      setCaloriesConsumed(0); // Reset
      return;
    }
    setIsLoadingUserDetails(true);
    setIsLoadingPieChart(true);

    try {
      const userData = await getUserDocument(user.id);
      if (userData && userData.maintenanceCalories) {
        setMaintenanceCalories(Math.floor(userData.maintenanceCalories));
      } else {
        console.log("Maintenance calories not found, using default.");
        setMaintenanceCalories(2359); // Keep default if not found
      }
      setIsLoadingUserDetails(false);

      const todayDate = moment().format('DD-MM-YYYY');
      const nutritionRef = doc(db, `users/${user.id}/NutritionData/${todayDate}`);
      const nutritionSnap = await getDoc(nutritionRef);

      if (nutritionSnap.exists()) {
        const nutritionData = nutritionSnap.data();
        setCaloriesConsumed(Math.floor(nutritionData.totalCaloriesConsumed || nutritionData.calories || 0));
      } else {
        setCaloriesConsumed(0); // Reset if no doc for today
      }
      setIsLoadingPieChart(false);
    } catch (error) {
      console.error("Error fetching data for Pie Chart:", error);
      setIsLoadingUserDetails(false);
      setIsLoadingPieChart(false);
    }
  }, [user]);

  const fetchBarChartData = useCallback(async () => {
    if (!user) {
      setIsLoadingBarChart(false);
      setBarChartCaloriesData([]);
      setBarChartDateLabels([]);
      return;
    }
    setIsLoadingBarChart(true);

    try {
      const caloriesArray: number[] = [];
      const dateLabels: string[] = [];
      const today = moment();

      for (let i = 6; i >= 0; i--) {
        const targetDate = moment(today).subtract(i, 'days');
        const dateId = targetDate.format('DD-MM-YYYY');
        const shortDate = targetDate.format('MM/DD');
        dateLabels.push(shortDate);

        const nutritionRef = doc(db, `users/${user.id}/NutritionData/${dateId}`);
        const nutritionSnap = await getDoc(nutritionRef);
        let dailyConsumed = 0;
        if (nutritionSnap.exists()) {
          const data = nutritionSnap.data();
          dailyConsumed = Math.floor(data.totalCaloriesConsumed || data.calories || 0);
        }
        caloriesArray.push(dailyConsumed);
      }

      setBarChartCaloriesData(caloriesArray);
      setBarChartDateLabels(dateLabels);
    } catch(error) {
      console.error("Error fetching bar chart data:", error);
      setBarChartCaloriesData([]);
      setBarChartDateLabels([]);
    } finally {
      setIsLoadingBarChart(false);
    }
  }, [user]);

  const fetchLineChartData = useCallback(async () => {
    if (!user) {
      setIsLoadingLineChart(false);
      setLineChartStatsData([]);
      return;
    }
    console.log("Fetching calorie line chart data...");
    setIsLoadingLineChart(true);
    const userId = user.id;
    const today = moment();
    const datePromises: Promise<DailyStat>[] = [];

    for (let i = 6; i >= 0; i--) {
      const targetDate = moment(today).subtract(i, 'days');
      const dateId = targetDate.format('DD-MM-YYYY');
      const dateLabel = targetDate.format('MM/DD');

      const dailyDocRef = doc(db, 'users', userId, 'NutritionData', dateId);
      const promise = getDoc(dailyDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            date: dateLabel,
            consumed: data.totalCaloriesConsumed || 0,
            burned: data.totalCaloriesBurnedExercise || 0,
          };
        } else {
          return { date: dateLabel, consumed: 0, burned: 0 };
        }
      }).catch(error => {
        console.error(`Error fetching data for ${dateId}:`, error);
        return { date: dateLabel, consumed: 0, burned: 0 };
      });
      datePromises.push(promise);
    }

    try {
      const results = await Promise.all(datePromises);
      console.log("Fetched line chart data:", results);
      setLineChartStatsData(results);
    } catch (error) {
      console.error("Error processing line chart data promises:", error);
      setLineChartStatsData([]);
    } finally {
      setIsLoadingLineChart(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchPieChartData();
      fetchBarChartData();
      fetchLineChartData();
    }, [fetchPieChartData, fetchBarChartData, fetchLineChartData])
  );

  const percentageConsumed = maintenanceCalories > 0 
    ? (caloriesConsumed / maintenanceCalories) * 100 
    : 0;

  let remaining = maintenanceCalories > 0 
    ? Math.max(0, 100 - percentageConsumed)
    : 0;

  const pieChartDataSource = [
    {
      name: 'Consumed',
      calories: isNaN(percentageConsumed) ? 0 : percentageConsumed,
      color: '#FF6B6B',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Remaining',
      calories: isNaN(remaining) ? 0 : remaining,
      color: '#FFE0E0',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];

  const barChartDataSource = {
    labels: barChartDateLabels,
    datasets: [ { data: barChartCaloriesData } ],
  };

  const lineChartDataSource = {
    labels: lineChartStatsData.map(d => d.date),
    datasets: [
      {
        data: lineChartStatsData.map(d => d.burned),
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data: lineChartStatsData.map(d => d.consumed),
        color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
        strokeWidth: 3,
      },
    ],
    legend: ["Burned (Exercise)", "Consumed"],
  };

  const renderStatCard = (title: string, value: string, icon: IoniconName, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  const barChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 160, 122, ${opacity})`,
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
    barPercentage: 0.5,
    fillShadowGradient: '#FFA07A',
    fillShadowGradientOpacity: 0.3,
  };

  const lineChartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: "5",
      strokeWidth: "1",
      stroke: "#555"
    },
    propsForBackgroundLines: { strokeDasharray: "", stroke: "#e0e0e0" }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Statistics</Text>
          <Text style={styles.headerSubtitle}>Track your progress</Text>
        </View>

        <View style={styles.cardsContainer}>
          {isLoadingUserDetails ? <ActivityIndicator/> : renderStatCard(
            'Daily Goal',
            `${maintenanceCalories} cal`,
            'fitness-outline',
            '#FF6B6B'
          )}
          {isLoadingPieChart ? <ActivityIndicator/> : renderStatCard(
            'Consumed',
            `${caloriesConsumed} cal`,
            'restaurant-outline',
            '#4ECDC4'
          )}
          {isLoadingPieChart || isLoadingUserDetails ? <ActivityIndicator/> : renderStatCard(
            'Remaining',
            `${Math.max(0, maintenanceCalories - caloriesConsumed)} cal`,
            'timer-outline',
            '#45B7D1'
          )}
        </View>

        <Animated.View style={[styles.chartContainer, animatedBarStyle]}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weekly Consumption</Text>
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
            {isLoadingBarChart ? (
              <ActivityIndicator size="large" color="#FF6B6B" style={styles.loadingIndicator} />
            ) : barChartDataSource.labels && barChartDataSource.labels.length > 0 ? (
              <BarChart
                data={barChartDataSource}
                width={width - 80}
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
                yAxisSuffix=" cal"
              />
            ) : (
              <Text style={styles.emptyText}>No weekly data available.</Text>
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.pieChartContainer, animatedPieStyle]}>
          <Text style={styles.chartTitle}>Today's Progress</Text>
          <View style={styles.pieWrapper}>
            {isLoadingPieChart || isLoadingUserDetails ? (
              <ActivityIndicator size="large" color="#FF6B6B" style={styles.loadingIndicator} />
            ) : (
              <>
                <PieChart
                  data={pieChartDataSource}
                  width={width - 60}
                  height={190}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                  }}
                  accessor="calories"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[ (width - 60) / 5 , 0]}
                  absolute
                  hasLegend={false}
                  avoidFalseZero={true}
                />
                <View style={styles.centerLabel}>
                  <Text style={styles.centerValue}>
                    {Math.round(percentageConsumed)}%
                  </Text>
                  <Text style={styles.centerText}>Consumed</Text>
                </View>
              </>
            )}
          </View>
          
          {!(isLoadingPieChart || isLoadingUserDetails) && (
            <View style={styles.legendContainer}>
              {pieChartDataSource.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.name}</Text>
                  <Text style={styles.legendValue}>{Math.round(item.calories)}%</Text>
                </View>
              ))}
            </View>
          )}

          {!(isLoadingPieChart || isLoadingUserDetails) && (
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
          )}
        </Animated.View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Calories: Consumed vs. Burned</Text>
          <Text style={styles.subTitle}>Last 7 Days</Text>

          {isLoadingLineChart ? (
            <ActivityIndicator size="large" color="#FF6B6B" style={styles.loadingIndicator} />
          ) : lineChartDataSource.labels && lineChartDataSource.labels.length > 0 ? (
            <View style={styles.lineChartWrapper}>
              <LineChart
                data={lineChartDataSource}
                width={screenWidth - 40}
                height={250}
                chartConfig={lineChartConfig}
                bezier
                style={styles.chartStyle}
                withInnerLines={true}
                withOuterLines={true}
                fromZero={true}
                withShadow={false}
                withVerticalLabels={true}
                withHorizontalLabels={true}
              />
            </View>
          ) : (
            <Text style={styles.emptyText}>No detailed calorie data for the last 7 days.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
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
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  statCard: {
    width: '30%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
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
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  chart: {
    marginVertical: 10,
    borderRadius: 16,
  },
  pieChartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 20,
    margin: 20,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pieWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 190,
    marginBottom: 10,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -45 }, { translateY: -25 }],
    zIndex: 1,
  },
  centerValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'black',
  },
  centerText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
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
    marginRight: 5,
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
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  loadingIndicator: {
    marginTop: 50,
    marginBottom: 50,
  },
  lineChartWrapper: {
    alignItems: 'center',
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default Statistics;
