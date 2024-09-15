// import { useAuth, useUser } from "@clerk/clerk-expo"
// import { useURL } from "expo-linking"
// import React from "react"
// import { StyleSheet, Image, Text, View, Pressable } from "react-native"
// import { Ionicons } from '@expo/vector-icons';

// export default function account() {
//   const {user} = useUser();

//   const { signOut } = useAuth();

//   const handleLogout = async () => {
//       console.log("logged out");
//     try {
//       await signOut();
//       alert("You have been logged out!");
      
//     } catch (error) {
//       console.error("Error logging out: ", error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* Top Navigation with Back Arrow and Profile Title */}
//       <View style={styles.header}>
//         <Ionicons style={styles.backIcon} name="arrow-back" size={24} />
//         <Text style={styles.profileTitle}>Profile</Text>
//       </View>

//       {/* Profile Information Section */}
//       <View style={styles.profileInfo}>
//         <Image
//           style={styles.profilePicture}
//           source={{
//             uri: user?.imageUrl,
//           }}
//         />
//         <Text style={styles.profileName}>{user?.fullName}</Text>
//         <Text style={styles.profileEmail}>{user?.emailAddresses[0].emailAddress}</Text>
//       </View>

//       {/* Me Section (Green Active Card) */}
//       <View style={styles.sectionCardGreen}>
//         <Text style={styles.sectionText}>Me</Text>
//         <Ionicons
//           style={styles.icon}
//           size={20}
//           name="arrow-forward"
//         />
//       </View>

//       {/* Maintenance Calorie Section */}
//       <View style={styles.sectionCard}>
//         <Text style={styles.sectionText}>Maintainance Calorie</Text>
//         <Text style={styles.sectionValue}>3400 Cal</Text>
//       </View>

//       {/* BMI Section */}
//       <View style={styles.sectionCard}>
//         <Text style={styles.sectionText}>BMI</Text>
//         <Text style={styles.sectionValue}>Kilograms</Text>
//       </View>

//       {/* Water Tracker Section */}
//       <View style={styles.sectionCard}>
//         <Ionicons
//         name="water"
//         size={24}
//         />
//         <Text style={styles.sectionText}>Water Tracker</Text>
//         <Text style={styles.sectionValue}>Enabled</Text>
//       </View>

//       {/* Settings Section */}
//       <View style={styles.sectionCard} >
//       <Text style={styles.sectionText}>Settings</Text>
//         <Ionicons
//           style={styles.icon}
//           name="settings"
//           size={24}
//           onPress={()=>{console.log("heyy")}}
//         />
//       </View>

//       {/* Logout Section */}
//       <Pressable onPress={()=>{
//         console.log("heyy");
//       }}
//       >
//       <View style={styles.sectionCardGreen}>
//         <Text style={styles.sectionText}>Logout</Text>
//         <Ionicons
//           style={styles.icon}
//           size={24}
//           name="log-out"
//         />
//       </View>
//       </Pressable>

//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     marginTop:30,
//     paddingHorizontal: 20,

//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent:"flex-start",
//     marginTop: 20,
//   },
//   backIcon: {
//     width: 24,
//     height: 24,
//   },
//   profileTitle: {
//     fontSize: 18,
//     fontWeight: "500",
//     color: "#0D1220",
//     marginLeft: 16,
//   },
//   profileInfo: {
//     alignItems: "center",
//     marginVertical: 20,
//   },
//   profilePicture: {
//     width: 90,
//     height: 90,
//     borderRadius: 45,
//   },
//   profileName: {
//     fontSize: 20,
//     fontWeight: "500",
//     color: "#0D1220",
//     marginTop: 10,
//   },
//   profileEmail: {
//     fontSize: 16,
//     color: "orange",
//   },
//   sectionCardGreen: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#FFA500",
//     padding: 16,
//     borderRadius: 10,
//     marginVertical: 8,
//   },
//   sectionCard: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#FFD580",
//     padding: 16,
//     borderRadius: 10,
//     marginVertical: 8,
//   },



//   sectionText: {
//     fontSize: 16,
//     color: "black",
//     fontWeight:"500",
//   },
//   sectionValue: {
//     fontSize: 15,
//     color: "#FF8C00",
//   },

//   newsectionValue: {
//     fontSize: 14,
//     color: "#35CC8C",
//   },




//   sectionValueGreen: {
//     fontSize: 14,
//     color: "#35CC8C",
//   },
//   icon: {
//     width: 24,
//     height: 24,
//   },
//   logoutSection: {
//     flexDirection: "row",
//     justifyContent: "flex-start",
//     alignItems: "center",
//     marginVertical: 20,
//   },
//   logoutText: {
//     fontSize: 14,
//     color: "#CB2030",
//     marginLeft: 12,
//   },
// })


import { useAuth, useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState } from "react";
import { StyleSheet, Image, Text, View, Pressable, Alert, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { ScrollView } from "react-native-gesture-handler";

export default function Account() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [userData, setUserData] = useState(Object);

  const handleLogout = async () => {
    console.log("logged out");
    try {
      await signOut();
      alert("You have been logged out!");
      router.push("/login")
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  // const confirmLogout = () => {
  //   Alert.alert(
  //     "Confirm Logout",
  //     "Are you sure you want to logout?",
  //     [
  //       {
  //         text: "No",
  //         onPress: () => console.log("Logout cancelled"),
  //         style: "cancel", // Optionally style the 'No' button
  //       },
  //       {
  //         text: "Yes",
  //         onPress: () => handleLogout(), // Call the logout function if 'Yes' is pressed
  //       },
  //     ],
  //     { cancelable: false } // Prevent closing the alert by tapping outside
  //   );

  //   if(Platform.OS =="web"){
  //     Alert.alert("You logged out");
  //   }

  // };


  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      // For web
      const userConfirmed = window.confirm("Are you sure you want to logout?");
      if (userConfirmed) {
        handleLogout(); // Call the logout function if 'Yes' is pressed
      } else {
        console.log("Logout cancelled");
      }
    } else {
      // For native (iOS/Android)
      Alert.alert(
        "Confirm Logout",
        "Are you sure you want to logout?",
        [
          {
            text: "No",
            onPress: () => console.log("Logout cancelled"),
            style: "cancel",
          },
          {
            text: "Yes",
            onPress: () => handleLogout(),
          },
        ],
        { cancelable: false }
      );
    }
  };

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

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const data = await getUserDocument(user.id); // Use user.id from Clerk
          setUserData(data);
          console.log("data: "+JSON.stringify(data));
          console.log("data is here "+userData['email']);
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  return (
    <ScrollView>
    <View style={styles.container}>
      {/* Top Navigation with Back Arrow and Profile Title */}
      <View style={styles.header}>
        <Ionicons style={styles.backIcon} name="arrow-back" size={24} />
        <Text style={styles.profileTitle}>Profile</Text>
      </View>

      {/* Profile Information Section */}
      <View style={styles.profileInfo}>
        <Image
          style={styles.profilePicture}
          source={{
            uri: user?.imageUrl,
          }}
        />
        <Text style={styles.profileName}>{user?.fullName}</Text>
        <Text style={styles.profileEmail}>{user?.emailAddresses[0].emailAddress}</Text>
      </View>

      {/* Me Section (Green Active Card) */}
      <View style={styles.sectionCardGreen}>
        <Text style={styles.sectionText}>Me</Text>
        <Ionicons
          style={styles.icon}
          size={20}
          name="arrow-forward"
        />
      </View>

      {/* Maintenance Calorie Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionText}>Maintenance Calorie</Text>
        <Text style={styles.sectionValue}>{Math.floor(userData['maintenanceCalories'])} Cal</Text>
      </View>

      {/* BMI Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionText}>Body Mass Index BMI</Text>
        <Text style={styles.sectionValue}>{Math.floor(userData['bmi'])}</Text>
      </View>

      {/* BMR Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionText}>Basic Metabolism Rate BMR</Text>
        <Text style={styles.sectionValue}>{Math.floor(userData['bmr'])}</Text>
      </View>


      {/* Water Tracker Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionText}>Water Tracker</Text>
        <Text style={styles.sectionValue}>Enabled</Text>
      </View>

      {/* Settings Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionText}>Settings</Text>
        <Ionicons
          style={styles.icon}
          name="settings"
          size={24}
        />
      </View>

      {/* Logout Section */}
      <Pressable
        onPress={() => {
          console.log("heyy");
          confirmLogout(); // Call the logout function
        }}
        style={({ pressed }) => [
          styles.sectionCardGreen,
          { backgroundColor: pressed ? 'lightcoral' : '#FFA500' } // Change color when pressed
        ]}
      >
        <Text style={styles.sectionText}>Logout</Text>
        <Ionicons
          style={styles.icon}
          size={24}
          name="log-out"
        />
      </Pressable>
    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#0D1220",
    marginLeft: 16,
  },
  profileInfo: {
    alignItems: "center",
    marginVertical: 20,
  },
  profilePicture: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "500",
    color: "#0D1220",
    marginTop: 10,
  },
  profileEmail: {
    fontSize: 16,
    color: "orange",
  },
  sectionCardGreen: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFA500",
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
  },
  sectionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFD580",
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
  },
  sectionText: {
    fontSize: 16,
    color: "black",
    fontWeight: "500",
  },
  sectionValue: {
    fontSize: 15,
    color: "#FF8C00",
  },
  icon: {
    width: 24,
    height: 24,
  },
});
