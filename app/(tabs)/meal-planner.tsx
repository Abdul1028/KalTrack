import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const MealPlanner = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const { user } = useUser();

  const mealTimes = [
    { id: 1, title: 'Breakfast', icon: 'sunny-outline' },
    { id: 2, title: 'Lunch', icon: 'restaurant-outline' },
    { id: 3, title: 'Dinner', icon: 'moon-outline' },
    { id: 4, title: 'Snacks', icon: 'cafe-outline' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Meal Planner</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Calendar
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: '#FF6B6B' }
          }}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            selectedDayBackgroundColor: '#FF6B6B',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#FF6B6B',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#FF6B6B',
            monthTextColor: '#2d4150',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
          }}
        />

        {selectedDate && (
          <View style={styles.mealsContainer}>
            {mealTimes.map((meal) => (
              <TouchableOpacity 
                key={meal.id} 
                style={styles.mealCard}
                onPress={() => {/* Navigate to meal selection */}}
              >
                <View style={styles.mealIconContainer}>
                  <Ionicons name={meal.icon} size={24} color="#FF6B6B" />
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealTitle}>{meal.title}</Text>
                  <Text style={styles.mealSubtitle}>Add meal</Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: width * 0.05,
  },
  headerTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    marginBottom: height * 0.02,
    color: '#333',
  },
  mealsContainer: {
    marginTop: height * 0.02,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: width * 0.04,
    borderRadius: 12,
    marginBottom: height * 0.015,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mealIconContainer: {
    width: width * 0.12,
    height: width * 0.12,
    backgroundColor: '#FFF0F0',
    borderRadius: width * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
    marginLeft: width * 0.03,
  },
  mealTitle: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#333',
  },
  mealSubtitle: {
    fontSize: width * 0.035,
    color: '#666',
    marginTop: 4,
  },
});

export default MealPlanner; 