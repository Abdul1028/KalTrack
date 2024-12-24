import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ServingSizeModal({ 
  visible, 
  onClose, 
  food, 
  onConfirm 
}) {
  const [selectedMeasure, setSelectedMeasure] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [localFood, setLocalFood] = useState(null);

  // Update local food when food prop changes
  React.useEffect(() => {
    if (food) {
      setLocalFood(food);
      setSelectedMeasure(food.measures?.[0] || null);
      setQuantity(1);
    }
  }, [food]);

  const handleClose = () => {
    setSelectedMeasure(null);
    setQuantity(1);
    setLocalFood(null);
    onClose();
  };

  const handleConfirm = () => {
    try {
      if (!selectedMeasure) {
        Alert.alert('Error', 'Please select a serving size');
        return;
      }

      if (!localFood) {
        Alert.alert('Error', 'No food selected');
        return;
      }

      const updatedFood = {
        ...localFood,
        quantity,
        measureLabel: selectedMeasure.label,
        nutrients: {
          ENERC_KCAL: (localFood.nutrients?.ENERC_KCAL || 0) * quantity,
          PROCNT: (localFood.nutrients?.PROCNT || 0) * quantity,
          FAT: (localFood.nutrients?.FAT || 0) * quantity,
          CHOCDF: (localFood.nutrients?.CHOCDF || 0) * quantity,
        }
      };

      onConfirm(updatedFood);
      handleClose();
    } catch (error) {
      console.error('Error in handleConfirm:', error);
      Alert.alert('Error', 'Failed to add food. Please try again.');
    }
  };

  if (!visible || !localFood) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Serving Size</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.foodName}>{localFood.label}</Text>

          <ScrollView style={styles.measuresContainer}>
            {localFood.measures?.map((measure, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.measureItem,
                  selectedMeasure?.label === measure.label && styles.selectedMeasure
                ]}
                onPress={() => setSelectedMeasure(measure)}
              >
                <Text style={styles.measureLabel}>{measure.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => quantity > 0.5 && setQuantity(q => q - 0.5)}
              >
                <Ionicons name="remove" size={24} color="#FF8C00" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setQuantity(q => q + 0.5)}
              >
                <Ionicons name="add" size={24} color="#FF8C00" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Add to Meal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  foodName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 15,
  },
  measuresContainer: {
    maxHeight: 200,
  },
  measureItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedMeasure: {
    backgroundColor: '#FFE5CC',
    borderColor: '#FF8C00',
    borderWidth: 1,
  },
  measureLabel: {
    fontSize: 16,
  },
  quantityContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 25,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '500',
    marginHorizontal: 20,
  },
  confirmButton: {
    backgroundColor: '#FF8C00',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 