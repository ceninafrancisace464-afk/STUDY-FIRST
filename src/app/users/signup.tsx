import {View,Text,Pressable,Image,StyleSheet,TextInput,Alert,ActivityIndicator,ScrollView,} from 'react-native';
import { router, Link } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !password ||
      !studentNumber.trim()
    ) {
      Alert.alert(
        'Missing Information',
        'Please fill in all fields.'
      );
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return;
    }

    // Student Number validation
    const trimmedStudentNumber = studentNumber
      .trim()
      .toUpperCase();

    const allowedCourses = ['IT', 'CS', 'ED', 'OA'];

    const studentCourse = trimmedStudentNumber.split('-')[0];

    if (!allowedCourses.includes(studentCourse)) {
      Alert.alert(
        'Invalid Student Number',
        'Student Number must start with IT, CS, ED, or OA.'
      );
      return;
    }

    // Format: IT-123, CS-123, ED-123, OA-123
    if (!/^(IT|CS|ED|OA)-[A-Za-z0-9]+$/.test(trimmedStudentNumber)) {
      Alert.alert(
        'Invalid Student Number',
        'Use this format: IT-123, CS-123, ED-123, or OA-123.'
      );
      return;
    }

    // Password validation
    if (password.length < 6) {
      Alert.alert(
        'Invalid Password',
        'Password must be at least 6 characters.'
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            student_number: trimmedStudentNumber,
            phone_number: phoneNumber.trim(),
          },
        },
      });

      if (error) {
        Alert.alert('Signup Failed', error.message);
        return;
      }

      if (data.user) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created! Please check your email and click the confirmation link before logging in.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/users/login'),
            },
          ]
        );
      }
    } catch (error: unknown) {
      console.log('Signup error:', error);

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={signupStyle.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Navbar Back */}
      <View style={signupStyle.navbar}>
        <Pressable onPress={() => router.back()}>
          <Image
            source={require('../../../assets/signup/arrow-2.png')}
            style={{ width: 40, height: 40 }}
          />
        </Pressable>
      </View>

      {/* Hero */}
      <View style={signupStyle.hero}>
        <Image
          source={require('../../../assets/signup/kapi1.png')}
          style={{ width: 200, height: 200 }}
        />

        <Text style={signupStyle.createText}>
          Create Account
        </Text>

        <Text>
          Join our community and start studying together
        </Text>

        {/* Text Inputs */}
        <View style={signupStyle.allInput}>
          <TextInput
            style={signupStyle.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
            autoCapitalize="words"
          />

          <TextInput
            style={signupStyle.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={signupStyle.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Phone Number"
            keyboardType="phone-pad"
          />

          <TextInput
            style={signupStyle.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />

          <TextInput
            style={signupStyle.input}
            value={studentNumber}
            onChangeText={setStudentNumber}
            placeholder="Student Number (IT-123)"
            autoCapitalize="characters"
          />
        </View>

        {/* Signup Button */}
        <Pressable
          style={[
            signupStyle.signupButton,
            loading && { opacity: 0.6 },
          ]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={signupStyle.signupButtonText}>
              Sign Up
            </Text>
          )}
        </Pressable>

        {/* Already have an account */}
        <View style={signupStyle.already}>
          <Text>Already have an account? </Text>

          <Link
            href="/users/login"
            style={{
              color: '#3ab862',
              fontWeight: '700',
            }}
          >
            Login
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

// SIGNUP STYLES
const signupStyle = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  navbar: {
    marginVertical: 60,
    marginHorizontal: 30,
  },

  hero: {
    flex: 1,
    marginTop: -75,
    alignItems: 'center',
    paddingBottom: 30,
  },

  createText: {
    fontSize: 35,
    fontWeight: '700',
    color: '#3ab862',
  },

  allInput: {
    gap: 12,
    marginTop: 20,
  },

  input: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    width: 290,
    borderRadius: 10,
    padding: 13,
  },

  signupButton: {
    backgroundColor: '#3ab862',
    width: 290,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  signupButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },

  already: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
