import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions 
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const THEME = {
  primary: '#FF8C00',
  background: '#FFFFFF',
  text: '#333333',
  error: '#FF3B30',
  inputBorder: '#E0E0E0',
};

export default function VerifyEmail() {
  const { signUp, setActive } = useSignUp();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRefs = useRef<TextInput[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    if (!/^\d*$/.test(text)) return;
    
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Move to next input if there's a value
    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onPressVerify = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      Alert.alert("Error", "Please enter complete verification code");
      return;
    }

    try {
      setLoading(true);
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/setup');
      } else {
        Alert.alert("Error", "Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      Alert.alert("Error", err.errors?.[0]?.message || "Could not verify email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail" size={width * 0.1} color={THEME.primary} />
          </View>
        </View>

        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to your email
        </Text>

        <View style={styles.otpContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputRefs.current[index] = ref as TextInput}
              style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              placeholder="0"
              placeholderTextColor="#CCC"
              returnKeyLabel='done'
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.verifyButton, loading && styles.buttonDisabled]}
          onPress={onPressVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Verifying..." : "Verify Email"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton}>
          <Text style={styles.resendText}>Didn't receive code? </Text>
          <Text style={styles.resendActionText}>Resend</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  iconCircle: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    backgroundColor: '#FFF8EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: THEME.text,
    textAlign: 'center',
    marginBottom: height * 0.01,
  },
  subtitle: {
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.04,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.04,
    gap: width * 0.01,
  },
  otpInput: {
    width: width * 0.13,
    height: width * 0.13,
    borderWidth: 2,
    borderColor: THEME.inputBorder,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: width * 0.06,
    fontWeight: '600',
    backgroundColor: THEME.background,
  },
  otpInputFilled: {
    borderColor: THEME.primary,
    backgroundColor: '#FFF8EF',
  },
  verifyButton: {
    backgroundColor: THEME.primary,
    padding: height * 0.02,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: THEME.background,
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  resendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: height * 0.01,
  },
  resendText: {
    color: '#666',
    fontSize: width * 0.035,
  },
  resendActionText: {
    color: THEME.primary,
    fontSize: width * 0.035,
    fontWeight: '600',
  },
}); 