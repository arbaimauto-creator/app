import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IconAntDesign from 'react-native-vector-icons/AntDesign';
import { styles } from '../../../screens/ChatView/styles';
import UserProfilePicViewUpdate from '../../../screens/UserPageScreen/UserProfilePicViewUpdate';
import Constants from '../../Constants';

export default function ShowParticipants({
  currentQnaParticipants,
  setShowParticipants,
  navigation,
}) {
  return (
    <View style={style.showParticipantsContainer}>
      <FlatList
        data={currentQnaParticipants}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            key={item.id + '_' + index}
            style={style.participant}
            onPress={() => {
              navigation.push('UserPage', {
                pageOwnerUserId: item.userId,
                pageOwnerUserName: item.name,
                pageOwnerUserProfilePicUrl: item.profilePicUrl,
                isPushedPage: true,
              });
            }}
          >
            <UserProfilePicViewUpdate
              style={{ ...styles.profileImage, marginRight: 10 }}
              source={{ uri: item?.profilePicUrl }}
              class={item?.class}
            />
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={{ marginTop: 5 }} onPress={() => setShowParticipants(false)}>
        <IconAntDesign name="close" color={Constants.TIER_COLORS.ARTISAN} size={30} />
      </TouchableOpacity>
    </View>
  );
}

const style = StyleSheet.create({
  showParticipantsContainer: {
    // top: '-40%',
    top: '10%',
    left: '10%',
    position: 'absolute',
    backgroundColor: Constants.TIER_COLORS.STRIVER,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderColor: Constants.TIER_COLORS.ARTISAN,
    borderWidth: 6,
    maxHeight: 200,
    zIndex: 1,
    flexDirection: 'row',
    width: '80%',
  },
  participant: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
});
