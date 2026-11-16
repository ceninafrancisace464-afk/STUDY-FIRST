import React from 'react';
import {View,Text,TextInput,Pressable,StyleSheet,KeyboardAvoidingView,Platform,Image,} from 'react-native';

import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function KapiChat() {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={25}
            color="#E53935"
          />
        </Pressable>

        <Text style={styles.headerTitle}>Kapi Chat</Text>

        <View style={styles.headerRight} />
      </View>

      {/* CHAT CONTENT */}
      <View style={styles.chatArea}>

        {/* KAPI WELCOME MESSAGE */}
        <View style={styles.welcomeRow}>
          <View style={styles.avatarContainer}>
            <Image style={{width: 60, height: 60, resizeMode: "contain"}} source={require('../../assets/ai/KapiAI.png')}/>
          </View>

          <View style={styles.welcomeBubble}>
            <Text style={styles.messageText}>
              Hi, Jake!
            </Text>

            <Text style={styles.messageText}>
              Let's make studying fun!
            </Text>

            <Text style={styles.messageText}>
              Turn your lessons into quizzes. Share your notes,
              upload a lesson or enter a topic, and I'll create a
              quiz to help you review and test your knowledge.
            </Text>
          </View>
        </View>

      </View>

      {/* MESSAGE INPUT */}
      <View style={styles.bottomContainer}>
        <View style={styles.inputWrapper}>

          <TextInput
            style={styles.textInput}
            placeholder="Ask a question or type..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
          />

          <Pressable style={styles.sendButton}>
            <Ionicons
              name="arrow-up"
              size={21}
              color="#FFFFFF"
            />
          </Pressable>

        </View>

        <Text style={styles.disclaimer}>
          AI can make mistakes. Review important details.
        </Text>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // HEADER
  header: {
    height: 65,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  headerRight: {
    width: 38,
  },

  // CHAT AREA
  chatArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
    paddingBottom: 20,
  },

  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },

  avatarContainer: {
    width: 26,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  welcomeBubble: {
    flex: 1,
    maxWidth: '88%',
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 13,
    padding: 12,
    gap: 12,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 17,
    color: '#444444',
  },

  // INPUT
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    backgroundColor: '#FFFFFF',
  },

  inputWrapper: {
    minHeight: 63,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#FFBDBD',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  textInput: {
    flex: 1,
    minHeight: 70,
    maxHeight: 100,
    fontSize: 12,
    color: '#333333',
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 5,
  },

  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 20,
    backgroundColor: '#D93030',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
    marginLeft: 5,
  },

  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#BDBDBD',
    marginTop: 10,
  },

});
