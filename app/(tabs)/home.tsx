import { View, Text, Button } from 'react-native'
import React from 'react'
import { SignedOut, useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';

const home = () => {

    const { signOut } = useAuth();
    const {user} = useUser();

    const handleLogout = async () => {
        console.log("logged out");
      try {
        await signOut();
        alert("You have been logged out!");
        
      } catch (error) {
        console.error("Error logging out: ", error);
      }
    };

  return (
    <View style={{marginTop:"10%"}}>
        <Text>  Hello {user?.emailAddresses[0].emailAddress}</Text>
  
      <Button title='loGOUT'  onPress={handleLogout}  />

      <SignedOut>
      <Redirect href={"/login"}/>
       </SignedOut>

    </View>

  )
}

export default home