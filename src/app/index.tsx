
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding/onboarding1');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.textLogo}>STUDY FIRST</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3ab862',
  },
  textLogo: {
    color: 'white',
    fontSize: 26,
    fontWeight: '900',
  },
});
