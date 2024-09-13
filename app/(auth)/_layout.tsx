import { Redirect, Stack } from 'expo-router'
import { SignedOut, useAuth } from '@clerk/clerk-expo'

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) {
    return <Redirect href={'/home'} />
  }

  if(!isSignedIn){
    return <Redirect href={"/(auth)/sign-in"} />
  }

  return <Stack />
}