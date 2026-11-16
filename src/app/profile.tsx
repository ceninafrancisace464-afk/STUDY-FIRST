import {View,Text,Image,Pressable,StyleSheet,} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCallback } from 'react';

export default function MyProfile() {
  const [fullname, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [sharedNotesCount, setSharedNotesCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);

  const fetchFriendsCount = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const { count, error } = await supabase
    .from('friends')
    .select('*', { count: 'exact', head: true })
    .or(`user_one.eq.${user.id},user_two.eq.${user.id}`);

  if (error) {
    console.log('Friends count error:', error.message);
    return;
  }

  setFriendsCount(count ?? 0);
};

  useFocusEffect(
  useCallback(() => {
    fetchFriendsCount();

    const getProfile = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) return;

        // GET FULL NAME
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.log('PROFILE ERROR:', profileError.message);
          return;
        }

        setFullName(data.full_name || '');

        // GET EMAIL USERNAME
        const emailUsername = user.email?.split('@')[0] || '';
        setUsername(`@${emailUsername}`);

        // GET SHARED NOTES COUNT
        const { count, error: countError } = await supabase
          .from('posts')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('user_id', user.id);

        if (countError) {
          console.log('SHARED NOTES ERROR:', countError.message);
          return;
        }

        setSharedNotesCount(count ?? 0);

      } catch (error: any) {
        console.log('GET PROFILE ERROR:', error.message);
      }
    };

    getProfile();
  }, [])
);

  // GET FIRST LETTER OF LOGGED-IN USER
  const profileInitial = fullname.trim().charAt(0).toUpperCase() || 'S';

  return (
    <View style={profileStyle.container}>

      {/* Navbar Back */}
      <View style={profileStyle.navbar}>
        <Pressable onPress={() => router.replace('/home')}>
          <Image
            source={require('../../assets/signup/arrow-2.png')}
            style={{ width: 40, height: 40 }}
          />
        </Pressable>
      </View>

      {/* Section Profile */}
      <View style={profileStyle.profileNav}>

        {/* Profile Initial */}
        <View style={profileStyle.profileAvatar}>
          <Text style={profileStyle.profileInitial}>
            {profileInitial}
          </Text>
        </View>

        <View>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
            {fullname || 'Student'}
          </Text>

          <Text>{username}</Text>

          <View style={profileStyle.onlineBadge}>
            <Text style={profileStyle.onlineText}>
              Online
            </Text>
          </View>
        </View>

      </View>

      {/* Profile List */}
      <View style={profileStyle.profileList}>

        {/* Friends */}
        <View style={profileStyle.listItem}>
          <Text style={{ fontWeight: 'bold' }}>{friendsCount}</Text>
          <Text>Friends</Text>
        </View>

        {/* Study Group */}
        <View style={profileStyle.listItem}>
          <Text style={{ fontWeight: 'bold' }}>0</Text>
          <Text>Study Group</Text>
        </View>

        {/* Shared Notes */}
        <View style={profileStyle.listItem}>
          <Text style={{ fontWeight: 'bold' }}>
            {sharedNotesCount}
          </Text>
          <Text>Shared Notes</Text>
        </View>

      </View>

      {/* Button Information */}
      <View style={{ marginTop: 20 }}>

        {/* Edit Profile */}
        <View style={profileStyle.allButtons}>
          <View style={profileStyle.buttonContent}>
            <Image
              source={require('../../assets/profile-button-icons/groups.png')}
              style={{ width: 40, height: 40 }}
            />

            <View>
              <Text style={{ fontSize: 18 }}>My Groups</Text>
              <Text>Join or create study group</Text>
            </View>
          </View>

          <Pressable>
            <Image
              source={require('../../assets/profile-button-icons/arrow.png')}
              style={{ width: 40, height: 40 }}
            />
          </Pressable>
        </View>

        {/* My Groups */}
        <View style={profileStyle.allButtons}>
          <View style={profileStyle.buttonContent}>
            <Image
              source={require('../../assets/profile-button-icons/achievements.png')}
              style={{ width: 40, height: 40 }}
            />

            <View>
              <Text style={{ fontSize: 18 }}>Achievements</Text>
              <Text>See your progress and reward</Text>
            </View>
          </View>

          <Pressable>
            <Image
              source={require('../../assets/profile-button-icons/arrow.png')}
              style={{ width: 40, height: 40 }}
            />
          </Pressable>
        </View>

        {/* Save Notes */}
        <View style={profileStyle.allButtons}>
          <View style={profileStyle.buttonContent}>
            <Image
              source={require('../../assets/profile-button-icons/notes.png')}
              style={{ width: 40, height: 40 }}
            />

            <View>
              <Text style={{ fontSize: 18 }}>Save Notes</Text>
              <Text>Your saved study materials</Text>
            </View>
          </View>

          <Pressable>
            <Image
              source={require('../../assets/profile-button-icons/arrow.png')}
              style={{ width: 40, height: 40 }}
            />
          </Pressable>
        </View>

        {/* Achievements */}
        <View style={profileStyle.allButtons}>
          <View style={profileStyle.buttonContent}>
            <Image
              source={require('../../assets/profile-button-icons/edit.png')}
              style={{ width: 40, height: 40 }}
            />

            <View>
              <Text style={{ fontSize: 18 }}>Password / Delete</Text>
              <Text>Settings</Text>
            </View>
          </View>

          <Pressable onPress={() => router.replace('/edit-profile')}>
            <Image
              source={require('../../assets/profile-button-icons/arrow.png')}
              style={{ width: 40, height: 40 }}
            />
          </Pressable>
        </View>

        {/* Log Out */}
        <View>
          <Pressable
            style={profileStyle.logoutButton}
            onPress={async () => {
              await supabase.auth.signOut();
              router.replace('/users/login');
            }}
          >
            <Image
              source={require('../../assets/profile-button-icons/logout.png')}
              style={{ width: 40, height: 40 }}
            />

            <View>
              <Text style={profileStyle.logoutText}>
                Log Out
              </Text>
            </View>
          </Pressable>
        </View>

      </View>
    </View>
  );
}

const profileStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  navbar: {
    marginTop: 60,
    marginHorizontal: 30,
  },

  profileNav: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  profileAvatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileInitial: {
    fontSize: 65,
    fontWeight: 'bold',
    color: 'white',
  },

  onlineBadge: {
    backgroundColor: '#42b924',
    width: 100,
    height: 30,
    borderRadius: 30,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  onlineText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },

  profileList: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 40,
  },

  listItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  allButtons: {
    backgroundColor: '#FFF3E0',
    flexDirection: 'row',
    borderColor: 'black',
    borderWidth: 1,
    height: 70,
    marginHorizontal: 20,
    marginBottom: 0,
    marginTop: 10,
    borderRadius: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  buttonContent: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },

  logoutButton: {
    backgroundColor: '#3ab862',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 15,
    height: 50,
    gap: 10,
    paddingHorizontal: 10,
  },

  logoutText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D9D9D9',
  },
});
