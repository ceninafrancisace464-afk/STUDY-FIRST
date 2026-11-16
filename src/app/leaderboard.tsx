
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type LeaderboardUser = {
  id: string;
  full_name: string;
  student_number: string;
  total_notes: number;
};

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  // GET COURSE ABBREVIATION ONLY
  const getCourse = (studentNumber: string) => {
    const course = studentNumber
      ?.trim()
      .split('-')[0]
      .replace(/[0-9]/g, '')
      .toUpperCase();

    if (['IT', 'ED', 'OA', 'CS'].includes(course)) {
      return course;
    }

    return '';
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // FETCH LEADERBOARD
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      // GET ALL POSTS
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('user_id');

      if (postsError) throw postsError;

      // COUNT POSTS PER USER
      const noteCounts: { [key: string]: number } = {};

      posts?.forEach((post) => {
        if (post.user_id) {
          noteCounts[post.user_id] =
            (noteCounts[post.user_id] || 0) + 1;
        }
      });

      // GET PROFILES
      const { data: profiles, error: profilesError } =
        await supabase
          .from('profiles')
          .select('id, full_name, student_number');

      if (profilesError) throw profilesError;

      // COMBINE PROFILE INFORMATION AND NOTE COUNTS
      const leaderboard = (profiles || [])
        .map((profile) => ({
          id: profile.id,
          full_name: profile.full_name || 'Unknown User',
          student_number: profile.student_number || '',
          total_notes: noteCounts[profile.id] || 0,
        }))
        .filter((user) => user.total_notes > 0)
        .sort((a, b) => b.total_notes - a.total_notes);

      setUsers(leaderboard);

    } catch (error) {
      console.log('Leaderboard Error:', error);

      Alert.alert(
        'Error',
        'Unable to load leaderboard. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const topThree = [
    users[1],
    users[0],
    users[2],
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* NAVBAR */}
        <View style={styles.navbar}>
          <Pressable onPress={() => router.replace('/home')}>
            <Image
              source={require('../../assets/signup/arrow-2.png')}
              style={{ width: 40, height: 40 }}
            />
          </Pressable>
        </View>

        {/* LOGO AND TODAY */}
        <View>
          <View style={{ alignItems: 'center' }}>
            <Image
              source={require('../../assets/leaderboard-icons/logo.png')}
              style={{
                width: 350,
                height: 160,
                resizeMode: 'contain',
              }}
            />
          </View>

          <View style={styles.todayContainer}>
            <Image
              source={require('../../assets/leaderboard-icons/calendar.png')}
              style={{ width: 40, height: 40 }}
            />

            <Text style={styles.todayText}>Today</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3ab862"
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            {/* TOP 3 */}
            <View style={styles.topThreeContainer}>
              {topThree.map((user, index) => {
                if (!user) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={[
                        styles.todayBox,
                        index === 1
                          ? null
                          : { marginTop: 15 },
                      ]}
                    />
                  );
                }

                const rank =
                  index === 0 ? 2 : index === 1 ? 1 : 3;

                const rankColor =
                  rank === 1
                    ? '#F0F363'
                    : rank === 2
                    ? '#D9D9D9'
                    : '#E85816';

                return (
                  <View
                    key={user.id}
                    style={[
                      styles.todayBox,
                      index !== 1 && { marginTop: 15 },
                    ]}
                  >
                    <View
                      style={{
                        backgroundColor: rankColor,
                        width: 40,
                        height: 40,
                        borderRadius: 55,
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={styles.rankNumber}>
                        {rank}
                      </Text>
                    </View>

                    <Text
                      style={styles.topName}
                      numberOfLines={1}
                    >
                      {user.full_name}
                    </Text>

                    <Text style={styles.noteCount}>
                      {user.total_notes} Notes
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* TABLE HEADER */}
            <View style={styles.navbarPoints}>
              <Text style={styles.headerText}>#</Text>
              <Text style={styles.headerText}>Name</Text>
              <Text style={styles.headerText}>Notes</Text>
            </View>

            {/* OTHER USERS */}
            <View style={styles.userContainer}>
              {users.length > 3 ? (
                users.slice(3).map((user, index) => (
                  <View
                    key={user.id}
                    style={styles.leaderboardUserContainer}
                  >
                    <View style={styles.userInfo}>
                      {/* RANK */}
                      <Text style={styles.userRank}>
                        {index + 4}
                      </Text>

                      {/* DEFAULT PROFILE AVATAR */}
                      <View style={styles.avatar}>
                        <Text style={styles.avatarInitial}>
                          {user.full_name
                            ?.trim()
                            ?.charAt(0)
                            ?.toUpperCase() || 'S'}
                        </Text>
                      </View>

                      {/* USER INFORMATION */}
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1}>
                          {user.full_name}
                        </Text>

                        {/* COURSE ONLY */}
                        <Text style={styles.studentNumber}>
                          {getCourse(user.student_number)}
                        </Text>
                      </View>
                    </View>

                    {/* TOTAL NOTES */}
                    <Text style={styles.noteCount}>
                      {user.total_notes}
                    </Text>
                  </View>
                ))
              ) : users.length === 0 ? (
                <Text style={styles.emptyText}>
                  No notes posted yet.
                </Text>
              ) : null}
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },

  navbar: {
    marginTop: 60,
    marginHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },

  todayContainer: {
    backgroundColor: '#7df3a2',
    height: 55,
    marginHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },

  todayText: {
    color: '#3ab862',
    fontSize: 20,
    fontWeight: '400',
  },

  topThreeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    flexDirection: 'row',
    gap: 10,
  },

  todayBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: 110,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },

  rankNumber: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },

  topName: {
    fontWeight: 'bold',
    marginTop: 15,
    fontSize: 12,
    textAlign: 'center',
  },

  studentNumber: {
    color: 'red',
    fontSize: 12,
  },

  noteCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  navbarPoints: {
    backgroundColor: '#7df3a2',
    margin: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 35,
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 20,
  },

  headerText: {
    fontSize: 14,
    fontWeight: '600',
  },

  userContainer: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 30,
  },

  leaderboardUserContainer: {
    backgroundColor: 'white',
    minHeight: 65,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  userInfo: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    flex: 1,
  },

  userRank: {
    fontSize: 20,
    fontWeight: '500',
    width: 20,
  },

  // SAME DEFAULT PROFILE DESIGN AS profile.tsx
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});
