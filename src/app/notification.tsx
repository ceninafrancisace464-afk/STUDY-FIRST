import {View,Text,Image,Pressable,StyleSheet,ScrollView,Alert,ActivityIndicator,} from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_name: string;
};

export default function NotificationPage() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        setRequests([]);
        return;
      }

      const userId = authData.user.id;
      setCurrentUserId(userId);

      // GET FRIEND REQUESTS RECEIVED BY CURRENT USER
      const { data: requestData, error: requestError } =
        await supabase
          .from('friend_requests')
          .select('id, sender_id, receiver_id, status, created_at')
          .eq('receiver_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

      if (requestError) {
        console.log('REQUEST ERROR:', requestError.message);
        Alert.alert('Error', requestError.message);
        return;
      }

      if (!requestData || requestData.length === 0) {
        setRequests([]);
        return;
      }

      // GET SENDER PROFILES
      const senderIds = requestData.map(
        (request) => request.sender_id
      );

      const { data: profiles, error: profileError } =
        await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', senderIds);

      if (profileError) {
        console.log('PROFILE ERROR:', profileError.message);
        Alert.alert('Error', profileError.message);
        return;
      }

      const formattedRequests = requestData.map((request) => {
        const senderProfile = profiles?.find(
          (profile) => profile.id === request.sender_id
        );

        return {
          ...request,
          sender_name: senderProfile?.full_name || 'Unknown Student',
        };
      });

      setRequests(formattedRequests);
    } catch (error: any) {
      console.log('FETCH ERROR:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  
// ACCEPT OR DECLINE REQUEST
const updateRequest = async (
  requestId: string,
  status: 'accepted' | 'declined'
) => {
  try {
    setProcessingId(requestId);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    if (status === 'accepted') {
      const { error } = await supabase.rpc(
        'accept_friend_request',
        {
          p_request_id: requestId,
        }
      );

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
    }

    Alert.alert(
      'Success',
      status === 'accepted'
        ? 'Friend request accepted!'
        : 'Friend request declined!'
    );

    await fetchRequests();

  } catch (error: any) {
    Alert.alert('Error', error.message);
  } finally {
    setProcessingId(null);
  }
};


  return (
    <View style={styles.container}>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.replace('/home')}>
          <View style={styles.backButton}>
            <Image
              source={require('../../assets/signup/arrow-2.png')}
              style={{ width: 30, height: 30 }}
            />
          </View>
        </Pressable>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.navTitle}>Notification</Text>
        </View>

        <View style={{ width: 50 }} />
      </View>

      {/* SECTION */}
      <View style={styles.sectionHeader}>
        <Text style={{ color: 'gray' }}>New</Text>

        <Pressable
          onPress={fetchRequests}
          style={styles.refreshButton}
        >
          <Text style={{ color: '#3ab862', fontWeight: 'bold' }}>
            Refresh
          </Text>
        </Pressable>
      </View>

      {/* FRIEND REQUEST LIST */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3ab862"
            style={{ marginTop: 40 }}
          />
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No Friend Requests
            </Text>
            <Text style={styles.emptyText}>
              When someone adds you, their request will appear here.
            </Text>
          </View>
        ) : (
          requests.map((request) => {
            const initial =
              request.sender_name.trim().charAt(0).toUpperCase() || 'S';

            return (
              <View style={styles.requestBox} key={request.id}>
                <Pressable
                  style={styles.senderInfo}
                  onPress={() =>
                    router.push({
                      pathname: '/user-profile',
                      params: { userId: request.sender_id },
                    })
                  }
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.senderName}>
                      {request.sender_name}
                    </Text>
                    <Text style={styles.requestMessage}>
                      Sent you a friend request
                    </Text>
                  </View>
                </Pressable>

                <View style={styles.actionButtons}>
                  <Pressable
                    style={styles.acceptButton}
                    disabled={processingId === request.id}
                    onPress={() =>
                      updateRequest(request.id, 'accepted')
                    }
                  >
                    <Text style={styles.acceptText}>
                      {processingId === request.id
                        ? 'Please wait...'
                        : 'Accept'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.declineButton}
                    disabled={processingId === request.id}
                    onPress={() =>
                      updateRequest(request.id, 'declined')
                    }
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
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
    backgroundColor: '#3ab862',
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },

  backButton: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 55,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  navTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
  },

  sectionHeader: {
    flexDirection: 'row',
    margin: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  refreshButton: {
    backgroundColor: '#6ee092',
    width: 80,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  requestBox: {
    marginHorizontal: 10,
    marginBottom: 12,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dedddd',
  },

  senderInfo: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },

  avatar: {
    backgroundColor: '#D9D9D9',
    width: 55,
    height: 55,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 23,
  },

  senderName: {
    fontWeight: 'bold',
    color: '#444',
    fontSize: 15,
  },

  requestMessage: {
    fontSize: 12,
    color: '#a5a3a3',
    marginTop: 5,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    justifyContent: 'flex-end',
  },

  acceptButton: {
    backgroundColor: '#3ab862',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
  },

  acceptText: {
    color: 'white',
    fontWeight: 'bold',
  },

  declineButton: {
    backgroundColor: '#eeeeee',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
  },

  declineText: {
    color: '#555',
    fontWeight: 'bold',
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 70,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },

  emptyText: {
    color: 'gray',
    textAlign: 'center',
    marginTop: 8,
  },

  bottomNavbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#3ab862',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 10,
  },

  navIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
});
