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
  Switch
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

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const AccountHeader = () => {
  const { user } = useUser();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

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
  const [notificationInterval, setNotificationInterval] = useState(4);
  const [activeNotificationInterval, setActiveNotificationInterval] = useState<NodeJS.Timeout | null>(null);
  const [showSlider, setShowSlider] = useState(false);

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

  const scheduleWaterReminder = async (interval: number) => {
    if (activeNotificationInterval) {
      clearInterval(activeNotificationInterval);
    }

    if (interval === 0) {
      return;
    }

    const newInterval = setInterval(async () => {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Time to drink water! 💧",
            body: "Stay hydrated for better health!",
            sound: true,
          },
          trigger: null,
        });
      } catch (error) {
        console.error("Error scheduling notification:", error);
      }
    }, interval * 1000);

    setActiveNotificationInterval(newInterval);
  };

  const toggleWaterReminder = async (value: boolean) => {
    try {
      setIsWaterReminderOn(value);
      
      if (!value) {
        if (activeNotificationInterval) {
          clearInterval(activeNotificationInterval);
          setActiveNotificationInterval(null);
        }
        await AsyncStorage.setItem('waterReminderOn', JSON.stringify(false));
        setShowReminderSettings(false);
        setShowSlider(false);
      } else {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            Alert.alert('Permission Required', 'Please enable notifications to use this feature.');
            setIsWaterReminderOn(false);
            return;
          }
        }

        await AsyncStorage.setItem('waterReminderOn', JSON.stringify(true));
        setShowReminderSettings(true);
        setShowSlider(true);
        await scheduleWaterReminder(notificationInterval);
      }
    } catch (error) {
      console.error("Error toggling water reminder:", error);
      Alert.alert('Error', 'Failed to set water reminder');
    }
  };

  const handleIntervalSelection = async (value: number) => {
    try {
      await AsyncStorage.setItem('waterReminderInterval', JSON.stringify(value));
      if (isWaterReminderOn && value > 0) {
        await scheduleWaterReminder(value);
        
        Alert.alert(
          'Water Reminder Set',
          `You will be reminded to drink water every ${value} seconds.`,
          [
            {
              text: 'OK',
              onPress: () => setShowSlider(false)
            }
          ]
        );
      }
    } catch (error) {
      console.error("Error updating reminder interval:", error);
      Alert.alert('Error', 'Failed to update reminder interval');
    }
  };

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        alert('You need to enable notifications for this feature to work.');
      }
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
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="water-outline" size={22} color="#666" />
              </View>
              <Text style={styles.settingText}>Water Reminder</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.intervalText}>
                {isWaterReminderOn && !showSlider ? `${notificationInterval}s` : ''}
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
                Select reminder interval
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={12}
                step={4}
                value={notificationInterval}
                onValueChange={setNotificationInterval}
                onSlidingComplete={handleIntervalSelection}
                minimumTrackTintColor="#FF6B6B"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#FF6B6B"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>0s</Text>
                <Text style={styles.sliderLabel}>4s</Text>
                <Text style={styles.sliderLabel}>8s</Text>
                <Text style={styles.sliderLabel}>12s</Text>
              </View>
            </View>
          )}
        </View>

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
});
