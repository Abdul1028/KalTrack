
// import * as WebBrowser from 'expo-web-browser';
// import { useCallback, useEffect } from "react";
// import { Pressable, Text, View, Image, Dimensions, StyleSheet, Button, Platform } from "react-native";
// import { SignedIn, SignedOut, useAuth, useOAuth, useUser } from '@clerk/clerk-expo';
// import * as Linking from 'expo-linking';
// import { Redirect } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';



// export const useWarmUpBrowser = () => {
//   useEffect(() => {
//     // Warm up the android browser to improve UX
//     void WebBrowser.warmUpAsync();
//     return () => {
//       void WebBrowser.coolDownAsync();
//     };
//   }, []);
// }

// WebBrowser.maybeCompleteAuthSession();

// export default function login() {
//   useWarmUpBrowser();

//   const { signOut } = useAuth();

//   const { user } = useUser();
//   console.log("from index: " + user?.emailAddresses);

//   // Destructure the OAuth hooks for Google and Apple
//   const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
//   const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });

//   const onGooglePress = useCallback(async () => {
//     try {
//       const oauthResponse = await startGoogleOAuthFlow({
//         redirectUrl: Linking.createURL('/home', { scheme: 'myapp' }),
//       });

//       const { createdSessionId, setActive } = oauthResponse || {};

//       if (createdSessionId && setActive) {
//         await setActive({ session: createdSessionId });
//         console.log("Google session is active!");
//       } else {
//         console.log("No Google session created or setActive is undefined");
//       }
//     } catch (err) {
//       console.error('OAuth Google error', err);
//     }
//   }, [startGoogleOAuthFlow]);

//   const onApplePress = useCallback(async () => {
//     try {
//       console.log("here");
//       const oauthResponse = await startAppleOAuthFlow({
//         redirectUrl: Linking.createURL('/home', { scheme: 'myapp' }),
//       });

//       const { createdSessionId, setActive } = oauthResponse || {};

//       if (createdSessionId && setActive) {
//         await setActive({ session: createdSessionId });
//         console.log("Apple session is active!");
//       } else {
//         console.log("No Apple session created or setActive is undefined");
//       }
//     } catch (err) {
//       console.error('OAuth Apple error', err);
//     }
//   }, [startAppleOAuthFlow]);

//   return (
//     <View style={styles.container}>
  
//       <Pressable>
//         <View style={styles.infoBox}>
//           <Text style={styles.title}>
//            Login to Continue
//           </Text>
//           <Pressable onPress={onGooglePress} style={styles.getStartedButton}>
//             <Text style={styles.buttonText}>Get Started With Google</Text>
//           </Pressable>

//           <Pressable onPress={onApplePress} style={[styles.getStartedButton, styles.appleButton]}>         
//             <Text style={styles.buttonText}>Get Started With Apple</Text>
//           </Pressable>
//         </View>
//       </Pressable>

//       <SignedIn>
//         <Redirect href={"/setup"}/>
//       </SignedIn>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   infoBox: {
//     marginTop: 20,
//     alignItems: 'center',
//     width: width * 0.9,
//     padding: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
//   description: {
//     fontSize: 15,
//     paddingVertical: 10,
//     textAlign: 'center',
//   },
//   getStartedButton: {
//     padding: 15,
//     width: width * 0.7,
//     textAlign: 'center',
//     alignItems: 'center',
//     alignContent: 'center',
//     fontSize: 17,
//     fontWeight: 'bold',
//     marginTop: 15,
//     borderRadius: 10,
//     backgroundColor: "orange",
//   },
//   appleButton: {
//     backgroundColor: "#000000", 
//   },
//   buttonText: {
//     color: "white",
//   },
// });


import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect } from "react";
import { Pressable, Text, View, Image, Dimensions, StyleSheet, Platform } from "react-native";
import { SignedIn, SignedOut, useAuth, useOAuth, useUser } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons'; // For Google logo

const { width } = Dimensions.get('window');

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  useWarmUpBrowser();

  const { signOut } = useAuth();
  const { user } = useUser();
  console.log("from index: " + user?.emailAddresses);

  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });

  const onGooglePress = useCallback(async () => {
    try {
      const oauthResponse = await startGoogleOAuthFlow({
        redirectUrl: Linking.createURL('/home', { scheme: 'myapp' }),
      });

      const { createdSessionId, setActive } = oauthResponse || {};

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        console.log("Google session is active!");
      } else {
        console.log("No Google session created or setActive is undefined");
      }
    } catch (err) {
      console.error('OAuth Google error', err);
    }
  }, [startGoogleOAuthFlow]);

  const onApplePress = useCallback(async () => {
    try {
      const oauthResponse = await startAppleOAuthFlow({
        redirectUrl: Linking.createURL('/home', { scheme: 'myapp' }),
      });

      const { createdSessionId, setActive } = oauthResponse || {};

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        console.log("Apple session is active!");
      } else {
        console.log("No Apple session created or setActive is undefined");
      }
    } catch (err) {
      console.error('OAuth Apple error', err);
    }
  }, [startAppleOAuthFlow]);

  return (
    
    <View style={styles.container}>
      {/* Image at the top */}
      <Image
        source={require("../assets/images/logo.png")} // Replace with your image URL
        style={styles.image}
      />

      <View style={styles.infoBox}>
        <Text style={styles.title}>Login to Continue</Text>

        {/* Google button with logo */}
        <Pressable onPress={onGooglePress} style={styles.getStartedButton}>
          <View style={styles.buttonContent}>
            <FontAwesome name="google" size={24} color="white" style={styles.icon} />
            <Text style={styles.buttonText}>Get Started With Google</Text>
          </View>
        </Pressable>

        {/* Apple button with logo */}
        <Pressable onPress={onApplePress} style={[styles.getStartedButton, styles.appleButton]}>
          <View style={styles.buttonContent}>
            <Ionicons name="logo-apple" size={24} color="white" style={styles.icon} />
            <Text style={styles.buttonText}>Get Started With Apple</Text>
          </View>
        </Pressable>
      </View>

      <SignedIn>
        <Redirect href={"/setup"}/>
      </SignedIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.8,
    height: width * 0.4,
    marginTop: '15%',
    marginBottom: 20,
    resizeMode: 'contain',
  },
  infoBox: {
    alignItems: 'center',
    width: width * 0.9,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  getStartedButton: {
    flexDirection: 'row',
    justifyContent:'center',
    padding: 15,
    width: width * 0.7,
    alignItems: 'center',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 15,
    borderRadius: 10,
    backgroundColor: "orange",
  },
  appleButton: {
    backgroundColor: "#000000",
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: "white",
    fontSize:16,
  },
});
