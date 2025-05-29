import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const PRIVACY_URL = 'https://abdul1028.github.io/KalTrack-MetaData/';

const Privacy = () => {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </LinearGradient>
      <LinearGradient colors={["#fff5f5", "#fff"]} style={styles.gradientContent}>
        <View style={styles.card}>
          <MaterialCommunityIcons name="shield-lock-outline" size={40} color="#FF6B6B" style={{marginBottom: 8}} />
          <Text style={styles.cardTitle}>Your Privacy Matters</Text>
          <Text style={styles.cardText}>KalTrack is committed to protecting your privacy. This page explains how we collect, use, and safeguard your information.</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>What Data We Collect</Text>
          </View>
          <Text style={styles.sectionText}>
            • Personal info (name, email, profile photo)
            {"\n"}• Health data (steps, weight, height, calories, etc.)
            {"\n"}• App usage data (features used, preferences)
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="database-lock-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>How We Use Your Data</Text>
          </View>
          <Text style={styles.sectionText}>
            • To personalize your experience and provide insights
            {"\n"}• To improve app features and user support
            {"\n"}• To send reminders and notifications (if enabled)
            {"\n"}• To monitor and improve service quality
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="key-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Your Rights</Text>
          </View>
          <Text style={styles.sectionText}>
            • Access, update, or delete your data anytime
            {"\n"}• Control notification and data sharing settings
            {"\n"}• Contact us for any privacy concerns
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="web" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Full Privacy Policy</Text>
          </View>
          <Text style={styles.sectionText}>
            For full details, please read our complete privacy policy online.
          </Text>
          <TouchableOpacity style={styles.privacyButton} onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Ionicons name="open-outline" size={18} color="#fff" style={{marginRight: 6}} />
            <Text style={styles.privacyButtonText}>View Full Privacy Policy</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="mail-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Contact Us</Text>
          </View>
          <Text style={styles.sectionText}>
            For questions or requests, email us at <Text style={styles.email}>rasoolas2003@gmail.com</Text>
          </Text>
        </View>
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
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 10,
    alignSelf: 'flex-start',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  privacyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  email: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
});

export default Privacy; 