import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Dimensions,
  Platform,
  Alert,
  Switch,
  Modal,
  NativeModules
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  withTiming,
  withSpring,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleHealthKit, { HealthKitPermissions } from 'react-native-health';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PERMISSIONS = {
  permissions: {
    read: ['Steps', 'Weight', 'Height', 'ActiveEnergyBurned', 'BasalEnergyBurned'],
    write: ['Steps', 'Weight', 'Height'],
  },
};

const AccountHeader = () => {
  const { user } = useUser();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  // AppleHealthKit.isAvailable(()=>{})

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withSpring(0);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.emailAddresses[0]?.emailAddress[0].toUpperCase() || '?';
  };

  return (
    <LinearGradient
      colors={['#FF6B6B', '#FF8E53']}
      style={styles.header}
    >
      <Animated.View style={[styles.profileSection, animatedStyle]}>
        {user?.imageUrl ? (
          <Image
            source={{ uri: user.imageUrl }}
            style={styles.profileImage}
          />
        ) : (
          <View style={[styles.profileImage, styles.initialsContainer]}>
            <Text style={styles.initialsText}>{getInitials()}</Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.emailAddresses[0]?.emailAddress.split('@')[0]}
          </Text>
          <Text style={styles.userEmail}>
            {user?.emailAddresses[0]?.emailAddress}
          </Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

export default function Account() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isWaterReminderOn, setIsWaterReminderOn] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [notificationInterval, setNotificationInterval] = useState(1);
  const [activeNotificationInterval, setActiveNotificationInterval] = useState<NodeJS.Timeout | null>(null);
  const [showSlider, setShowSlider] = useState(false);
  const [sliderValue, setSliderValue] = useState(1);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedFood, setScannedFood] = useState<any>(null);
  const [isHealthKitConnected, setIsHealthKitConnected] = useState(false);
  const [healthData, setHealthData] = useState({
    steps: 0,
    weight: 0,
    height: 0,
    activeEnergy: 0,
    basalEnergy: 0,
  });

  useEffect(() => {
    fetchUserDetails();
    loadWaterReminderPreferences();
    checkNotificationPermissions();
    
    return () => {
      if (activeNotificationInterval) {
        clearInterval(activeNotificationInterval);
      }
    };
  }, []);

  const fetchUserDetails = async () => {
    if (user?.id) {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        setUserDetails(userDoc.data());
      }
    }
  };

  const loadWaterReminderPreferences = async () => {
    try {
      const reminderOn = await AsyncStorage.getItem('waterReminderOn');
      const interval = await AsyncStorage.getItem('waterReminderInterval');
      
      if (reminderOn) setIsWaterReminderOn(JSON.parse(reminderOn));
      if (interval) setNotificationInterval(JSON.parse(interval));
    } catch (error) {
      console.log('Error loading preferences:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          onPress: async () => {
            await signOut();
            router.replace("/login");
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderMetricCard = (title: string, value: string, icon: string, color: string) => (
    <Animated.View 
      entering={FadeInDown.delay(300).springify()}
      style={[styles.metricCard, { backgroundColor: `${color}15` }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}25` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </Animated.View>
  );

  const renderSettingItem = (icon: string, title: string, onPress: () => void, showBadge?: boolean) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={22} color="#666" />
        </View>
        <Text style={styles.settingText}>{title}</Text>
      </View>
      <View style={styles.settingRight}>
        {showBadge && <View style={styles.badge}><Text style={styles.badgeText}>New</Text></View>}
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );


  const toggleWaterReminder = async (value: boolean) => {
    try {
      setIsWaterReminderOn(value);
      
      if (!value) {
        // Turn off reminders
        await Notifications.cancelAllScheduledNotificationsAsync();
        await AsyncStorage.setItem('waterReminderOn', 'false');
        setShowReminderSettings(false);
        setShowSlider(false);
        return;
      }

      // Check permissions when turning on
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Permission Required', 'Please enable notifications to use this feature.');
          setIsWaterReminderOn(false);
          return;
        }
      }

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('water-reminders', {
          name: 'Water Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF8C00',
        });
      }

      // Just show the slider when turning on
      setShowSlider(true);
      setShowReminderSettings(true);
      await AsyncStorage.setItem('waterReminderOn', 'true');

    } catch (error) {
      console.error("Error toggling water reminder:", error);
      Alert.alert('Error', 'Failed to set water reminder');
    }
  };

  const handleIntervalSelection2 = async (value: number) => {
    try {
      setNotificationInterval(value); // Store the selected interval (optional)
  
      // Cancel all existing notifications before scheduling a new repeating one
      await Notifications.cancelAllScheduledNotificationsAsync();
  
      // Schedule a repeating notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Water Reminder',
          body: 'Time to hydrate yourself!',
          sound: true,
        },
        trigger: {
          seconds: value * 60, // Repeat every 'value' minutes
          repeats: true, // Ensures the notification repeats
        },
      });
  
      Alert.alert(
        'Notification Scheduled',
        `A repeating notification has been scheduled every ${value} minutes.`
      );
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule the notification');
    }
  };
  
  

  const handleIntervalSelection = async (value: number) => {
    try {
      if (value < 1) {
        Alert.alert('Invalid Interval', 'Please select a time interval of 1 minute or more');
        return;
      }
      
      setNotificationInterval(value);
      await scheduleWaterReminder(value);
      
    } catch (error) {
      console.error("Error updating reminder interval:", error);
      Alert.alert('Error', 'Failed to update reminder interval');
    }
  };

  const checkNotificationPermissions = async () => {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) {
      return true;
    }
    
    const permissionResponse = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    });
    
    return permissionResponse.granted;
  };

  useEffect(() => {
    const setupNotifications = async () => {
      // Request permissions first
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications to use this feature.');
        return;
      }

      // Set up Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('water-reminders', {
          name: 'Water Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF8C00',
        });
      }
    };

    setupNotifications();

    // Set up notification handlers
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received while app in foreground:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User interacted with notification:', response);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const initializeHealthKit = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'HealthKit is only available on iOS devices');
      return;
    }

    try {
      // First check if HealthKit is available
      AppleHealthKit.isAvailable((error: string, result: boolean) => {
        if (error) {
          console.log('Error checking HealthKit availability:', error);
          return;
        }
        
        if (!result) {
          Alert.alert('Not Available', 'HealthKit is not available on this device');
          return;
        }

        // Initialize HealthKit with permissions
        const PERMISSIONS = {
          permissions: {
            read: [
              AppleHealthKit.Constants.Permissions.Steps,
              AppleHealthKit.Constants.Permissions.Weight,
              AppleHealthKit.Constants.Permissions.Height,
              AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
              AppleHealthKit.Constants.Permissions.BasalEnergyBurned
            ],
            write: [
              AppleHealthKit.Constants.Permissions.Steps,
              AppleHealthKit.Constants.Permissions.Weight,
              AppleHealthKit.Constants.Permissions.Height
            ],
          },
        };

        AppleHealthKit.initHealthKit(PERMISSIONS, (error: string) => {
          if (error) {
            console.log('Error initializing HealthKit:', error);
            Alert.alert('Error', 'Failed to initialize HealthKit');
            return;
          }
          
          console.log('HealthKit initialized successfully');
          setIsHealthKitConnected(true);
          fetchHealthData();
        });
      });

    } catch (error) {
      console.log('Error initializing HealthKit:', error);
      Alert.alert('Error', 'Failed to initialize HealthKit');
    }
  };

  const fetchHealthData = async () => {
    if (!AppleHealthKit) return;

    try {
      const options = {
        startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        endDate: new Date().toISOString(),
      };

      // Fetch steps
      AppleHealthKit.getStepCount(options, (err: any, results: any) => {
        if (!err) {
          setHealthData(prev => ({ ...prev, steps: results?.value || 0 }));
        }
      });

      // Fetch weight
      AppleHealthKit.getLatestWeight(options, (err: any, results: any) => {
        if (!err) {
          setHealthData(prev => ({ ...prev, weight: results?.value || 0 }));
        }
      });

      // Fetch height
      AppleHealthKit.getLatestHeight(options, (err: any, results: any) => {
        if (!err) {
          setHealthData(prev => ({ ...prev, height: results?.value || 0 }));
        }
      });

      // Fetch active energy
      AppleHealthKit.getActiveEnergyBurned(options, (err: any, results: any) => {
        if (!err) {
          setHealthData(prev => ({ ...prev, activeEnergy: results?.value || 0 }));
        }
      });

      // Fetch basal energy
      AppleHealthKit.getBasalEnergyBurned(options, (err: any, results: any) => {
        if (!err) {
          setHealthData(prev => ({ ...prev, basalEnergy: results?.value || 0 }));
        }
      });

    } catch (error) {
      console.log('Error fetching health data:', error);
      Alert.alert('Error', 'Failed to fetch health data');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AccountHeader />

      <View style={styles.content}>
        <View style={styles.metricsContainer}>
          {renderMetricCard(
            'Goal',
            userDetails?.userGoal === "weight gain" ? "Gain" : userDetails?.userGoal === "weight loss" ? "Loss" : "Not Set",
            'fitness-outline',
            '#FF6B6B'
          )}
          {renderMetricCard(
            'Daily Target',
            `${Math.round(userDetails?.maintenanceCalories || 0)} cal`,
            'flame-outline',
            '#4ECDC4'
          )}
          {renderMetricCard(
            'Weight',
            `${userDetails?.weight || 0} kg`,
            'scale-outline',
            '#45B7D1'
          )}
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {renderSettingItem('person-outline', 'Edit Profile', () => {})}
          {renderSettingItem('notifications-outline', 'Notifications', () => {}, true)}
          {renderSettingItem('shield-checkmark-outline', 'Privacy', () => {})}
          {renderSettingItem('help-circle-outline', 'Help & Support', () => {})}
          {renderSettingItem('information-circle-outline', 'About', () => {})}
          {renderSettingItem('barcode-outline', 'Scan Food', () => {
            // TODO: Uncomment and resolve Expo Modules Core / BarCode Scanner issues
            // To re-enable:
            // 1. Ensure expo-barcode-scanner is installed: 
            //    `npx expo install expo-barcode-scanner`
            // 2. Verify expo-modules-core is installed:
            //    `npx expo install expo-modules-core`
            // 3. Rebuild the project:
            //    `npx expo prebuild --clean`
            // setShowScanner(true)
          })}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="water-outline" size={22} color="#666" />
              </View>
              <Text style={styles.settingText}>Water Reminder</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.intervalText}>
                {isWaterReminderOn && !showSlider ? `${notificationInterval}m` : ''}
              </Text>
              <Switch
                value={isWaterReminderOn}
                onValueChange={toggleWaterReminder}
                trackColor={{ false: '#767577', true: '#FF6B6B' }}
                thumbColor={isWaterReminderOn ? '#ff4444' : '#f4f3f4'}
              />
            </View>
          </View>

          {isWaterReminderOn && showSlider && (
            <View style={styles.reminderSettings}>
              <Text style={styles.reminderText}>
                Select reminder interval (minutes): {sliderValue}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={6}
                step={1}
                value={sliderValue}
                onValueChange={(value) => setSliderValue(value)}
                onSlidingComplete={handleIntervalSelection}
                minimumTrackTintColor="#FF6B6B"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#FF6B6B"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>1m</Text>
                <Text style={styles.sliderLabel}>2m</Text>
                <Text style={styles.sliderLabel}>4m</Text>
                <Text style={styles.sliderLabel}>6m</Text>
              </View>
            </View>
          )}

          {Platform.OS === 'ios' && (
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name="fitness-outline" size={22} color="#666" />
                </View>
                <Text style={styles.settingText}>Connect HealthKit</Text>
              </View>
              <View style={styles.settingRight}>
                <Switch
                  value={isHealthKitConnected}
                  onValueChange={(value) => {
                    if (value) {
                      initializeHealthKit();
                    } else {
                      setIsHealthKitConnected(false);
                      setHealthData({
                        steps: 0,
                        weight: 0,
                        height: 0,
                        activeEnergy: 0,
                        basalEnergy: 0,
                      });
                    }
                  }}
                  trackColor={{ false: '#767577', true: '#FF6B6B' }}
                  thumbColor={isHealthKitConnected ? '#ff4444' : '#f4f3f4'}
                />
              </View>
            </View>
          )}
        </View>

        {isHealthKitConnected && (
          <View style={styles.healthDataContainer}>
            <Text style={styles.sectionTitle}>Health Data</Text>
            <View style={styles.metricsContainer}>
              {renderMetricCard(
                'Steps',
                `${healthData.steps}`,
                'footsteps-outline',
                '#4ECDC4'
              )}
              {renderMetricCard(
                'Active Cal',
                `${Math.round(healthData.activeEnergy)}`,
                'flame-outline',
                '#FF6B6B'
              )}
              {renderMetricCard(
                'Basal Cal',
                `${Math.round(healthData.basalEnergy)}`,
                'battery-charging-outline',
                '#45B7D1'
              )}
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </View>

      {/* Commented out Modal for Barcode Scanner */}
      {/* {showScanner && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={showScanner}
          onRequestClose={() => setShowScanner(false)}
        >
          <View style={{ flex: 1 }}>
            <BarcodeScanner
              onFoodFound={(foodData) => {
                setScannedFood(foodData);
                setShowScanner(false);
                Alert.alert(
                  'Food Found',
                  `Found: ${foodData.label}\nCalories: ${Math.round(foodData.nutrients.ENERC_KCAL)} kcal`,
                  [
                    {
                      text: 'Add to Log',
                      onPress: () => {
                        // TODO: Implement food logging
                        console.log('Adding to log:', foodData);
                      }
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    }
                  ]
                );
              }}
              onClose={() => setShowScanner(false)}
            />
          </View>
        </Modal>
      )} */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginTop: Platform.OS === 'ios' ? 40 : 25,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 15 : 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  profileInfo: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  metricCard: {
    width: width * 0.28,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
  },
  settingsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: '#FFF0F0',
  },
  signOutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  initialsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  reminderSettings: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    marginTop: 10,
    borderRadius: 15,
    marginHorizontal: 20,
  },
  
  reminderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 10,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  intervalText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
  },
  healthDataContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
