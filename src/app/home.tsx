import {View,Text,Image,Pressable,StyleSheet,ScrollView,Alert,Modal,} from 'react-native';
import { setPostImages } from '../lib/postImages';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function Home() {
  const [fullName, setFullName] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showOthersMenu, setShowOthersMenu] = useState(false);

  // LIKE AND SHARE
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  // FEED / MY NOTES TAB
  const [activeTab, setActiveTab] = useState<'Feed' | 'My Notes'>('Feed');

  // FILTER POSTS
  const visiblePosts =
    activeTab === 'My Notes'
      ? posts.filter(post => post.user_id === currentUserId)
      : posts;

  // OPEN PHONE GALLERY
  const openGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow Study Buddy to access your photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const imageUris = result.assets.map(asset => asset.uri);

      setPostImages(imageUris);

      router.push('/new-post');
    } catch (error) {
      console.log('GALLERY ERROR:', error);

      Alert.alert(
        'Gallery Error',
        'Unable to open your gallery.'
      );
    }
  };

  // FETCH USER PROFILE
  useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('User not found:', authError);
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('Profile fetch error:', error.message);
        return;
      }

      setFullName(data.full_name);
    };

    fetchUserProfile();
  }, []);

  // FETCH POSTS
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchPosts = async () => {
        try {
          setLoadingPosts(true);

          // GET LOGGED-IN USER
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError) throw authError;

          if (user && isActive) {
            setCurrentUserId(user.id);

            // FETCH USER LIKES
            const { data: likesData, error: likesError } =
              await supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', user.id);

            if (likesError) throw likesError;

            if (isActive) {
              setLikedPostIds(
                likesData?.map(like => like.post_id) || []
              );
            }
          }

          // FETCH POSTS
          const {
            data: postData,
            error: postError,
          } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

          if (postError) throw postError;

          if (!postData || postData.length === 0) {
            if (isActive) {
              setPosts([]);
            }
            return;
          }

          // GET AUTHOR PROFILES
          const userIds = [
            ...new Set(postData.map(post => post.user_id)),
          ];

          const {
            data: profiles,
            error: profileError,
          } = await supabase
            .from('profiles')
            .select('id, full_name, student_number')
            .in('id', userIds);

          if (profileError) throw profileError;

          // GET IMAGE URLS
          const formattedPosts = await Promise.all(
            postData.map(async post => {
              const imagePaths = post.image_paths || [];

              const imageUrls = await Promise.all(
                imagePaths.map(async (path: string) => {
                  const { data, error } = await supabase.storage
                    .from('post-images')
                    .createSignedUrl(path, 3600);

                  if (error) {
                    console.log(
                      'IMAGE URL ERROR:',
                      error.message
                    );
                    return null;
                  }

                  return data.signedUrl;
                })
              );

              // FIND AUTHOR
              const author = profiles?.find(
                profile => profile.id === post.user_id
              );

              const authorCourse =
                author?.student_number
                  ?.split('-')[0]
                  ?.trim()
                  .toUpperCase() || 'Student';

              return {
                ...post,
                author_name: author?.full_name || 'Student',
                author_course: authorCourse,
                image_urls: imageUrls.filter(Boolean),
              };
            })
          );

          if (isActive) {
            setPosts(formattedPosts);
          }
        } catch (error: any) {
          console.log('FETCH POSTS ERROR:', error.message);

          if (isActive) {
            Alert.alert('Error', 'Unable to load posts.');
          }
        } finally {
          if (isActive) {
            setLoadingPosts(false);
          }
        }
      };

      fetchPosts();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // LIKE / UNLIKE POST
  const toggleLike = async (postId: string) => {
    if (!currentUserId) {
      Alert.alert('Error', 'Please login again.');
      return;
    }

    const isLiked = likedPostIds.includes(postId);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId);

        if (error) throw error;

        setLikedPostIds(previous =>
          previous.filter(id => id !== postId)
        );
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: currentUserId,
          });

        if (error) throw error;

        setLikedPostIds(previous => [...previous, postId]);
      }
    } catch (error: any) {
      console.log('LIKE ERROR:', error.message);

      Alert.alert(
        'Error',
        'Unable to update your like. Please try again.'
      );
    }
  };

  // DELETE POST
  const deletePost = async (post: any) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const {
                data: { user },
                error: userError,
              } = await supabase.auth.getUser();

              if (userError || !user) {
                Alert.alert('Error', 'Please login again.');
                return;
              }

              if (post.user_id !== user.id) {
                Alert.alert(
                  'Unauthorized',
                  'You can only delete your own posts.'
                );
                return;
              }

              const { error: deleteError } = await supabase
                .from('posts')
                .delete()
                .eq('id', post.id)
                .eq('user_id', user.id);

              if (deleteError) {
                throw deleteError;
              }

              // DELETE POST IMAGES FROM STORAGE
              if (post.image_paths?.length > 0) {
                const { error: storageError } =
                  await supabase.storage
                    .from('post-images')
                    .remove(post.image_paths);

                if (storageError) {
                  console.log(
                    'STORAGE DELETE ERROR:',
                    storageError.message
                  );
                }
              }

              setPosts(previousPosts =>
                previousPosts.filter(item => item.id !== post.id)
              );

              setSelectedPostId(null);

              Alert.alert(
                'Success',
                'Post deleted successfully!'
              );
            } catch (error: any) {
              console.log('DELETE POST ERROR:', error.message);

              Alert.alert(
                'Error',
                'Unable to delete post. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  // OPEN OTHER USER PROFILES
  const openUserProfile = (userId: string) => {
    router.push({
      pathname: '/user-profile',
      params: {
        userId: userId,
      },
    });
  };

  return (
    <View style={homeStyle.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 90,
        }}
      >
        {/* NAVBAR */}
        <View style={homeStyle.navbar}>
          <View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '600',
                color: '#3ab862',
              }}
            >
              Study First
            </Text>
          </View>

          {/* RIGHT NAV */}
          <View style={homeStyle.rightNavbar}>
            {/* SEARCH ICON */}
            <View>
              <Image
                source={require('../../assets/home-icons/search.png')}
                style={{
                  width: 30,
                  height: 30,
                  resizeMode: 'contain',
                }}
              />
            </View>

            {/* MY PROFILE */}
            <Pressable
              onPress={() => router.replace('/profile')}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#D9D9D9',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 25,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {fullName?.trim()?.charAt(0)?.toUpperCase() || 'S'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* FEED & MY NOTES */}
        <View style={homeStyle.tabsContainer}>
          {/* FEED */}
          <Pressable
            onPress={() => setActiveTab('Feed')}
            style={[
              homeStyle.tabButton,
              activeTab === 'Feed' && homeStyle.activeTab,
            ]}
          >
            <Text
              style={[
                homeStyle.tabText,
                activeTab === 'Feed' && homeStyle.activeTabText,
              ]}
            >
              Feed
            </Text>
          </Pressable>

          {/* MY NOTES */}
          <Pressable
            onPress={() => setActiveTab('My Notes')}
            style={[
              homeStyle.tabButton,
              activeTab === 'My Notes' && homeStyle.activeTab,
            ]}
          >
            <Text
              style={[
                homeStyle.tabText,
                activeTab === 'My Notes' && homeStyle.activeTabText,
              ]}
            >
              My Notes
            </Text>
          </Pressable>
        </View>

        {/* KAPI CONTAINER */}
        <View style={{ marginVertical: 40 }}>
          <View>
            <Text
              style={{
                fontSize: 19,
                marginHorizontal: 13,
              }}
            >
              {new Date().getHours() < 12
                ? 'Good Morning'
                : new Date().getHours() < 18
                  ? 'Good Afternoon'
                  : 'Good Evening'}
              {', '}

              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 19,
                }}
              >
                {fullName || 'Student'}!
              </Text>
            </Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <View
              style={{
                backgroundColor: '#3ab862',
                height: 110,
                justifyContent: 'flex-end',
                marginVertical: 40,
                width: '100%',
              }}
            >
              <Image
                source={require('../../assets/signup/kapi1.png')}
                style={{
                  width: 150,
                  height: 150,
                }}
              />
            </View>

            {/* CHATBOX */}
            <View
              style={{
                position: 'absolute',
                backgroundColor: 'white',
                width: 230,
                height: 105,
                borderRadius: 10,
                right: 20,
                top: 20,
                paddingHorizontal: 10,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  color: '#3ab862',
                  fontWeight: '500',
                  fontSize: 17,
                }}
              >
                Kapi
              </Text>

              <Text
                style={{
                  fontSize: 12,
                  marginVertical: 5,
                  lineHeight: 15,
                }}
              >
                I'm Kapi, your study buddy! Let's share notes,
                learn new things, and make studying easier together.
              </Text>
            </View>
          </View>
        </View>

        {/* FILTERS NAV */}
        <View
          style={{
            marginTop: -50,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              alignItems: 'flex-end',
              marginHorizontal: 10,
            }}
          >
            <Image
              source={require('../../assets/home-icons/filter2.png')}
              style={{
                width: 25,
                height: 25,
              }}
            />
          </View>

          {/* POST SECTION */}
          <View
            style={{
              width: '100%',
              marginVertical: 20,
            }}
          >
            {loadingPosts ? (
              <Text
                style={{
                  textAlign: 'center',
                  padding: 20,
                }}
              >
                Loading posts...
              </Text>
            ) : visiblePosts.length === 0 ? (
              <Text
                style={{
                  textAlign: 'center',
                  color: 'gray',
                  padding: 20,
                }}
              >
                {activeTab === 'My Notes'
                  ? 'You have not shared any notes yet.'
                  : 'No posts yet. Be the first to share!'}
              </Text>
            ) : (
              visiblePosts.map(post => (
                <View
                  key={post.id}
                  style={{
                    width: '100%',
                    marginBottom: 35,
                  }}
                >
                  {/* POST HEADER */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingHorizontal: 10,
                      alignItems: 'center',
                    }}
                  >
                    {/* CLICKABLE AUTHOR PROFILE */}
                    <Pressable
                      onPress={() => openUserProfile(post.user_id)}
                      style={{
                        flexDirection: 'row',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      {/* AUTHOR INITIAL */}
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          backgroundColor: '#D9D9D9',
                          borderRadius: 50,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          {post.author_name?.charAt(0)?.toUpperCase()}
                        </Text>
                      </View>

                      {/* AUTHOR NAME AND COURSE */}
                      <View>
                        <Text
                          style={{
                            fontWeight: '600',
                            fontSize: 14,
                          }}
                        >
                          {post.author_name}
                        </Text>

                        <Text
                          style={{
                            fontSize: 12,
                            color: 'gray',
                          }}
                        >
                          {post.author_course}
                        </Text>
                      </View>
                    </Pressable>

                    {/* DELETE MENU */}
                    {post.user_id === currentUserId && (
                      <Pressable
                        onPress={() =>
                          setSelectedPostId(
                            selectedPostId === post.id
                              ? null
                              : post.id
                          )
                        }
                      >
                        <Image
                          source={require('../../assets/home-icons/summary.png')}
                          style={{
                            width: 35,
                            height: 35,
                          }}
                        />
                      </Pressable>
                    )}
                  </View>

                  {/* DELETE POST OPTION */}
                  {selectedPostId === post.id && (
                    <View style={homeStyle.deleteMenu}>
                      <Pressable
                        onPress={() => deletePost(post)}
                      >
                        <Text style={homeStyle.deleteText}>
                          Delete Post
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* POST IMAGES */}
                  {post.image_urls.map(
                    (imageUrl: string, index: number) => (
                      <Image
                        key={`${post.id}-${index}`}
                        source={{ uri: imageUrl }}
                        style={{
                          width: '100%',
                          height: 400,
                          marginTop: 15,
                        }}
                        resizeMode="contain"
                        onError={e => {
                          console.log(
                            'IMAGE DISPLAY ERROR:',
                            e.nativeEvent
                          );
                        }}
                      />
                    )
                  )}

                  {/* POST CAPTION */}
                  <View
                    style={{
                      padding: 15,
                      width: '100%',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        paddingRight: 10,
                      }}
                    >
                      {post.caption ? (
                        <Text style={{ fontSize: 13 }}>
                          <Text style={{ fontWeight: 'bold' }}>
                            {post.author_name}{' '}
                          </Text>
                          {post.caption}
                        </Text>
                      ) : null}

                      <Text
                        style={{
                          fontSize: 11,
                          color: 'gray',
                          marginTop: 5,
                        }}
                      >
                        {new Date(
                          post.created_at
                        ).toLocaleDateString()}
                      </Text>
                    </View>

                    {/* SHARE AND HEART BUTTONS */}
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 10,
                      }}
                    >
                      {/* SHARE BUTTON */}
                      <Pressable
                        onPress={() => setShowShareModal(true)}
                      >
                        <Image
                          source={require('../../assets/home-icons/share.png')}
                          style={{
                            width: 30,
                            height: 30,
                          }}
                        />
                      </Pressable>

                      {/* HEART BUTTON */}
                      <Pressable onPress={() => toggleLike(post.id)}>
                          <Image
                            source={
                              likedPostIds.includes(post.id)
                                ? require('../../assets/home-icons/hearted.png')
                                : require('../../assets/home-icons/heart.png')
                            }
                            style={{
                              width: 30,
                              height: 30,
                            }}
                          />
                        </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* SHARE SUCCESS MODAL */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 25,
          }}
        >
          <View
            style={{
              width: '100%',
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 25,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#3ab862',
                marginBottom: 12,
              }}
            >
              Success!
            </Text>

            <Text
              style={{
                fontSize: 15,
                color: '#333',
                textAlign: 'center',
                marginBottom: 25,
              }}
            >
              You have successfully shared this post!
            </Text>

            <Pressable
              onPress={() => setShowShareModal(false)}
              style={{
                backgroundColor: '#3ab862',
                paddingVertical: 12,
                paddingHorizontal: 40,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 14,
                }}
              >
                OK
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* KAPI AI FLOATING ICON */}
      <Pressable
        style={homeStyle.kapiButton}
        onPress={() => router.push('/kapi-chat')}
      >
        <Image
          source={require('../../assets/ai/KapiAI.png')}
          style={homeStyle.kapiIcon}
          resizeMode="contain"
        />
      </Pressable>

      {/* BOTTOM NAVBAR */}
      <View style={homeStyle.bottomNavbar}>
        {/* NOTIFICATION */}
        <Pressable
          onPress={() => router.replace('/notification')}
        >
          <Image
            source={require('../../assets/bottomNav/notif.png')}
            style={homeStyle.navIcon}
          />
        </Pressable>

        {/* GROUPS */}
        <Pressable
          onPress={() => router.replace('/groups')}
        >
          <Image
            source={require('../../assets/bottomNav/groups.png')}
            style={homeStyle.navIcon}
          />
        </Pressable>

        {/* NOTES */}
        <Pressable onPress={openGallery}>
          <Image
            source={require('../../assets/bottomNav/notes.png')}
            style={homeStyle.navIcon}
          />
        </Pressable>

        {/* MESSAGE */}
        <Pressable
          onPress={() => router.replace('/message')}
        >
          <Image
            source={require('../../assets/bottomNav/message.png')}
            style={homeStyle.navIcon}
          />
        </Pressable>

        {/* OTHERS */}
        <Pressable
          onPress={() => setShowOthersMenu(!showOthersMenu)}
        >
          <Image
            source={require('../../assets/bottomNav/others.png')}
            style={homeStyle.navIcon}
          />
        </Pressable>
      </View>

      {/* OTHERS POPUP MENU */}
      {showOthersMenu && (
        <View style={homeStyle.othersMenu}>
          <Pressable
            style={homeStyle.leaderboardButton}
            onPress={() => {
              setShowOthersMenu(false);
              router.push('/leaderboard');
            }}
          >
            <Text style={homeStyle.leaderboardText}>
              Leaderboard
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// HOME STYLES
const homeStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 25,
    alignItems: 'center',
    marginVertical: 50,
  },

  rightNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e3e3',
    marginHorizontal: 20,
    marginVertical: -15,
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
  },

  tabButton: {
    width: 158,
    height: 40,
    borderRadius: 20,
    margin: 5,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  activeTab: {
    backgroundColor: 'white',
  },

  tabText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    color: 'gray',
  },

  activeTabText: {
    color: 'black',
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

  deleteMenu: {
    alignSelf: 'flex-end',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 15,
    marginTop: 5,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  deleteText: {
    color: '#D62828',
    fontSize: 14,
    fontWeight: '600',
  },

  kapiButton: {
    position: 'absolute',
    bottom: 85,
    right: 18,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 15,
  },

  kapiIcon: {
    width: 60,
    height: 60,
  },

  othersMenu: {
    position: 'absolute',
    bottom: 80,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 1000,
  },

  leaderboardButton: {
    backgroundColor: '#3ab862',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  leaderboardText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

});