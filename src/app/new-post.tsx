
import React, { useState, useEffect } from 'react';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPostImages, clearPostImages } from '../lib/postImages';
import { supabase } from '../lib/supabase';

export default function NewPost() {
  const [fullName, setFullName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [caption, setCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const [selectedImages] = useState<string[]>(
    () => getPostImages()
  );

  useEffect(() => {
    const getUserProfile = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert('Error', 'Unable to get logged-in user.');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, student_number')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('PROFILE ERROR:', error.message);
        return;
      }

      setFullName(data.full_name || '');
      setStudentNumber(data.student_number || '');
    };

    getUserProfile();
  }, []);

  // Get program from student number
  const getProgram = () => {
    const program = studentNumber
      .trim()
      .split('-')[0]
      .toUpperCase();

    const validPrograms = ['IT', 'CS', 'OA', 'EDU'];

    return validPrograms.includes(program) ? program : '';
  };

  const handlePublish = async () => {
    if (selectedImages.length === 0 && !caption.trim()) {
      Alert.alert(
        'Empty Post',
        'Please select a photo or write a caption.'
      );
      return;
    }

    try {
      setIsPublishing(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('You must be logged in to publish.');
      }

      const imagePaths: string[] = [];

      for (let index = 0; index < selectedImages.length; index++) {
        const uri = selectedImages[index];

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const fileData = decode(base64);

        const extension =
          uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';

        const contentType =
          extension === 'png'
            ? 'image/png'
            : extension === 'webp'
            ? 'image/webp'
            : 'image/jpeg';

        const filePath = `${user.id}/${Date.now()}-${index}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, fileData, {
            contentType,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        imagePaths.push(filePath);
      }

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: caption.trim() || null,
          image_paths: imagePaths,
        });

      if (postError) throw postError;

      clearPostImages();

      Alert.alert('Success!', 'Your post has been published.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.log('PUBLISH ERROR:', error);

      Alert.alert(
        'Publish Failed',
        error.message || 'Something went wrong.'
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={27} color="#D62828" />
        </Pressable>

        <Text style={styles.headerTitle}>New Post</Text>

        <View style={{ width: 27 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* USER */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color="white" />
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {fullName || 'Loading...'}
            </Text>

            <Text style={styles.userCourse}>
              {getProgram() || 'No program'}
            </Text>
          </View>
        </View>

        {/* CAPTION */}
        <TextInput
          style={styles.captionInput}
          placeholder="Write something about your post..."
          placeholderTextColor="#888"
          multiline
          value={caption}
          onChangeText={setCaption}
        />

        {selectedImages.length > 0 ? (
          <View style={styles.imageContainer}>
            {selectedImages.map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                style={styles.selectedImage}
                resizeMode="contain"
                onLoad={() => console.log('IMAGE LOADED:', uri)}
                onError={(error) =>
                  console.log('IMAGE ERROR:', error.nativeEvent)
                }
              />
            ))}
          </View>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons
              name="images-outline"
              size={35}
              color="#BBBBBB"
            />

            <Text style={styles.noImageText}>
              No photos selected
            </Text>
          </View>
        )}

        {/* ATTACH FILE */}
        <Pressable style={styles.attachRow}>
          <Ionicons name="attach" size={25} color="#333" />

          <View style={{ flex: 1 }}>
            <Text style={styles.attachTitle}>Attach File</Text>
            <Text style={styles.attachSubtitle}>PDF, DOCX</Text>
          </View>

          <View style={styles.addFileButton}>
            <Text style={styles.addFileText}>Add File</Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailList}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {selectedImages.map((uri, index) => (
            <Image
              key={`${uri}-${index}`}
              source={{ uri }}
              style={styles.thumbnail}
            />
          ))}

          <Pressable
            style={styles.addPhotoButton}
            onPress={() => router.back()}
          >
            <Ionicons name="add" size={25} color="white" />
          </Pressable>
        </ScrollView>

        {/* PUBLISH */}
        <Pressable
          style={styles.publishButton}
          onPress={handlePublish}
          disabled={isPublishing}
        >
          <Text style={styles.publishText}>
            {isPublishing ? 'Publishing...' : 'Publish Post'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  userCourse: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  captionInput: {
    minHeight: 75,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 13,
    color: '#333333',
    textAlignVertical: 'top',
  },
  imageContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  selectedImage: {
    width: '100%',
    height: 350,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
  },
  noImageContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noImageText: {
    fontSize: 12,
    color: '#999999',
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 15,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    gap: 10,
  },
  attachTitle: {
    fontSize: 13,
    color: '#333333',
  },
  attachSubtitle: {
    fontSize: 9,
    color: '#999999',
    marginTop: 3,
  },
  addFileButton: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addFileText: {
    fontSize: 10,
    color: '#444444',
  },
  bottomBar: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
    gap: 10,
  },
  thumbnailList: {
    flex: 1,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 9,
    marginRight: 6,
  },
  addPhotoButton: {
    width: 48,
    height: 48,
    borderRadius: 9,
    backgroundColor: '#D98C8C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButton: {
    backgroundColor: '#D62828',
    paddingHorizontal: 23,
    paddingVertical: 12,
    borderRadius: 25,
  },
  publishText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
