import {View,Text,Image,TextInput,Pressable,StyleSheet,ScrollView,ActivityIndicator,Modal,Alert,} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

type StudyGroup = {
  id: string;
  group_name: string;
  program: string | null;
  created_at: string;
  created_by: string;
};

type TabType = 'All' | 'Unread' | 'Groups';

export default function GroupsPage() {
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // TAB STATE
  const [activeTab, setActiveTab] = useState<TabType>('All');

  // MODAL STATES
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [deleting, setDeleting] = useState(false);

  // FETCH GROUPS
  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setGroups([]);
        setCurrentUserId(null);
        return;
      }

      setCurrentUserId(user.id);

      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) {
        console.log('Membership error:', memberError.message);
        return;
      }

      const groupIds = (memberships || []).map(
        (item) => item.group_id
      );

      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      const { data: groupData, error: groupError } = await supabase
        .from('study_groups')
        .select('id, group_name, program, created_at, created_by')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupError) {
        console.log('Group error:', groupError.message);
        return;
      }

      setGroups(groupData || []);

    } catch (error) {
      console.log('Fetch groups error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // REFRESH WHEN SCREEN OPENS
  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  // FORMAT TIME
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // SEARCH GROUPS
  const filteredGroups = groups.filter((group) =>
    `${group.group_name} ${group.program || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // DISPLAY GROUPS
  const displayedGroups =
    activeTab === 'Unread' ? [] : filteredGroups;

  // OPEN GROUP CHAT
  const openGroupChat = (group: StudyGroup) => {
    router.push({
      pathname: '/group-chat' as any,
      params: {
        groupId: group.id,
        groupName: group.group_name,
      },
    });
  };

  // OPEN GROUP MODAL
  const openGroupMenu = (group: StudyGroup) => {
    setSelectedGroup(group);
    setMenuVisible(true);
  };

  // OPEN DELETE CONFIRMATION
  const openDeleteConfirmation = () => {
    setMenuVisible(false);

    setTimeout(() => {
      setConfirmVisible(true);
    }, 200);
  };

  // DELETE GROUP
  const deleteGroup = async () => {
    if (!selectedGroup || !currentUserId) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('study_groups')
        .delete()
        .eq('id', selectedGroup.id)
        .eq('created_by', currentUserId);

      if (error) {
        Alert.alert('Delete Failed', error.message);
        return;
      }

      setGroups((previousGroups) =>
        previousGroups.filter(
          (group) => group.id !== selectedGroup.id
        )
      );

      setConfirmVisible(false);
      setSelectedGroup(null);

      Alert.alert('Success', 'Group successfully deleted!');

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={groupsStyle.container}>

      {/* NAVBAR */}
      <View style={groupsStyle.navbar}>
        <Pressable onPress={() => router.replace('/home')}>
          <View style={groupsStyle.backButton}>
            <Image
              source={require('../../assets/signup/arrow-2.png')}
              style={{ width: 30, height: 30 }}
            />
          </View>
        </Pressable>

        <View style={{ alignItems: 'center' }}>
          <Text style={groupsStyle.navbarTitle}>Groups</Text>
        </View>

        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* SEARCH BAR */}
        <View style={groupsStyle.searchContainer}>
          <Image
            source={require('../../assets/groups-icons/Search.png')}
            style={{ width: 30, height: 30 }}
          />

          <TextInput
            style={groupsStyle.searchInput}
            placeholder="Search"
            placeholderTextColor="#3ab862"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* NAVIGATION TABS */}
        <View style={groupsStyle.allunreadgroup}>

          {(['All', 'Unread', 'Groups'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={groupsStyle.tabButton}
            >
              <Text
                style={[
                  groupsStyle.tabText,
                  activeTab === tab && groupsStyle.activeTabText,
                ]}
              >
                {tab}
              </Text>

              {activeTab === tab && (
                <View style={groupsStyle.activeTabIndicator} />
              )}
            </Pressable>
          ))}

          <Pressable>
            <Image
              source={require('../../assets/groups-icons/Other 2.png')}
              style={{ width: 30, height: 30 }}
            />
          </Pressable>

          {/* ADD GROUP */}
          <Pressable onPress={() => router.push('/create-group')}>
            <Image
              source={require('../../assets/groups-icons/Plus.png')}
              style={{ width: 50, height: 30 }}
            />
          </Pressable>

        </View>

        {/* GROUP LIST */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3ab862"
            style={{ marginTop: 40 }}
          />
        ) : displayedGroups.length === 0 ? (
          <View style={groupsStyle.emptyContainer}>
            <Text style={groupsStyle.emptyTitle}>
              {activeTab === 'Unread'
                ? 'No unread messages'
                : search
                ? 'No groups found'
                : 'No study groups yet'}
            </Text>

            <Text style={groupsStyle.emptyText}>
              {activeTab === 'Unread'
                ? 'You have no unread messages.'
                : search
                ? 'Try searching another group name.'
                : 'Create a group and invite your friends!'}
            </Text>
          </View>
        ) : (
          displayedGroups.map((group) => (
            <View
              key={group.id}
              style={groupsStyle.containerBox}
            >

              {/* CLICKABLE GROUP INFORMATION */}
              <Pressable
                style={groupsStyle.groupInfo}
                onPress={() => openGroupChat(group)}
              >
                <View style={groupsStyle.groupIcon}>
                  <Text style={groupsStyle.groupInitial}>
                    {group.group_name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={groupsStyle.groupName}>
                    {group.group_name}
                  </Text>

                  <Text style={groupsStyle.programText}>
                    {group.program || 'Study Group'}
                  </Text>

                  <Text style={groupsStyle.previewText}>
                    Study group created
                  </Text>
                </View>
              </Pressable>

              {/* TIME AND THREE DOTS */}
              <View style={groupsStyle.rightActions}>
                <Text style={groupsStyle.timeText}>
                  {formatTime(group.created_at)}
                </Text>

                {group.created_by === currentUserId && (
                  <Pressable
                    style={groupsStyle.moreButton}
                    onPress={() => openGroupMenu(group)}
                  >
                    <Text style={groupsStyle.moreText}>⋮</Text>
                  </Pressable>
                )}
              </View>

            </View>
          ))
        )}

        <View style={{ height: 30 }} />

      </ScrollView>

      {/* GROUP OPTIONS MODAL */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={groupsStyle.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable
            style={groupsStyle.menuModal}
            onPress={() => {}}
          >
            <Text style={groupsStyle.modalTitle}>
              Delete
            </Text>

            <Text style={groupsStyle.modalSubtitle}>
              {selectedGroup?.group_name}
            </Text>

            <Pressable
              style={groupsStyle.deleteOption}
              onPress={openDeleteConfirmation}
            >
              <Text style={groupsStyle.deleteOptionText}>
                Delete Group
              </Text>
            </Pressable>

            <Pressable
              style={groupsStyle.cancelOption}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={groupsStyle.cancelText}>
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) setConfirmVisible(false);
        }}
      >
        <View style={groupsStyle.modalOverlay}>
          <View style={groupsStyle.confirmModal}>
            <Text style={groupsStyle.confirmTitle}>
              Delete Group?
            </Text>

            <Text style={groupsStyle.confirmMessage}>
              Are you sure you want to delete{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {selectedGroup?.group_name}
              </Text>
              ? This action cannot be undone.
            </Text>

            <View style={groupsStyle.confirmButtons}>
              <Pressable
                style={groupsStyle.keepButton}
                onPress={() => setConfirmVisible(false)}
                disabled={deleting}
              >
                <Text style={groupsStyle.keepButtonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={groupsStyle.confirmDeleteButton}
                onPress={deleteGroup}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={groupsStyle.confirmDeleteText}>
                    Delete
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const groupsStyle = StyleSheet.create({
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

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },

  allunreadgroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
    gap: 25,
    alignItems: 'center',
  },

  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },

  tabText: {
    color: '#555',
    fontSize: 14,
  },

  activeTabText: {
    color: '#3ab862',
    fontWeight: 'bold',
  },

  activeTabIndicator: {
    width: 20,
    height: 3,
    borderRadius: 5,
    backgroundColor: '#3ab862',
    marginTop: 4,
  },

  containerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    padding: 10,
  },

  groupInfo: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
    alignItems: 'center',
  },

  groupIcon: {
    width: 65,
    height: 65,
    backgroundColor: '#3ab862',
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },

  groupInitial: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
  },

  groupName: {
    fontWeight: '700',
    fontSize: 15,
  },

  programText: {
    color: '#D62828',
    fontSize: 12,
    marginTop: 3,
  },

  previewText: {
    marginTop: 8,
    color: '#777',
    fontSize: 12,
  },

  rightActions: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  timeText: {
    fontSize: 11,
    color: '#777',
  },

  moreButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  moreText: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#444',
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 25,
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
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  menuModal: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 22,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },

  modalSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },

  deleteOption: {
    backgroundColor: '#FFF0F0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  deleteOptionText: {
    color: '#3ab862',
    fontSize: 15,
    fontWeight: 'bold',
  },

  cancelOption: {
    padding: 14,
    alignItems: 'center',
    marginTop: 5,
  },

  cancelText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '600',
  },

  confirmModal: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 22,
  },

  confirmTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },

  confirmMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 25,
  },

  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  keepButton: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
  },

  keepButtonText: {
    color: '#444',
    fontWeight: 'bold',
  },

  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#3ab862',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmDeleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
