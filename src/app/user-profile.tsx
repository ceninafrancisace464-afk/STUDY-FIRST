
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function UserProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [sharedNotesCount, setSharedNotesCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    getProfile();
  }, [userId]);

  const getProfile = async () => {
    try {
      setLoading(true);

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) return;

      setCurrentUserId(authData.user.id);

      if (!userId) return;

      // GET USER PROFILE
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.log('PROFILE ERROR:', profileError.message);
        return;
      }

      setFullName(profile.full_name || '');

      // GET USERNAME
      // Email is not stored in profiles, so retrieve it through
      // an authorized profile lookup only if you add a username column.
      setUsername('');

      // GET SHARED NOTES COUNT
      const { count, error: countError } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        console.log('SHARED NOTES ERROR:', countError.message);
      } else {
        setSharedNotesCount(count ?? 0);
      }

      // CHECK EXISTING FRIEND REQUEST
      const { data: existingRequest, error: requestError } =
        await supabase
          .from('friend_requests')
          .select('id, status')
          .eq('sender_id', authData.user.id)
          .eq('receiver_id', userId)
          .maybeSingle();

      if (requestError) {
        console.log('REQUEST CHECK ERROR:', requestError.message);
      } else {
        setRequestSent(!!existingRequest);
      }
    } catch (error: any) {
      console.log('GET PROFILE ERROR:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // SEND FRIEND REQUEST
  const addFriend = async () => {
    if (!userId || !currentUserId) return;

    try {
      setSendingRequest(true);

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: currentUserId,
          receiver_id: userId,
        });

      if (error) {
        console.log('ADD FRIEND ERROR:', error.message);
        Alert.alert('Error', error.message);
        return;
      }

      setRequestSent(true);
      Alert.alert('Success', 'Friend request sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSendingRequest(false);
    }
  };

  const profileInitial =
    fullName.trim().charAt(0).toUpperCase() || 'S';

  return (
    <ScrollView style={styles.container}>
      {/* NAVBAR */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.back()}>
          <Image
            source={require('../../assets/signup/arrow-2.png')}
            style={{ width: 40, height: 40 }}
          />
        </Pressable>
      </View>

      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 50 }}>
          Loading profile...
        </Text>
      ) : (
        <>
          {/* PROFILE SECTION */}
          <View style={styles.profileNav}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {profileInitial}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fullName}>
                {fullName || 'Student'}
              </Text>

              <Text>{username || '@student'}</Text>

              <View style={styles.onlineBadge}>
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
          </View>

          {/* PROFILE STATISTICS */}
          <View style={styles.profileList}>
            <View style={styles.listItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text>Friends</Text>
            </View>

            <View style={styles.listItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text>Study Group</Text>
            </View>

            <View style={styles.listItem}>
              <Text style={styles.statNumber}>
                {sharedNotesCount}
              </Text>
              <Text>Shared Notes</Text>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          {!isOwnProfile && (
            <View style={styles.actionContainer}>
              <Pressable
                style={[
                  styles.addFriendButton,
                  requestSent && styles.disabledButton,
                ]}
                onPress={addFriend}
                disabled={requestSent || sendingRequest}
              >
                <Text style={styles.addFriendText}>
                  {sendingRequest
                    ? 'Sending...'
                    : requestSent
                    ? 'Request Sent'
                    : 'Add Friend'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.messageButton}
                onPress={() =>
                  Alert.alert(
                    'Message',
                    'Messaging feature is not available yet.'
                  )
                }
              >
                <Text style={styles.messageText}>Message</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </ScrollView>
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

  fullName: {
    fontSize: 20,
    fontWeight: 'bold',
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

  statNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  actionContainer: {
    marginTop: 30,
    marginHorizontal: 20,
    gap: 12,
  },

  addFriendButton: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 15,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addFriendText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  disabledButton: {
    backgroundColor: '#D9D9D9',
  },

  messageButton: {
    backgroundColor: '#D62828',
    borderRadius: 15,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },

  messageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
