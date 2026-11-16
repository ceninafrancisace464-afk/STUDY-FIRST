import {View,Text,Image,TextInput,Pressable,StyleSheet,ScrollView,Alert,ActivityIndicator,} from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Friend = {
  id: string;
  full_name: string;
};

export default function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [program, setProgram] = useState('');
  const [search, setSearch] = useState('');

  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  // FETCH FRIENDS
  const fetchFriends = async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return;

    const { data: friendData, error } = await supabase
      .from('friends')
      .select('user_one, user_two')
      .or(`user_one.eq.${user.id},user_two.eq.${user.id}`);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    const friendIds = (friendData || []).map((friend) =>
      friend.user_one === user.id
        ? friend.user_two
        : friend.user_one
    );

    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', friendIds);

    if (profileError) {
      Alert.alert('Error', profileError.message);
      return;
    }

    setFriends(profiles || []);
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  // SELECT OR REMOVE FRIEND
  const toggleFriend = (friendId: string) => {
    setSelectedFriends((previous) =>
      previous.includes(friendId)
        ? previous.filter((id) => id !== friendId)
        : [...previous, friendId]
    );
  };

  // CREATE GROUP
  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Required', 'Please enter a group name.');
      return;
    }

    if (!program.trim()) {
      Alert.alert('Required', 'Please enter your program.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc(
        'create_study_group',
        {
          p_group_name: groupName.trim(),
          p_program: program.trim(),
          p_member_ids: selectedFriends,
        }
      );

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Success', 'Study group created successfully!');

      setGroupName('');
      setProgram('');
      setSelectedFriends([]);

      router.back();

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // SEARCH FRIENDS
  const filteredFriends = friends.filter((friend) =>
    friend.full_name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.replace('/groups')}>
          <View style={styles.backButton}>
            <Image
              source={require('../../assets/signup/arrow-2.png')}
              style={{ width: 30, height: 30 }}
            />
          </View>
        </Pressable>

        <Text style={styles.navbarTitle}>
          Create Group
        </Text>

        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* GROUP NAME */}
        <View style={{ marginTop: 40 }}>
          <View style={styles.createGroupContainer}>
            <Text style={styles.label}>
              Group Name
            </Text>

            <TextInput
              placeholder="Group name"
              style={styles.inputText}
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>

          {/* PROGRAM */}
          <View style={styles.createGroupContainer}>
            <Text style={styles.label}>
              Program
            </Text>

            <TextInput
              placeholder="IT, OA, EDU, CS"
              style={styles.inputText}
              value={program}
              onChangeText={setProgram}
            />
          </View>
        </View>

        {/* ADD MEMBERS */}
        <View style={styles.addMembersContainer}>
          <Text style={styles.memberTitle}>
            Add Members ({selectedFriends.length})
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* FRIENDS LIST */}
        <View style={styles.memberList}>

          {filteredFriends.length === 0 ? (
            <Text style={styles.emptyText}>
              {friends.length === 0
                ? 'You do not have any friends yet.'
                : 'No friends found.'}
            </Text>
          ) : (
            filteredFriends.map((friend) => {
              const isSelected = selectedFriends.includes(friend.id);

              return (
                <View
                  key={friend.id}
                  style={styles.friendRow}
                >
                  <View style={styles.friendInfo}>
                    <View style={styles.exProfile}>
                      <Text style={styles.friendInitial}>
                        {friend.full_name?.charAt(0).toUpperCase() || 'S'}
                      </Text>
                    </View>

                    <Text style={styles.friendName}>
                      {friend.full_name}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => toggleFriend(friend.id)}
                    style={[
                      styles.addButton,
                      isSelected && styles.selectedButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.addButtonText,
                        isSelected && styles.selectedButtonText,
                      ]}
                    >
                      {isSelected ? 'Added ✓' : '+ Add'}
                    </Text>
                  </Pressable>

                </View>
              );
            })
          )}

        </View>

        {/* CREATE BUTTON */}
        <Pressable
          style={styles.createButton}
          onPress={createGroup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createButtonText}>
              Create Group
            </Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />

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
    paddingHorizontal: 20,
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
    fontSize: 22,
    fontWeight: 'bold',
  },

  createGroupContainer: {
    marginHorizontal: 20,
    marginTop: 10,
  },

  label: {
    fontSize: 17,
    marginBottom: 10,
    fontWeight: '600',
  },

  inputText: {
    borderWidth: 1,
    width: '100%',
    borderRadius: 10,
    borderColor: '#3ab862',
    paddingHorizontal: 10,
    height: 48,
  },

  addMembersContainer: {
    marginTop: 30,
    marginHorizontal: 20,
  },

  memberTitle: {
    marginBottom: 15,
    fontSize: 17,
    fontWeight: '600',
  },

  searchInput: {
    borderWidth: 1,
    width: '100%',
    borderRadius: 10,
    borderColor: '#3ab862',
    paddingHorizontal: 10,
    height: 45,
  },

  memberList: {
    backgroundColor: '#fbfbfb',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    margin: 20,
    borderRadius: 10,
    paddingVertical: 5,
  },

  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },

  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  exProfile: {
    backgroundColor: '#e4e3e3',
    width: 50,
    height: 50,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },

  friendInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },

  friendName: {
    fontWeight: '600',
    flexShrink: 1,
  },

  addButton: {
    backgroundColor: '#3ab862',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },

  selectedButton: {
    backgroundColor: '#e2e2e2',
  },

  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  selectedButtonText: {
    color: '#333',
  },

  emptyText: {
    textAlign: 'center',
    padding: 25,
    color: '#777',
  },

  createButton: {
    backgroundColor: '#3ab862',
    marginHorizontal: 20,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  createButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
