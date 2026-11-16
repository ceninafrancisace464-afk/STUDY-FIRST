import {View,Text,Image,TextInput,Pressable,StyleSheet,ScrollView,ActivityIndicator,KeyboardAvoidingView,Platform,Alert,} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type GroupMessage = {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
};

export default function groupChat() {
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
  }>();

  const [currentUserId, setCurrentUserId] = useState('');
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // GET LOGGED-IN USER
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        Alert.alert('Error', 'Unable to get logged-in user.');
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);
    };

    getCurrentUser();
  }, []);

  // FETCH GROUP MESSAGES
  const loadMessages = async () => {
    if (!currentUserId || !groupId) return;

    const { data, error } = await supabase
      .from('group_messages')
      .select('id, group_id, sender_id, content, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Load group messages error:', error.message);
      setLoading(false);
      return;
    }

    const messageData = data || [];

    // GET UNIQUE SENDER IDS
    const senderIds = [
      ...new Set(messageData.map((item) => item.sender_id)),
    ];

    let profiles: { id: string; full_name: string }[] = [];

    if (senderIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);

      if (profileError) {
        console.log('Sender profiles error:', profileError.message);
      } else {
        profiles = profileData || [];
      }
    }

    // ADD SENDER NAME TO EACH MESSAGE
    const formattedMessages: GroupMessage[] = messageData.map((item) => {
      const sender = profiles.find(
        (profile) => profile.id === item.sender_id
      );

      return {
        ...item,
        sender_name: sender?.full_name || 'Unknown User',
      };
    });

    setMessages(formattedMessages);
    setLoading(false);
  };

  // INITIAL LOAD + REALTIME
  useEffect(() => {
    if (!currentUserId || !groupId) return;

    loadMessages();

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, groupId]);

  // SEND GROUP MESSAGE
  const sendMessage = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    if (!currentUserId || !groupId || sending) return;

    setSending(true);

    const { error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        sender_id: currentUserId,
        content: trimmedMessage,
      });

    if (error) {
      console.log('Send group message error:', error.message);
      Alert.alert('Message Error', error.message);
    } else {
      setMessage('');
      await loadMessages();
    }

    setSending(false);
  };

  // FORMAT TIME
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* NAVBAR */}
      <View style={styles.navbar}>
        <View style={styles.navbarContent}>
          <Pressable onPress={() => router.back()}>
            <View style={styles.backButton}>
              <Image
                source={require('../../assets/signup/arrow-2.png')}
                style={{ width: 30, height: 30 }}
              />
            </View>
          </Pressable>

          <Text style={styles.groupName} numberOfLines={1}>
            {groupName || 'Group Chat'}
          </Text>
        </View>
      </View>

      {/* GROUP MESSAGES */}
      <ScrollView
        style={styles.messageArea}
        contentContainerStyle={styles.messageContent}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#D62828"
          />
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No messages yet.
            </Text>

            <Text style={styles.emptySubText}>
              Start the group conversation!
            </Text>
          </View>
        ) : (
          messages.map((item) => {
            const isMine = item.sender_id === currentUserId;

            return (
              <View
                key={item.id}
                style={[
                  styles.messageRow,
                  isMine
                    ? styles.myMessageRow
                    : styles.otherMessageRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMine
                      ? styles.myMessage
                      : styles.otherMessage,
                  ]}
                >
                  {!isMine && (
                    <Text style={styles.senderName}>
                      {item.sender_name}
                    </Text>
                  )}

                  <Text
                    style={[
                      styles.messageText,
                      isMine && styles.myMessageText,
                    ]}
                  >
                    {item.content}
                  </Text>

                  <Text
                    style={[
                      styles.messageTime,
                      isMine && styles.myMessageTime,
                    ]}
                  >
                    {formatTime(item.created_at)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MESSAGE INPUT */}
      <View style={styles.bottomContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Message"
          placeholderTextColor="#888"
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <Pressable
          style={[
            styles.sendButton,
            (!message.trim() || sending) && styles.disabledButton,
          ]}
          onPress={sendMessage}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Image
              source={require('../../assets/message-icons/Send.png')}
              style={{ width: 40, height: 40 }}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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

  navbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },

  groupName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    maxWidth: 230,
  },

  backButton: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 55,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  messageArea: {
    flex: 1,
  },

  messageContent: {
    padding: 15,
    paddingBottom: 100,
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },

  emptySubText: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
  },

  messageRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 12,
  },

  myMessageRow: {
    justifyContent: 'flex-end',
  },

  otherMessageRow: {
    justifyContent: 'flex-start',
  },

  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 15,
  },

  myMessage: {
    backgroundColor: '#3ab862',
    borderBottomRightRadius: 3,
  },

  otherMessage: {
    backgroundColor: '#EEEEEE',
    borderBottomLeftRadius: 3,
  },

  senderName: {
    color: '#3ab862',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  messageText: {
    color: '#222',
    fontSize: 15,
  },

  myMessageText: {
    color: 'white',
  },

  messageTime: {
    fontSize: 10,
    color: '#777',
    textAlign: 'right',
    marginTop: 5,
  },

  myMessageTime: {
    color: '#FFE0E0',
  },

  bottomContainer: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },

  textInput: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginRight: 8,
    borderRadius: 10,
    flex: 1,
    minHeight: 45,
    maxHeight: 100,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#222',
  },

  sendButton: {
    backgroundColor: '#3ab862',
    width: 65,
    height: 45,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.5,
  },
});
