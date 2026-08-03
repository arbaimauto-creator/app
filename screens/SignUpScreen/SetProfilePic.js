import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import Strings from '../../Components/Strings';
import utils from '../../Components/utils';
import UserProfilePicView from '../UserPageScreen/UserProfilePicView';
import styles from './styles';

export default function SetProfilePic({ context }) {
  return (
    <View style={styles.fieldContainer}>
      <TouchableOpacity
        onPress={() => {
          utils
            .checkPermissionToAccessGallery()
            .then(() => context.openPicker())
            .catch((err) => Alert.alert(err));
        }}
      >
        <UserProfilePicView
          style={styles.profilePic}
          source={{ uri: context.state.profilePicUri }}
        />
        <Text style={styles.profilePicTitle}>{Strings.SET_PROFILE_IMAGE}</Text>
      </TouchableOpacity>
    </View>
  );
}
