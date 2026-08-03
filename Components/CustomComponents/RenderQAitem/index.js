import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import UserProfilePicViewUpdate from '../../../screens/UserPageScreen/UserProfilePicViewUpdate';
import styles from './styles';
const RenderQAitem = ({ item, navigation }) => {
  return (
    <View style={{ flexDirection: 'column' }}>
      <TouchableOpacity
        style={styles.mainContainer}
        onPress={() => navigation.navigate('ChatView', { item })}
      >
        <View style={styles.cellContainer}>
          <UserProfilePicViewUpdate style={styles.profileImage} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.titleText}>{item?.title}</Text>
            <Text style={styles.descriptionText}>{item?.title}</Text>
          </View>
        </View>
        <View style={styles.rightContainer}>
          <View style={styles.rightViewContainer}>
            <Text style={styles.countText}>{item.count}</Text>
          </View>
          <Text style={styles.dateText}>{'2022.11.09'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default RenderQAitem;
