import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
const _layout = () => {
  return (
   <Tabs>
    <Tabs.Screen name='statistics' options={{headerShown:false }}/>
    <Tabs.Screen name='home' options={{headerShown:false }} />
    <Tabs.Screen name='account' options={{headerShown:false }} />
    
   </Tabs>
  )
}

export default _layout