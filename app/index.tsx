import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React, { useRef, useState } from 'react'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import login from './login'
import { Redirect, router } from 'expo-router'
import Swiper from 'react-native-swiper'

import CustomButton from "./components/CustomButton"
import { onboarding } from "./constants";

import Setup from './setup'
import { scheduleNotificationWithActions } from './nutritionval'

const index = () => {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const {user} = useUser();

  const isLastSlide = activeIndex === onboarding.length - 1;
  if(!user){
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => {
          router.navigate("/login");
        }}
        style={styles.skipButtonContainer}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      <Swiper
        ref={swiperRef}
        loop={false}
        dot={<View style={styles.swiperDot} />}
        activeDot={<View style={styles.swiperActiveDot} />}
        onIndexChanged={(index) => setActiveIndex(index)}
      >
        {onboarding.map((item) => (
          <View key={item.id} style={styles.slideContainer}>
            <Image
              source={item.image}
              style={styles.image}
            />

            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                {item.title}
              </Text>
            </View>
            <Text style={styles.description}>
              {item.description}
            </Text>
          </View>
        ))}
      </Swiper>

      <CustomButton
        title={isLastSlide ? "Get Started" : "Next"}
        onPress={() =>
          isLastSlide
            ? router.navigate("/login")
            : swiperRef.current?.scrollBy(1)
        }
        style={styles.button}
      />
    </SafeAreaView>
  )
}
else{
  return <Setup/>
}

}
export default index
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButtonContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 20,
  },
  skipButtonText: {
    color: 'orange',
    fontSize: 16,
    fontFamily: 'JakartaBold',
  },
  swiperDot: {
    width: 32,
    height: 4,
    marginHorizontal: 4,
    backgroundColor: 'black',
    borderRadius: 2,
  },
  swiperActiveDot: {
    width: 32,
    height: 4,
    marginHorizontal: 4,
    backgroundColor: 'orange',
    borderRadius: 2,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  title: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  description: {
    fontSize: 14,
    fontFamily: 'JakartaSemiBold',
    textAlign: 'center',
    color: '#858585',
    marginHorizontal: 20,
    marginTop: 10,
  },
  button: {
    color: "orange",
    width: '91%',
    marginTop: 20,
    marginBottom: 10,
  },
});
