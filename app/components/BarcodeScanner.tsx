// import React, { useState, useEffect } from 'react';
// import { Text, View, StyleSheet, Button } from 'react-native';
// import { BarCodeScanner } from 'expo-barcode-';
// import axios from 'axios';

// const BarcodeScanner = () => {
//   const [hasPermis sion, setHasPermission] = useState(null);
//   const [scanned, setScanned] = useState(false);

//   useEffect(() => {
//     (async () => {
//       const { status } = await BarCodeScanner.requestPermissionsAsync();
//       setHasPermission(status === 'granted');
//     })();
//   }, []);

//   const handleBarCodeScanned = async ({ data }) => {
//     setScanned(true);
//     try {
//       // Connect to a food database API using the barcode
//       const response = await axios.get(`YOUR_FOOD_API_ENDPOINT/${data}`);
//       // Handle the food data
//     } catch (error) {
//       console.error('Error fetching food data:', error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <BarCodeScanner
//         onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
//         style={StyleSheet.absoluteFillObject}
//       />
//       {scanned && (
//         <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     flexDirection: 'column',
//     justifyContent: 'center',
//   },
// });

// export default BarcodeScanner; 