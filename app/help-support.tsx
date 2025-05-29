import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, TextInput, Alert, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const HelpSupport = () => {
  const router = useRouter();
  const [feedback, setFeedback] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleSendEmail = () => {
    Linking.openURL('mailto:rasoolas2003@gmail.com?subject=Support%20Request');
  };

  const handleFeedbackSubmit = () => {
    if (!feedback.trim()) {
      Alert.alert('Feedback Required', 'Please enter your feedback.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setFeedback('');
      Alert.alert('Thank you!', 'Your feedback has been submitted.');
    }, 1200);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </LinearGradient>
      <LinearGradient colors={["#fff5f5", "#fff"]} style={styles.gradientContent}>
        <View style={styles.card}>
          <MaterialCommunityIcons name="lifebuoy" size={40} color="#FF6B6B" style={{marginBottom: 8}} />
          <Text style={styles.cardTitle}>We're here to help!</Text>
          <Text style={styles.cardText}>Find answers, get support, and let us know how we can make KalTrack better for you.</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="comment-question-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>
          <View style={styles.faqItem}><Text style={styles.faqQ}>Q: How do I reset my password?</Text><Text style={styles.faqA}>A: Go to Account &gt; Edit Profile &gt; Change Password.</Text></View>
          <View style={styles.faqItem}><Text style={styles.faqQ}>Q: How can I contact support?</Text><Text style={styles.faqA}>A: Use the email or chat options below.</Text></View>
          <View style={styles.faqItem}><Text style={styles.faqQ}>Q: How do I track my meals?</Text><Text style={styles.faqA}>A: Use the Home or Meal Planner tabs to log your meals and view nutrition info.</Text></View>
          <View style={styles.faqItem}><Text style={styles.faqQ}>Q: How do I connect HealthKit?</Text><Text style={styles.faqA}>A: Go to Account &gt; Connect HealthKit (iOS only).</Text></View>
          <View style={styles.faqItem}><Text style={styles.faqQ}>Q: How do I set water reminders?</Text><Text style={styles.faqA}>A: Enable Water Reminder in Account settings and set your preferred interval.</Text></View>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="help-circle-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>How to Get Help</Text>
          </View>
          <Text style={styles.sectionText}>You can reach us anytime via email or send us feedback directly from the app. For urgent issues, email is the fastest way to get a response.</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactButton} onPress={handleSendEmail}>
              <Ionicons name="mail-outline" size={22} color="#FF6B6B" />
              <Text style={styles.contactText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={() => Alert.alert('Chat Coming Soon', 'Live chat support will be available soon!')}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FF6B6B" />
              <Text style={styles.contactText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Tips for Fast Support</Text>
          </View>
          <Text style={styles.sectionText}>
            - Check the FAQ above for instant answers.{"\n"}
            - When emailing, include your account email and a detailed description of your issue.{"\n"}
            - Screenshots help us resolve your issue faster!
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="chatbox-ellipses-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Send Feedback</Text>
          </View>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Let us know how we can improve..."
            placeholderTextColor="#aaa"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleFeedbackSubmit} disabled={submitting}>
            <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        {/* <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="share-social-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Follow Us</Text>
          </View>
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialIcon} onPress={() => {}}>
              <Ionicons name="logo-instagram" size={24} color="#FF6B6B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon} onPress={() => {}}>
              <Ionicons name="logo-twitter" size={24} color="#FF6B6B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon} onPress={() => {}}>
              <Ionicons name="logo-facebook" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View> */}
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 60 : 30,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 40,
  },
  gradientContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 30,
    minHeight: 600,
    marginTop: 20,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    marginTop: 10,
    marginHorizontal: 24,
    paddingVertical: 28,
    paddingHorizontal: 18,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginBottom: 2,
  },
  section: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  sectionText: {
    color: '#444',
    fontSize: 15,
    marginBottom: 2,
    lineHeight: 22,
    textAlign: 'left',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFE5E5',
    marginHorizontal: 24,
    marginVertical: 10,
    borderRadius: 1,
  },
  faqItem: {
    marginBottom: 14,
  },
  faqQ: {
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 2,
  },
  faqA: {
    color: '#444',
    marginLeft: 8,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 18,
    marginTop: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 10,
  },
  contactText: {
    marginLeft: 8,
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 15,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#FF6B6B55',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    marginBottom: 12,
    color: '#333',
    fontSize: 15,
    backgroundColor: '#FFF8F8',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 18,
  },
  socialIcon: {
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    padding: 8,
    marginRight: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default HelpSupport; 