import {View,Text,StyleSheet,Image,TextInput,Pressable,Alert,ActivityIndicator,} from 'react-native';
import { useState } from 'react';
import { router, Link } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing Information',
        'Please enter your email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      // Supabase Authentication
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password,
        });

      if (error) {
        Alert.alert('Login Failed', error.message);
        return;
      }

      if (!data.user) {
        Alert.alert(
          'Login Failed',
          'Unable to retrieve user account.'
        );
        return;
      }

      // Fetch user role from profiles
      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        Alert.alert(
          'Profile Not Found',
          'Your account profile could not be found. Please contact the administrator.'
        );
        return;
      }

      const adminEmail = 'adminaccount67@gmail.com';
      const loggedInEmail = data.user.email?.toLowerCase();

      // ADMIN ACCOUNT
      if (
        loggedInEmail === adminEmail &&
        profile.role === 'admin'
      ) {
        router.replace('/admin-dashboard');
        return;
      }

      // Prevent admin email from using student access
      if (loggedInEmail === adminEmail) {
        await supabase.auth.signOut();

        Alert.alert(
          'Access Denied',
          'This account is not configured as an administrator.'
        );
        return;
      }

      // STUDENT ACCOUNT
      if (profile.role === 'student') {
        Alert.alert(
          'Login Successful',
          'Welcome back!',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/home'),
            },
          ]
        );
        return;
      }

      // Invalid role
      await supabase.auth.signOut();

      Alert.alert(
        'Access Denied',
        'Your account does not have a valid role.'
      );

    } catch (error) {
      console.log('Login Error:', error);

      Alert.alert(
        'Error',
        'Something went wrong. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={loginStyle.container}>

      {/* Navbar Back */}
      <View style={loginStyle.navbar}>
        <Pressable onPress={() => router.back()}>
          <Image
            source={require('../../../assets/signup/arrow-2.png')}
            style={{ width: 40, height: 40 }}
          />
        </Pressable>
      </View>

      <View style={loginStyle.hero}>

        <Image
          source={require('../../../assets/signup/kapi1.png')}
          style={{ width: 200, height: 200 }}
        />

        <Text style={loginStyle.loginText}>
          Welcome Back
        </Text>

        <Text>Login to continue your journey.</Text>

        {/* Input Fields */}
        <View style={loginStyle.allInput}>
          <TextInput
            style={loginStyle.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Enter your username or email"
          />

          <TextInput
            style={loginStyle.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
          />
        </View>

        {/* Remember Me and Forgot Password */}
        <View style={loginStyle.rememberContainer}>

          <Pressable
            style={loginStyle.checkbox}
            onPress={() => setRememberMe(!rememberMe)}
          >
            {rememberMe && (
              <Text style={loginStyle.checkmark}>✓</Text>
            )}
          </Pressable>

          <Text style={loginStyle.rememberMeText}>
            Remember Me
          </Text>

          <Pressable>
            <Text style={{ color: '#3ab862' }}>
              Forgot password?
            </Text>
          </Pressable>

        </View>

        {/* Login Button */}
        <View>
          <Pressable
            onPress={handleLogin}
            style={[
              loginStyle.loginButton,
              loading && { opacity: 0.7 },
            ]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={loginStyle.loginButtonText}>
                Log in
              </Text>
            )}
          </Pressable>
        </View>

        {/* OR */}
        <View style={{ marginTop: 20 }}>
          <Text>OR</Text>
        </View>

        {/* Continue with ESCR ID */}
        <View>
          <Pressable>
            <Text style={loginStyle.Continue}>
              Continue with ESCR ID
            </Text>
          </Pressable>
        </View>

        {/* Sign Up */}
        <View style={loginStyle.dontHave}>
          <Text>Don't have an account? </Text>

          <Link
            href="/users/signup"
            style={{ color: '#3ab862', fontWeight: '700' }}
          >
            Sign up
          </Link>
          
        </View>

      </View>
    </View>
  );
}

const loginStyle = StyleSheet.create({
  container: {
    flex: 1,
  },

  navbar: {
    marginVertical: 60,
    marginHorizontal: 30,
  },

  hero: {
    flex: 1,
    marginVertical: -75,
    alignItems: 'center',
  },

  loginText: {
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

  rememberContainer: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
    marginTop: 20,
    width: 290,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#3ab862',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkmark: {
    color: '#3ab862',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },

  rememberMeText: {
    flex: 1,
  },

  loginButton: {
    backgroundColor: '#3ab862',
    paddingHorizontal: 110,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 15,
  },

  loginButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  Continue: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 60,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#bebebe',
    paddingVertical: 12,
    borderRadius: 15,
    textAlign: 'left',
    color: '#8f8f8f',
  },

  dontHave: {
    flexDirection: 'row',
    marginTop: 30,
  },
});
