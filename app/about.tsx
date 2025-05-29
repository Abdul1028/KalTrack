import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const APP_VERSION = '1.0.0';

const About = () => {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About KalTrack</Text>
      </LinearGradient>
      <LinearGradient colors={["#fff5f5", "#fff"]} style={styles.gradientContent}>
        <View style={styles.card}>
          <View style={styles.logoCardShadow}>
            <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.appName}>KalTrack</Text>
          <Text style={styles.tagline}>"Track. Improve. Thrive."</Text>
          <Text style={styles.version}>Version {APP_VERSION}</Text>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>What is KalTrack?</Text>
          </View>
          <Text style={styles.sectionText}>
            KalTrack is your all-in-one health and nutrition companion. Effortlessly track your meals, workouts, water intake, and more. Our mission is to empower you to achieve your wellness goals with smart insights and a beautiful, easy-to-use interface.
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="people-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Our Team</Text>
          </View>
          <Text style={styles.sectionText}>
            Built with <Text style={{color:'#FF6B6B'}}>❤️</Text> by the KalTrack team.
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="mail-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Contact & Credits</Text>
          </View>
          <Text style={styles.sectionText}>
            For feedback, support, or partnership inquiries, email us at
            <Text style={styles.email}> support@kaltrack.com</Text>
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="star-outline" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Features</Text>
          </View>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#FF8E53" style={styles.featureIcon} />
              <Text style={styles.featureText}>Track meals, calories, and macros</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#FF8E53" style={styles.featureIcon} />
              <Text style={styles.featureText}>Log workouts and daily activity</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#FF8E53" style={styles.featureIcon} />
              <Text style={styles.featureText}>Water intake reminders</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#FF8E53" style={styles.featureIcon} />
              <Text style={styles.featureText}>Barcode food scanner</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#FF8E53" style={styles.featureIcon} />
              <Text style={styles.featureText}>HealthKit integration (iOS)</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#FF8E53" style={styles.featureIcon} />
              <Text style={styles.featureText}>Personalized insights & analytics</Text>
            </View>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="target" size={20} color="#FF6B6B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Our Mission</Text>
          </View>
          <Text style={styles.sectionText}>
            To make healthy living simple, enjoyable, and accessible for everyone. We believe in empowering you with the tools and knowledge to reach your wellness goals—one step at a time.
          </Text>
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
    marginTop:20
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
  logoCardShadow: {
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FF6B6B',
    marginBottom: 2,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#FF8E53',
    fontWeight: '600',
    marginBottom: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  version: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
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
  email: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  featuresList: {
    marginTop: 4,
    marginBottom: 2,
    paddingLeft: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 15,
    color: '#444',
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

export default About; 