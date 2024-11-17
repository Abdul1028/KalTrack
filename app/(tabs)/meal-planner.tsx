import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const MealPlanner = () => {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('');
  const [mealName, setMealName] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [plannedMeals, setPlannedMeals] = useState<any>({});
  const { user } = useUser();

  const mealTimes = [
    { id: 'breakfast', title: 'Breakfast', icon: 'sunny-outline' },
    { id: 'lunch', title: 'Lunch', icon: 'restaurant-outline' },
    { id: 'dinner', title: 'Dinner', icon: 'moon-outline' },
    { id: 'snacks', title: 'Snacks', icon: 'cafe-outline' },
  ];

  useEffect(() => {
    if (selectedDate) {
      fetchPlannedMeals();
    }
  }, [selectedDate]);

  const fetchPlannedMeals = async () => {
    if (!user) return;
    try {
      const mealsRef = collection(db, `users/${user.id}/plannedMeals`);
      const q = query(mealsRef, where('date', '==', selectedDate));
      const querySnapshot = await getDocs(q);
      
      const meals: any = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!meals[data.mealType]) {
          meals[data.mealType] = [];
        }
        meals[data.mealType].push(data);
      });
      
      setPlannedMeals(meals);
    } catch (error) {
      console.error('Error fetching planned meals:', error);
    }
  };

  const handleAddMeal = async () => {
    if (!mealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    try {
      const mealId = `${selectedDate}-${selectedMealType}-${Date.now()}`;
      const mealRef = doc(db, `users/${user?.id}/plannedMeals/${mealId}`);
      
      await setDoc(mealRef, {
        name: mealName,
        notes: mealNotes,
        mealType: selectedMealType,
        date: selectedDate,
        createdAt: new Date().toISOString(),
      });

      setModalVisible(false);
      setMealName('');
      setMealNotes('');
      fetchPlannedMeals();
      Alert.alert('Success', 'Meal added to plan');
    } catch (error) {
      Alert.alert('Error', 'Failed to add meal');
    }
  };

  const renderMealItems = (mealType: string) => {
    const meals = plannedMeals[mealType] || [];
    if (meals.length === 0) {
      return <Text style={styles.mealSubtitle}>No meals planned</Text>;
    }
    
    return meals.map((meal: any, index: number) => (
      <View key={index} style={styles.plannedMealItem}>
        <Text style={styles.plannedMealName}>{meal.name}</Text>
        {meal.notes && <Text style={styles.plannedMealNotes}>{meal.notes}</Text>}
      </View>
    ));
  };

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

        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>
            {moment(selectedDate).format('MMMM D, YYYY')}
          </Text>
        </View>

        <View style={styles.mealsContainer}>
          {mealTimes.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealIconContainer}>
                  <Ionicons name={meal.icon} size={24} color="#FF6B6B" />
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealTitle}>{meal.title}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedMealType(meal.id);
                    setModalVisible(true);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
              <View style={styles.mealContent}>
                {renderMealItems(meal.id)}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Meal Plan</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Meal name"
              value={mealName}
              onChangeText={setMealName}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              value={mealNotes}
              onChangeText={setMealNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.addButton]}
                onPress={handleAddMeal}
              >
                <Text style={[styles.buttonText, styles.addButtonText]}>Add Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  selectedDateContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonText: {
    color: 'white',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealContent: {
    marginTop: 10,
    paddingLeft: width * 0.15,
  },
  plannedMealItem: {
    marginBottom: 8,
  },
  plannedMealName: {
    fontSize: width * 0.035,
    color: '#333',
    fontWeight: '500',
  },
  plannedMealNotes: {
    fontSize: width * 0.03,
    color: '#666',
    marginTop: 2,
  },
});

export default MealPlanner; 