import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

interface BarcodeScannerProps {
  onFoodFound: (foodData: any) => void;
  onClose: () => void;
}

export default function BarcodeScannerComponent({ onFoodFound, onClose }: BarcodeScannerProps) {
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const EDAMAM_APP_ID = '56082498';

const EDAMAM_APP_KEY = '7e45de6c1b73f0dd65efc3eb5ab33ea5';


  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const searchFoodByBarcode = async (barcode: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.edamam.com/api/food-database/v2/parser?upc=${barcode}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`
      );
      const data = await response.json();
      
      if (data.hints && data.hints.length > 0) {
        onFoodFound(data.hints[0].food);
      } else {
        Alert.alert('Product Not Found', 'This product was not found in our database.');
      }
    } catch (error) {
      console.error('Error searching food:', error);
      Alert.alert('Error', 'Failed to search for food item');
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    searchFoodByBarcode(data);
  };

  if (!hasPermission) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (!hasPermission.granted) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8', 'qr'],
        }}
      />
      {loading && <Text style={styles.loadingText}>Searching product...</Text>}
      {scanned && (
        <View style={styles.buttonContainer}>
          <Button title="Scan Again" onPress={() => setScanned(false)} />
          <Button title="Close Scanner" onPress={onClose} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  loadingText: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: 10,
    borderRadius: 5,
  },
}); 