// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBZTEea2EzFDjv-cAGJqAg_DjqVZ0sKHtM",
  authDomain: "kaltrack-fa83e.firebaseapp.com",
  projectId: "kaltrack-fa83e",
  storageBucket: "kaltrack-fa83e.appspot.com",
  messagingSenderId: "416311505314",
  appId: "1:416311505314:web:14c1ebc3d391611bab02fb",
  measurementId: "G-KZKRVDMMNX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
