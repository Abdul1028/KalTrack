import { View, Text } from 'react-native'
import React from 'react'
import { Stack, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import iconSet from '@expo/vector-icons/build/Fontisto'

const _layout = () => {
  return (
   <Tabs>
     <Tabs.Screen
        name="statistics"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        }}
      />

      <Tabs.Screen  
        name="workouts"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" size={size} color={color} />
          ),
          tabBarLabel: 'Workouts',
          tabBarActiveTintColor: '#FF6B6B',
          tabBarInactiveTintColor: '#95A5A6',
        }}
      />
      
        <Tabs.Screen
        name="meal-planner"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Meal Plan',
          tabBarActiveTintColor: '#FF6B6B',
          tabBarInactiveTintColor: '#95A5A6',
        }}
      />

      

<Tabs.Screen
        name="account"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        }}
      />
   </Tabs>



  )
}

export default _layout