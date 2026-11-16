import {View,Text,Image,TextInput,Pressable,StyleSheet,ScrollView,ActivityIndicator,} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

type Friend = {
  id: string;
  full_name: string;
  created_at: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

type TabType = 'All' | 'Unread';

export default function Messages() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('All');

  // FETCH FRIENDS AND MESSAGES
  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setFriends([]);
        return;
      }

      // GET ACCEPTED FRIENDS
      const { data: friendData, error: friendError } =
        await supabase
          .from('friends')
          .select('user_one, user_two, created_at')
          .or(`user_one.eq.${user.id},user_two.eq.${user.id}`)
          .order('created_at', { ascending: false });

      if (friendError) {
        console.log('Friends error:', friendError.message);
        setFriends([]);
        return;
      }

      if (!friendData || friendData.length === 0) {
        setFriends([]);
        return;
      }

      // GET FRIEND IDS
      const friendIds = friendData.map((friend) =>
        friend.user_one === user.id
          ? friend.user_two
          : friend.user_one
      );

      // GET FRIEND PROFILES
      const { data: profiles, error: profileError } =
        await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', friendIds);

      if (profileError) {
        console.log('Profile error:', profileError.message);
        return;
      }

      // GET LATEST MESSAGE AND UNREAD COUNT
      const formattedFriends = await Promise.all(
        friendData.map(async (friend) => {
          const friendId =
            friend.user_one === user.id
              ? friend.user_two
              : friend.user_one;

          const profile = profiles?.find(
            (item) => item.id === friendId
          );

          if (!profile) return null;

          // LATEST MESSAGE
          const { data: latestMessage, error: messageError } =
            await supabase
              .from('direct_messages')
              .select('content, created_at, sender_id')
              .or(
                `and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`
              )
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

          if (messageError) {
            console.log(
              'Message preview error:',
              messageError.message
            );
          }

          // GET UNREAD COUNT
          const { count: unreadCount, error: unreadError } =
            await supabase
              .from('direct_messages')
              .select('*', {
                count: 'exact',
                head: true,
              })
              .eq('sender_id', friendId)
              .eq('receiver_id', user.id)
              .is('read_at', null);

          if (unreadError) {
            console.log(
              'Unread count error:',
              unreadError.message
            );
          }

          return {
            id: friendId,
            full_name: profile.full_name || 'Unknown User',
            created_at: friend.created_at,
            last_message:
              latestMessage?.content || 'You are now friends!',
            last_message_at:
              latestMessage?.created_at || friend.created_at,
            unread_count: unreadCount || 0,
          };
        })
      );

      const validFriends = formattedFriends.filter(
        (friend): friend is Friend => friend !== null
      );

      // SORT BY LATEST MESSAGE
      validFriends.sort(
        (a, b) =>
          new Date(b.last_message_at).getTime() -
          new Date(a.last_message_at).getTime()
      );

      setFriends(validFriends);
    } catch (error) {
      console.log('Fetch friends error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // REFRESH WHEN OPENING MESSAGES SCREEN
  useFocusEffect(
    useCallback(() => {
      fetchFriends();
    }, [fetchFriends])
  );

  // FORMAT TIME
  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    return messageDate.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
    });
  };

  // SEARCH AND TAB FILTER
  const filteredFriends = friends.filter((friend) => {
    const matchesSearch = friend.full_name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesTab =
      activeTab === 'All' || friend.unread_count > 0;

    return matchesSearch && matchesTab;
  });

  // OPEN CHAT
  const openChat = (friend: Friend) => {
    router.push({
      pathname: '/chat' as any,
      params: {
        friendId: friend.id,
        friendName: friend.full_name,
      },
    });
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
          <Text style={styles.navbarTitle}>Messages</Text>
        </View>

        <View style={{ width: 50 }} />
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Image
          source={require('../../assets/groups-icons/Search.png')}
          style={{ width: 30, height: 30 }}
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#3ab862"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* NAVIGATION TABS */}
      <View style={styles.allunreadgroup}>

        <Pressable onPress={() => setActiveTab('All')}>
          <Text
            style={
              activeTab === 'All'
                ? styles.activeTab
                : styles.tabText
            }
          >
            All
          </Text>
        </Pressable>

        <Pressable onPress={() => setActiveTab('Unread')}>
          <Text
            style={
              activeTab === 'Unread'
                ? styles.activeTab
                : styles.tabText
            }
          >
            Unread
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/groups')}>
          <Text style={styles.tabText}>Groups</Text>
        </Pressable>

        <Pressable>
          <Image
            source={require('../../assets/groups-icons/Other 2.png')}
            style={{ width: 30, height: 30 }}
          />
        </Pressable>

      </View>

      {/* FRIEND / CONVERSATION LIST */}
      <ScrollView showsVerticalScrollIndicator={false}>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3ab862"
            style={{ marginTop: 40 }}
          />
        ) : filteredFriends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {activeTab === 'Unread'
                ? 'No unread messages'
                : search
                  ? 'No friends found'
                  : 'No messages yet'}
            </Text>

            <Text style={styles.emptyText}>
              {activeTab === 'Unread'
                ? 'You have no unread messages.'
                : search
                  ? 'Try searching another name.'
                  : 'When someone accepts your friend request, they will appear here.'}
            </Text>
          </View>
        ) : (
          filteredFriends.map((friend) => (
            <Pressable
              key={friend.id}
              style={styles.containerBx}
              onPress={() => openChat(friend)}
            >
              <View style={styles.friendInfo}>

                {/* FRIEND INITIAL */}
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendInitial}>
                    {friend.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* FRIEND DETAILS */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendName}>
                    {friend.full_name}
                  </Text>

                  <Text
                    style={styles.previewText}
                    numberOfLines={1}
                  >
                    {friend.last_message}
                  </Text>
                </View>
              </View>

              {/* TIME AND UNREAD COUNT */}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.timeText}>
                  {formatTime(friend.last_message_at)}
                </Text>

                {friend.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {friend.unread_count > 99
                        ? '99+'
                        : friend.unread_count}
                    </Text>
                  </View>
                )}
              </View>

            </Pressable>
          ))
        )}

        <View style={{ height: 30 }} />

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

  navbarTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
    textAlign: 'center',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    height: 48,
    marginHorizontal: 20,
    marginTop: 15,
    borderColor: '#888',
  },

  allunreadgroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
    gap: 25,
    alignItems: 'center',
  },

  activeTab: {
    color: '#3ab862',
    fontWeight: 'bold',
    fontSize: 14,
  },

  tabText: {
    color: '#555',
    fontSize: 14,
  },

  containerBx: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginVertical: 5,
    padding: 10,
    borderRadius: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  friendInfo: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },

  friendAvatar: {
    backgroundColor: '#3ab862',
    width: 60,
    height: 60,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },

  friendInitial: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
  },

  friendName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },

  previewText: {
    marginTop: 8,
    color: '#888',
    fontSize: 12,
  },

  timeText: {
    fontSize: 11,
    color: '#888',
  },

  unreadBadge: {
    backgroundColor: '#3ab862',
    minWidth: 21,
    height: 21,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginTop: 7,
  },

  unreadBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },

  emptyText: {
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
