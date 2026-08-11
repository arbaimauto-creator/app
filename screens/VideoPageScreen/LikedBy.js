import React, { useEffect, useState } from 'react';
import T from '../../Components/Constants/DesignTokens';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import { getLanguage } from '../../Components/Strings/index';
import UserProfilePicViewUpdate from '../UserPageScreen/UserProfilePicViewUpdate';

function KOSentence({ likers, showLiker, navigation, setModalVisible }) {
  if (!likers.length) {
    return null;
  }

  if (!showLiker.length) {
    return (
      <View style={styles.likersContainer}>
        <Text style={styles.regularFont}>{likers.length}명이 좋아합니다.</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.regularFont}>{likers.length}명이 좋아합니다.</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showLiker.length === 1 && likers.length === showLiker.length) {
    return (
      <View style={styles.likersContainer}>
        <View style={{ flexDirection: 'row', marginRight: 40 }}>
          {showLiker.map((liker, idx) => (
            <View key={liker?.class + '_' + idx}>
              <UserProfilePicViewUpdate
                style={styles.userPicture({ length: showLiker.length, idx })}
                source={{ uri: liker.userId.profilePicUrl }}
                class={liker.userId.class}
              />
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={{ flexDirection: 'row' }}
          onPress={() => {
            navigation.push('UserPage', {
              pageOwnerUserId: showLiker[0].userId._id,
              pageOwnerUserName: showLiker[0].userId.name,
            });
          }}
        >
          <Text style={styles.boldFont}>{showLiker[0].userId.name}님</Text>
        </TouchableOpacity>
        <Text style={styles.regularFont}>이 좋아합니다.</Text>
        {/* <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.viewAllText}>모두 보기</Text>
        </TouchableOpacity> */}
      </View>
    );
  }

  return (
    <View style={styles.likersContainer}>
      <View style={{ flexDirection: 'row', marginRight: showLiker.length === 1 ? 40 : 55 }}>
        {showLiker.map((liker, idx) => (
          <View key={liker?.class + '_' + idx}>
            <UserProfilePicViewUpdate
              style={styles.userPicture({ length: showLiker.length, idx })}
              source={{ uri: liker.userId.profilePicUrl }}
              class={liker.userId.class}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={{ flexDirection: 'row' }}
        onPress={() => {
          navigation.push('UserPage', {
            pageOwnerUserId: showLiker[0].userId._id,
            pageOwnerUserName: showLiker[0].userId.name,
          });
        }}
      >
        <Text style={styles.boldFont}>{showLiker[0].userId.name}님</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={{ flexDirection: 'row' }}>
        <Text style={styles.regularFont}> 외 </Text>
        <Text style={styles.boldFont}>{likers.length - 1}명</Text>
        <Text style={styles.regularFont}>이 좋아합니다.</Text>
      </TouchableOpacity>
    </View>
  );
}

function ENSentence({ likers, showLiker, navigation, setModalVisible }) {
  if (!likers.length) {
    return null;
  }

  if (!showLiker.length) {
    return (
      <View style={styles.likersContainer}>
        <Text style={styles.regularFont}>{likers.length} likes</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          {/* <Text style={styles.viewAllText}>View All</Text> */}
        </TouchableOpacity>
      </View>
    );
  }

  if (showLiker.length === 1 && likers.length === showLiker.length) {
    return (
      <View style={styles.likersContainer}>
        <View style={{ flexDirection: 'row', marginRight: 40 }}>
          {showLiker.map((liker, idx) => (
            <View key={liker?.class + '_' + idx}>
              <UserProfilePicViewUpdate
                style={styles.userPicture({ length: showLiker.length, idx })}
                source={{ uri: liker.userId.profilePicUrl }}
                class={liker.userId.class}
              />
            </View>
          ))}
        </View>

        <Text style={styles.regularFont}>Liked by</Text>
        <TouchableOpacity
          style={{ flexDirection: 'row' }}
          onPress={() => {
            navigation.push('UserPage', {
              pageOwnerUserId: showLiker[0].userId._id,
              pageOwnerUserName: showLiker[0].userId.name,
            });
          }}
        >
          <Text style={styles.boldFont}> {showLiker[0].userId.name}</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity> */}
      </View>
    );
  }

  return (
    <View style={styles.likersContainer}>
      <View style={{ flexDirection: 'row', marginRight: showLiker.length === 1 ? 40 : 55 }}>
        {showLiker.map((liker, idx) => (
          <View key={liker?.class + '_' + idx}>
            <UserProfilePicViewUpdate
              style={styles.userPicture({ length: showLiker.length, idx })}
              source={{ uri: liker.userId.profilePicUrl }}
              class={liker.userId.class}
            />
          </View>
        ))}
      </View>

      <Text style={styles.regularFont}>Liked by</Text>
      <TouchableOpacity
        style={{ flexDirection: 'row' }}
        onPress={() => {
          navigation.push('UserPage', {
            pageOwnerUserId: showLiker[0].userId._id,
            pageOwnerUserName: showLiker[0].userId.name,
          });
        }}
      >
        <Text style={styles.boldFont}> {showLiker[0].userId.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={{ flexDirection: 'row' }}>
        <Text style={styles.regularFont}> and </Text>
        <Text style={styles.boldFont}>{likers.length - 1}</Text>
        <Text style={styles.regularFont}> others</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LikedBy({ videoId, logonUserId, navigation, likes }) {
  const [likers, setLikers] = useState([]);
  const [showLiker, setShowLiker] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    APIprovider.findReviewLikers({ videoId, myUserId: logonUserId }).then((result) => {
      if (result && result.success) {
        setLikers(result.reviewLikers);
        setShowLiker(
          result.reviewLikers
            .filter((showLikers) => showLikers.userId._id !== logonUserId)
            .slice(0, 2),
        );
      }
    });
  }, [logonUserId, videoId, likes]);

  const renderLikerItem = ({ item }) => (
    <View style={styles.likerItem}>
      <UserProfilePicViewUpdate
        style={styles.userPictureList({ length: likers.length, idx: 0 })}
        source={{ uri: item.userId.profilePicUrl }}
        class={item.userId.class}
      />
      <TouchableOpacity
        style={{ flexDirection: 'row' }}
        onPress={() => {
          navigation.push('UserPage', {
            pageOwnerUserId: item.userId._id,
            pageOwnerUserName: item.userId.name,
          });
          setModalVisible(false);
        }}
      >
        <Text style={styles.boldFontWithMargin}>{item.userId.name}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Likers</Text>
            <FlatList
              data={likers}
              renderItem={renderLikerItem}
              keyExtractor={(liker) => liker.userId._id}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {getLanguage() === 'ko' ? (
        <KOSentence
          likers={likers}
          showLiker={showLiker}
          navigation={navigation}
          setModalVisible={setModalVisible}
        />
      ) : (
        <ENSentence
          likers={likers}
          showLiker={showLiker}
          navigation={navigation}
          setModalVisible={setModalVisible}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  boldFontWithMargin: {
    position: 'relative',
    height: 30,
    top: 5,
    color: T.COLORS.INK,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
    marginLeft: 10,
  },
  regularFont: {
    color: T.COLORS.GREY,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.REGULAR_4,
  },
  boldFont: {
    color: T.COLORS.INK,
    fontFamily: Constants.CUSTOM_FONTS.SCDREAM.MEDIUM_5,
  },
  userPicture: ({ idx, length }) => ({
    position: 'absolute',
    width: 30,
    height: 30,
    top: -15,
    left: idx * 15,
    zIndex: length - idx,
  }),
  userPictureList: ({ idx, length }) => ({
    position: 'relative',
    width: 30,
    height: 30,
    left: idx * 15,
    zIndex: length - idx,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  likersContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 15,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  likerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: T.COLORS.GREY,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
  },
  viewAllText: {
    color: T.COLORS.GREY,
    marginTop: 10,
  },
});
