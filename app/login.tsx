
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect } from "react";
import { Pressable, Text, View, Image, Dimensions, StyleSheet, Button, Platform } from "react-native";
import { SignedIn, SignedOut, useAuth, useOAuth, useUser } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';


const { width, height } = Dimensions.get("window");


export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Warm up the android browser to improve UX
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

WebBrowser.maybeCompleteAuthSession();

export default function login() {
  useWarmUpBrowser();

  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      alert("You have been logged out!");
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  const { user } = useUser();
  console.log("from index: " + user?.emailAddresses);

  // Destructure the OAuth hooks for Google and Apple
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
      console.log("here");
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
      <Image 
        source={require("../assets/images/APPLOGO.png")} 
        style={styles.logo} 
      />
      <Pressable>
        <View style={styles.infoBox}>
          <Text style={styles.title}>
            Maintain your calories and Stay Healthy
          </Text>
          <Text style={styles.description}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio, neque velit explicabo officia eveniet suscipit sed assumenda vero ut delectus? Ducimus eveniet nesciunt veritatis voluptate eius commodi nihil, velit neque.
          </Text>
          <Pressable onPress={onGooglePress} style={styles.getStartedButton}>
            <Text style={styles.buttonText}>Get Started With Google</Text>
          </Pressable>
          <Pressable onPress={onApplePress} style={[styles.getStartedButton, styles.appleButton]}>
            <Text style={styles.buttonText}>Get Started With Apple</Text>
          </Pressable>
        </View>
      </Pressable>

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
  logo: {
    marginTop: height * 0.1,
    height: height * 0.3,
    width: width * 0.8,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  infoBox: {
    marginTop: 20,
    alignItems: 'center',
    width: width * 0.9,
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 30,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  description: {
    fontSize: 15,
    paddingVertical: 10,
    textAlign: 'center',
  },
  getStartedButton: {
    padding: 15,
    width: width * 0.7,
    textAlign: 'center',
    alignItems: 'center',
    alignContent: 'center',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 15,
    borderRadius: 10,
    backgroundColor: "orange",
  },
  appleButton: {
    backgroundColor: "#000000", 
  },
  buttonText: {
    color: "white",
  },
});
