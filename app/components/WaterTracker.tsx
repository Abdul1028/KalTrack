import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WaterTracker = () => {
  const [waterIntake, setWaterIntake] = useState(0);
  const dailyGoal = 8; // 8 glasses per day

  const addWater = () => {
    setWaterIntake(prev => Math.min(prev + 1, dailyGoal));
  };

  const removeWater = () => {
    setWaterIntake(prev => Math.max(prev - 1, 0));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Water Intake</Text>
      <View style={styles.progressContainer}>
        {Array(dailyGoal).fill(0).map((_, index) => (
          <Ionicons
            key={index}
            name="water"
            size={30}
            color={index < waterIntake ? '#4FC3F7' : '#E0E0E0'}
          />
        ))}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={removeWater} style={styles.button}>
          <Text>-</Text>
        </TouchableOpacity>
        <Text style={styles.count}>{waterIntake} / {dailyGoal} glasses</Text>
        <TouchableOpacity onPress={addWater} style={styles.button}>
          <Text>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
  },
  count: {
    fontSize: 16,
  },
});

export default WaterTracker; 