import {View,Text,Image,TextInput,Pressable,StyleSheet,ScrollView,ActivityIndicator,KeyboardAvoidingView,Platform,Alert,} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type DirectMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export default function Chat() {
  const { friendId, friendName } = useLocalSearchParams<{
    friendId: string;
    friendName: string;
  }>();

  const [currentUserId, setCurrentUserId] = useState('');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
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

  // FETCH MESSAGES
  const loadMessages = useCallback(async () => {
    if (!currentUserId || !friendId) return;

    const { data, error } = await supabase
      .from('direct_messages')
      .select('id, sender_id, receiver_id, content, created_at')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.log('Load messages error:', error.message);
      setLoading(false);
      return;
    }

    setMessages(data || []);
    setLoading(false);
  }, [currentUserId, friendId]);

  // MARK RECEIVED MESSAGES AS READ
  const markMessagesAsRead = useCallback(async () => {
    if (!currentUserId || !friendId) return;

    const { error } = await supabase
      .from('direct_messages')
      .update({
        read_at: new Date().toISOString(),
      })
      .eq('sender_id', friendId)
      .eq('receiver_id', currentUserId)
      .is('read_at', null);

    if (error) {
      console.log('Mark as read error:', error.message);
    }
  }, [currentUserId, friendId]);

  // INITIAL LOAD + REALTIME
  useEffect(() => {
    if (!currentUserId || !friendId) return;

    loadMessages();

    // Mark existing received messages as read
    markMessagesAsRead();

    const channel = supabase
      .channel(`direct-chat-${currentUserId}-${friendId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const newMessage = payload.new as DirectMessage;

          const isThisConversation =
            (newMessage.sender_id === currentUserId &&
              newMessage.receiver_id === friendId) ||
            (newMessage.sender_id === friendId &&
              newMessage.receiver_id === currentUserId);

          if (isThisConversation) {
            loadMessages();

            // If friend sends a message while chat is open,
            // automatically mark it as read.
            if (newMessage.sender_id === friendId) {
              markMessagesAsRead();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    currentUserId,
    friendId,
    loadMessages,
    markMessagesAsRead,
  ]);

  // SEND MESSAGE
  const sendMessage = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    if (!currentUserId || !friendId || sending) return;

    setSending(true);

    const { error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: currentUserId,
        receiver_id: friendId,
        content: trimmedMessage,
      });

    if (error) {
      console.log('Send message error:', error.message);
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

          <Text style={styles.friendName} numberOfLines={1}>
            {friendName || 'Chat'}
          </Text>
        </View>
      </View>

      {/* MESSAGES */}
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
              Start your conversation!
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
    backgroundColor: '#D62828',
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

  friendName: {
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
    backgroundColor: '#D62828',
    borderBottomRightRadius: 3,
  },

  otherMessage: {
    backgroundColor: '#EEEEEE',
    borderBottomLeftRadius: 3,
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
    backgroundColor: '#D62828',
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
