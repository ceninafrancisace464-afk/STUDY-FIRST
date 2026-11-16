import React, { useState } from 'react';
import {View,Text,Image,TextInput,Pressable,StyleSheet,Alert,ActivityIndicator,} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function EditProfile() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        'Invalid Password',
        'New password must be at least 6 characters.'
      );
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        'Same Password',
        'Your new password must be different from your current password.'
      );
      return;
    }

    try {
      setIsLoading(true);

      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || !user.email) {
        throw new Error('Unable to get your account information.');
      }

      // Verify current password
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (loginError) {
        throw new Error('Your current password is incorrect.');
      }

      // Update password
      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw updateError;
      }

      setCurrentPassword('');
      setNewPassword('');

      Alert.alert(
        'Success!',
        'Your password has been changed successfully.'
      );

    } catch (error: any) {
      console.log('CHANGE PASSWORD ERROR:', error);

      Alert.alert(
        'Failed',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.replace('/profile')}>
          <Image
            source={require('../../assets/signup/arrow-2.png')}
            style={{ width: 40, height: 40 }}
          />
        </Pressable>

        <Text style={styles.navbarTitle}>
          Password / Delete
        </Text>
      </View>

      {/* PASSWORD CONTAINER */}
      <View style={styles.passwordContainer}>

        <Text style={styles.sectionTitle}>
          Change Password
        </Text>

        <View>
          <TextInput
            style={styles.textInputStyle}
            placeholder="Current Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.textInputStyle}
            placeholder="New Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
          />
        </View>

        {/* CONFIRM BUTTON */}
        <Pressable
          style={[
            styles.confirmButton,
            isLoading && { opacity: 0.6 },
          ]}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              Confirm
            </Text>
          )}
        </Pressable>

        {/* DELETE ACCOUNT */}
        <View>
          <Pressable style={styles.deleteButton}>
            <Text style={styles.buttonText}>
              Delete Account
            </Text>
          </Pressable>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  navbar: {
    marginTop: 60,
    marginHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },

  navbarTitle: {
    fontSize: 20,
    fontWeight: '600',
  },

  passwordContainer: {
    margin: 20,
  },

  sectionTitle: {
    fontSize: 23,
  },

  textInputStyle: {
    backgroundColor: '#FFFFFF',
    height: 60,
    borderRadius: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#888',
    paddingHorizontal: 15,
    color: '#222',
  },

  confirmButton: {
    backgroundColor: '#D62828',
    paddingHorizontal: 30,
    paddingVertical: 15,
    marginTop: 20,
    borderRadius: 10,
  },

  deleteButton: {
    backgroundColor: '#813333',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
  },
});
