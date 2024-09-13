import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SignedIn, SignedOut } from '@clerk/clerk-expo'
import login from './login'
import { Redirect } from 'expo-router'
const index = () => {
  return (
    <>
    <Redirect href={"/login"}></Redirect>           
    </>
  )
}

export default index

const styles = StyleSheet.create({})