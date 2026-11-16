import {View,Text,Image,Pressable,StyleSheet,ScrollView,ActivityIndicator,Alert,} from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        usersResult,
        notesResult,
        groupsResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),

        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true }),

        supabase
          .from('study_groups')
          .select('id', { count: 'exact', head: true }),
      ]);

      if (usersResult.error) throw usersResult.error;
      if (notesResult.error) throw notesResult.error;
      if (groupsResult.error) throw groupsResult.error;

      setTotalUsers(usersResult.count ?? 0);
      setTotalNotes(notesResult.count ?? 0);
      setTotalGroups(groupsResult.count ?? 0);

    } catch (error) {
      console.log('Dashboard Error:', error);

      Alert.alert(
        'Error',
        'Unable to load dashboard data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* NAVBAR */}
        <View style={styles.navbar}>

          <Pressable onPress={() => router.replace('/AdminSidebar')}>
            <Image
              source={require('../../assets/admin-icons/menu.png')}
              style={{ width: 35, height: 35 }}
            />
          </Pressable>

          <Text style={styles.logoText}>
            Study First
          </Text>

          <Pressable onPress={fetchDashboardData}>
            <Text style={styles.refreshText}>
              Refresh
            </Text>
          </Pressable>

        </View>

        {/* WELCOME SECTION */}
        <View style={styles.textContainer}>

          <Text>Welcome Back</Text>

          <Text style={styles.adminText}>
            Admin
          </Text>

          <Text style={styles.welcomeDescription}>
            Here's what's happening today.
          </Text>

        </View>

        {/* DASHBOARD CARDS */}
        <View style={styles.containerBox}>

          {/* TOTAL USERS */}
          <View style={styles.box}>

            <Image
              source={require('../../assets/admin-icons/totalUsers.png')}
              style={styles.iconsSize}
            />

            <View style={{ marginTop: 10 }}>

              <Text style={styles.cardTitle}>
                Total Users
              </Text>

              {loading ? (
                <ActivityIndicator color="#3ab862" />
              ) : (
                <Text style={styles.number}>
                  {totalUsers}
                </Text>
              )}

              <Text style={styles.description}>
                Registered Users
              </Text>

            </View>
          </View>

          {/* TOTAL NOTES */}
          <View style={styles.box}>

            <Image
              source={require('../../assets/admin-icons/notess.png')}
              style={styles.iconsSize}
            />

            <View style={{ marginTop: 10 }}>

              <Text style={styles.cardTitle}>
                Total Notes
              </Text>

              {loading ? (
                <ActivityIndicator color="#3ab862" />
              ) : (
                <Text style={styles.number}>
                  {totalNotes}
                </Text>
              )}

              <Text style={styles.description}>
                Shared Notes
              </Text>

            </View>
          </View>

          {/* TOTAL GROUPS */}
          <View style={styles.box}>

            <Image
              source={require('../../assets/admin-icons/totalGroups.png')}
              style={styles.iconsSize}
            />

            <View style={{ marginTop: 10 }}>

              <Text style={styles.cardTitle}>
                Total Groups
              </Text>

              {loading ? (
                <ActivityIndicator color="#3ab862" />
              ) : (
                <Text style={styles.number}>
                  {totalGroups}
                </Text>
              )}

              <Text style={styles.description}>
                Created Study Groups
              </Text>

            </View>
          </View>

          {/* TOTAL MESSAGES - PLACEHOLDER */}
          <View style={styles.box}>

            <Image
              source={require('../../assets/admin-icons/totalNotes.png')}
              style={styles.iconsSize}
            />

            <View style={{ marginTop: 10 }}>

              <Text style={styles.cardTitle}>
                Total Messages
              </Text>

              <Text style={styles.number}>
                0
              </Text>

              <Text style={styles.description}>
                Coming Soon
              </Text>

            </View>
          </View>

        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  navbar: {
    flexDirection: 'row',
    margin: 20,
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logoText: {
    fontSize: 22,
    color: '#3ab862',
    fontWeight: '600',
  },

  refreshText: {
    color: '#3ab862',
    fontWeight: 'bold',
  },

  // WELCOME SECTION
  textContainer: {
    marginTop: 30,
    marginLeft: 20,
  },

  adminText: {
    fontSize: 30,
    fontWeight: '500',
  },

  welcomeDescription: {
    color: '#888',
  },

  // DASHBOARD CONTAINER
  containerBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 30,
    gap: 15,
    flexWrap: 'wrap',
  },

  // DASHBOARD BOX
  box: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#cfcfcf',
    width: 170,
    padding: 10,
    borderRadius: 15,
    height: 150,
  },

  // ICONS
  iconsSize: {
    width: 50,
    height: 50,
  },

  cardTitle: {
    fontWeight: '500',
  },

  number: {
    color: '#3ab862',
    fontWeight: '600',
    fontSize: 20,
  },

  description: {
    color: '#888',
    textAlign: 'center',
    fontSize: 11,
  },

});
