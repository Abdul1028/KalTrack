import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from "react";
import { 
  Pressable, 
  Text, 
  View, 
  Image, 
  Dimensions, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { SignedIn, SignedOut, useAuth, useOAuth, useUser, useSignIn, useSignUp } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const THEME = {
  primary: '#FF8C00', // Deep Orange
  secondary: '#FFA500', // Orange
  text: '#333333',
  error: '#FF3B30',
  background: '#FFFFFF',
  inputBorder: '#E0E0E0',
};

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
  const router = useRouter();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  
  // State management
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Keep your existing OAuth hooks
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: startGithubOAuthFlow } = useOAuth({ strategy: 'oauth_github' });

  // Keep your existing onGooglePress and onApplePress functions...

  const onGooglePress = useCallback(async () => {
    try {
      console.log("🔵 Starting Google OAuth flow...");
      console.log("🔵 Redirect URL:", Linking.createURL('/setup', { scheme: 'myapp' }));
      
      const oauthResponse = await startGoogleOAuthFlow({
        redirectUrl: Linking.createURL('/setup', { scheme: 'myapp' }),
      });

      console.log("🔵 Full Google OAuth Response:", JSON.stringify(oauthResponse, null, 2));

      if (!oauthResponse) {
        console.log("❌ Google OAuth response is null");
        return;
      }

      const { createdSessionId, setActive, signIn, signUp, authSessionResult } = oauthResponse;

      console.log("🔵 Auth Session Result:", JSON.stringify(authSessionResult, null, 2));
      console.log("🔵 Sign In Status:", signIn?.status);
      console.log("🔵 Sign Up Status:", signUp?.status);
      console.log("🔵 Created Session ID:", createdSessionId);

      if (!createdSessionId) {
        console.log("❌ No Google session ID was created");
        return;
      }

      if (!setActive) {
        console.log("❌ Google setActive function is undefined");
        return;
      }

      await setActive({ session: createdSessionId });
      console.log("✅ Google session activated successfully!");
      router.replace('/setup');
      
    } catch (err) {
      console.error('❌ OAuth Google error:', err);
      if (err instanceof Error) {
        console.error('❌ Google Error message:', err.message);
        console.error('❌ Google Error stack:', err.stack);
      }
    }
  }, [startGoogleOAuthFlow]);

  const onApplePress = useCallback(async () => {
    try {
      console.log("🍎 Starting Apple OAuth flow...");
      console.log("🍎 Redirect URL:", Linking.createURL('/setup', { scheme: 'myapp' }));

      const oauthResponse = await startAppleOAuthFlow({
        redirectUrl: Linking.createURL('/setup', { scheme: 'myapp' }),
      });

      console.log("🍎 Full Apple OAuth Response:", JSON.stringify(oauthResponse, null, 2));

      if (!oauthResponse) {
        console.log("❌ Apple OAuth response is null");
        return;
      }

      const { createdSessionId, setActive, signIn, signUp, authSessionResult } = oauthResponse;

      console.log("🍎 Auth Session Result:", JSON.stringify(authSessionResult, null, 2));
      console.log("🍎 Sign In Status:", signIn?.status);
      console.log("🍎 Sign Up Status:", signUp?.status);
      console.log("🍎 Created Session ID:", createdSessionId);

      if (!createdSessionId) {
        console.log("❌ No Apple session ID was created");
        return;
      }

      if (!setActive) {
        console.log("❌ Apple setActive function is undefined");
        return;
      }

      await setActive({ session: createdSessionId });
      console.log("✅ Apple session activated successfully!");
      router.replace('/setup');
      
    } catch (err) {
      console.error('❌ OAuth Apple error:', err);
      if (err instanceof Error) {
        console.error('❌ Apple Error message:', err.message);
        console.error('❌ Apple Error stack:', err.stack);
      }
    }
  }, [startAppleOAuthFlow]);

  const onGithubPress = useCallback(async () => {
    try {
      console.log("⚫ Starting GitHub OAuth flow...");
      console.log("⚫ Redirect URL:", Linking.createURL('/setup', { scheme: 'myapp' }));
      
      const oauthResponse = await startGithubOAuthFlow({
        redirectUrl: Linking.createURL('/setup', { scheme: 'myapp' }),
      });

      console.log("⚫ Full GitHub OAuth Response:", JSON.stringify(oauthResponse, null, 2));

      if (!oauthResponse) {
        console.log("❌ GitHub OAuth response is null");
        return;
      }

      const { createdSessionId, setActive } = oauthResponse;

      if (!createdSessionId) {
        console.log("❌ No GitHub session ID was created");
        return;
      }

      if (!setActive) {
        console.log("❌ GitHub setActive function is undefined");
        return;
      }

      await setActive({ session: createdSessionId });
      router.replace('/setup');
      console.log("✅ GitHub session activated successfully!");
      
    } catch (err) {
      console.error('❌ OAuth GitHub error:', err);
      if (err instanceof Error) {
        console.error('❌ GitHub Error message:', err.message);
        console.error('❌ GitHub Error stack:', err.stack);
      }
    }
  }, [startGithubOAuthFlow]);

  const onEmailSignInPress = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      
      // Create sign-in attempt
      const signInAttempt = await signIn.create({
        identifier: email,
        password: password,
      });

      // Check the status
      if (signInAttempt.status === "complete") {
        // Set the active session
        await setSignInActive({ session: signInAttempt.createdSessionId });
        router.replace('/setup');
      } else if (signInAttempt.status === "needs_identifier") {
        Alert.alert("Error", "Please enter a valid email");
      } else if (signInAttempt.status === "needs_first_factor") {
        Alert.alert("Error", "Please enter your password");
      } else {
        Alert.alert("Error", "Sign in failed. Please try again.");
        console.log("Sign in status:", signInAttempt.status);
      }
    } catch (err: any) {
      console.error("Sign in error:", err.message);
      Alert.alert(
        "Error",
        err.errors?.[0]?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const onEmailSignUpPress = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!validatePasswords()) {
      return;
    }

    try {
      setLoading(true);
      
      const signUpAttempt = await signUp.create({
        emailAddress: email,
        password: password,
      });

      if (signUpAttempt.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        router.replace('/verify-email');
      } else if (signUpAttempt.status === "complete") {
        await setSignUpActive({ session: signUpAttempt.createdSessionId });
        router.replace('/setup');
      } else {
        console.log("Sign up status:", signUpAttempt.status);
        Alert.alert("Error", "Sign up failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Sign up error:", err.message);
      Alert.alert(
        "Error",
        err.errors?.[0]?.message || "Could not create account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.image}
        />

        <View style={styles.infoBox}>
          <Text style={styles.title}>{isLogin ? "Welcome Back!" : "Create Account"}</Text>
          <Text style={styles.subtitle}>
            {isLogin ? "Sign in to continue" : "Sign up to get started"}
          </Text>

          {/* Email/Password Form */}
          <View style={styles.form}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {!isLogin && (
              <>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, passwordError ? styles.inputError : null]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
              </>
            )}
            
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={isLogin ? onEmailSignInPress : onEmailSignUpPress}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setIsLogin(!isLogin);
                setPasswordError('');
                setPassword('');
                setConfirmPassword('');
              }}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isLogin ? "New user? Create account" : "Already have an account? Sign in"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Logins */}
          <View style={styles.socialButtons}>
            <Pressable onPress={onGooglePress} style={styles.getStartedButton}>
              <View style={styles.buttonContent}>
                <FontAwesome name="google" size={24} color="white" style={styles.icon} />
                <Text style={styles.buttonText}>Google</Text>
              </View>
            </Pressable>

            <Pressable onPress={onApplePress} style={[styles.getStartedButton, styles.appleButton]}>
              <View style={styles.buttonContent}>
                <Ionicons name="logo-apple" size={24} color="white" style={styles.icon} />
                <Text style={styles.buttonText}>Apple</Text>
              </View>
            </Pressable>

            <Pressable onPress={onGithubPress} style={[styles.getStartedButton, styles.githubButton]}>
              <View style={styles.buttonContent}>
                <FontAwesome name="github" size={24} color="white" style={styles.icon} />
                <Text style={styles.buttonText}>GitHub</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  image: {
    width: width * 0.8,
    height: width * 0.4,
    alignSelf: 'center',
    resizeMode: 'contain',
    marginBottom: 5,
    marginTop:10,

  },
  infoBox: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: THEME.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: THEME.error,
  },
  errorText: {
    color: THEME.error,
    fontSize: 12,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: THEME.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    padding: 10,
    alignItems: 'center',
  },
  switchText: {
    color: THEME.primary,
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  getStartedButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    width: width * 0.3,
    alignItems: 'center',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 15,
    borderRadius: 10,
    backgroundColor: THEME.secondary,
  },
  appleButton: {
    backgroundColor: "#000000",
  },
  githubButton: {
    backgroundColor: "#333",
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
});