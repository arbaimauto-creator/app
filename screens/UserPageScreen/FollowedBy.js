import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import APIprovider from '../../Components/APIprovider';
import T from '../../Components/Constants/DesignTokens';
import { getLanguage } from '../../Components/Strings/index';
import UserProfilePicViewUpdate from './UserProfilePicViewUpdate';

function ENSentence({ followers, showFollower, navigation }) {
  if (followers.length < 3) {
    return (
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 20,
          marginTop: 22,
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', marginRight: followers.length === 1 ? 40 : 55 }}>
          {showFollower.map((follower, idx) => (
            <View key={follower?.class + '_' + idx}>
              <UserProfilePicViewUpdate
                style={styles.userPicture({ length: showFollower.length, idx })}
                source={{ uri: follower.profilePicUrl }}
                class={follower.class}
              />
            </View>
          ))}
        </View>

        <Text style={styles.regularFont}> Followed by </Text>
        {showFollower.map((follower, idx) => (
          <TouchableOpacity
            key={follower.name + '_' + idx}
            style={{ flexDirection: 'row' }}
            onPress={() => {
              navigation.push('UserPage', {
                pageOwnerUserId: follower._id,
                pageOwnerUserName: follower.name,
              });
            }}
          >
            <Text style={styles.boldFont}>
              {follower.name}
              {showFollower.length - 1 !== idx ? ', ' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View
      style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 22, alignItems: 'center' }}
    >
      <View style={{ flexDirection: 'row', marginRight: 55 }}>
        {showFollower.map((follower, idx) => (
          <View key={follower?.class + '_' + idx}>
            <UserProfilePicViewUpdate
              style={styles.userPicture({ length: showFollower.length, idx })}
              source={{ uri: follower.profilePicUrl }}
              class={follower.class}
            />
          </View>
        ))}
      </View>

      <Text style={styles.regularFont}> Followed by </Text>
      {showFollower.map((follower, idx) => (
        <TouchableOpacity
          key={follower.name + '_' + idx}
          style={{ flexDirection: 'row' }}
          onPress={() => {
            navigation.push('UserPage', {
              pageOwnerUserId: follower._id,
              pageOwnerUserName: follower.name,
            });
          }}
        >
          <Text style={styles.boldFont}>
            {follower.name}
            {showFollower.length - 1 !== idx ? ', ' : ''}
          </Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.regularFont}> and </Text>
      <Text style={styles.boldFont}>{followers.length - 2} others</Text>
    </View>
  );
}

function KOSentence({ followers, showFollower, navigation }) {
  if (followers.length < 3) {
    return (
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 20,
          marginTop: 22,
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', marginRight: followers.length === 1 ? 40 : 55 }}>
          {showFollower.map((follower, idx) => (
            <View key={follower?.class + '_' + idx}>
              <UserProfilePicViewUpdate
                style={styles.userPicture({ length: showFollower.length, idx })}
                source={{ uri: follower.profilePicUrl }}
                class={follower.class}
              />
            </View>
          ))}
        </View>

        {showFollower.map((follower, idx) => (
          <TouchableOpacity
            key={follower.name + '_' + idx}
            style={{ flexDirection: 'row' }}
            onPress={() => {
              navigation.push('UserPage', {
                pageOwnerUserId: follower._id,
                pageOwnerUserName: follower.name,
              });
            }}
          >
            <Text style={styles.boldFont}>
              {follower.name}님{showFollower.length - 1 !== idx ? ', ' : ''}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.regularFont}>이 팔로우합니다.</Text>
      </View>
    );
  }

  return (
    <View
      style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 22, alignItems: 'center' }}
    >
      <View style={{ flexDirection: 'row', marginRight: 55 }}>
        {showFollower.map((follower, idx) => (
          <View key={follower?.class + '_' + idx}>
            <UserProfilePicViewUpdate
              style={styles.userPicture({ length: showFollower.length, idx })}
              source={{ uri: follower.profilePicUrl }}
              class={follower.class}
            />
          </View>
        ))}
      </View>

      {showFollower.map((follower, idx) => (
        <TouchableOpacity
          key={follower.name + '_' + idx}
          style={{ flexDirection: 'row' }}
          onPress={() => {
            navigation.push('UserPage', {
              pageOwnerUserId: follower._id,
              pageOwnerUserName: follower.name,
            });
          }}
        >
          <Text style={styles.boldFont}>
            {follower.name}님{showFollower.length - 1 !== idx ? ', ' : ''}
          </Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.regularFont}> 외 </Text>
      <Text style={styles.boldFont}>{followers.length - 2}</Text>
      <Text style={styles.regularFont}> 명이 팔로우합니다.</Text>
    </View>
  );
}

export default function FollowedBy({ user, logonUserId, navigation }) {
  const [followers, setFollowers] = useState([]);
  const [showFollower, setShowFollower] = useState([]);

  useEffect(() => {
    APIprovider.findFollowMatchMe({ myUserId: logonUserId, targetUserId: user.userId }).then(
      (res) => {
        if (res && res.success) {
          setFollowers(res.followersMatchMe);
          setShowFollower(res.followersMatchMe.slice(0, 2));
        }
      },
    );
  }, [logonUserId, user]);

  if (showFollower && !showFollower.length) {
    return null;
  }

  if (getLanguage() === 'ko') {
    return <KOSentence followers={followers} showFollower={showFollower} navigation={navigation} />;
  } else {
    return <ENSentence followers={followers} showFollower={showFollower} navigation={navigation} />;
  }
}

const styles = StyleSheet.create({
  regularFont: {
    color: T.COLORS.GREY,
    fontFamily: T.FONT.Regular,
    fontSize: 11.5,
  },
  boldFont: {
    color: T.COLORS.INK,
    fontFamily: T.FONT.Bold,
    fontSize: 11.5,
  },
  userPicture: ({ idx, length }) => ({
    position: 'absolute',
    width: 30,
    height: 30,
    top: -15,
    left: idx * 15,
    zIndex: length - idx,
  }),
});
