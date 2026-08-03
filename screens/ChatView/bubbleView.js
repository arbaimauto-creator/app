import React from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import IconAntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import APIprovider from '../../Components/APIprovider';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import utils from '../../Components/utils';
import { moderateScale } from '../../Components/utils/scailing';
import UserProfilePicViewUpdate from '../UserPageScreen/UserProfilePicViewUpdate';
import { styles } from './styles';

const MentionText = ({ text, navigation, mentiondUser, right }) => {
  return (
    <View
      style={[
        styles.countText,
        right
          ? { flexDirection: 'row', maxWidth: '80%' }
          : {
              flexDirection: 'row',
            },
      ]}
    >
      {mentiondUser && (
        <TouchableOpacity
          onPress={() => {
            navigation.push('UserPage', {
              pageOwnerUserId: mentiondUser.userId,
              pageOwnerUserName: mentiondUser.name,
              pageOwnerUserProfilePicUrl: mentiondUser.profilePicUrl,
              isPushedPage: true,
            });
          }}
        >
          <Text
            style={{
              color: Constants.COLOR_POINT_BLUE,
              fontFamily: Constants.CUSTOM_FONTS.SUIT.BOLD,
            }}
          >
            @{mentiondUser.name}{' '}
          </Text>
        </TouchableOpacity>
      )}
      <Text style={{ color: 'black', fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM }}>{text}</Text>
    </View>
  );
};

const ChatHeadView = ({ item, navigation }) => {
  return (
    <TouchableOpacity style={{ ...styles.mainContainer }} onPress={() => navigation.pop()}>
      <View style={styles.cellContainer}>
        <MaterialCommunityIcons
          name="chevron-left"
          color={Constants.TIER_COLORS.ARTISAN}
          size={42}
        />
        <UserProfilePicViewUpdate style={styles.profileImage} />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.titleText}>{item?.title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ChatBuble = ({ item, right, user, navigation, setQuestionArray }) => {
  const handlePressDeleteChat = () => {
    Alert.alert(
      Strings.QNA_CHAT_DELETE_TITLE,
      Strings.QNA_CHAT_DELETE_MESSAGE,
      [
        {
          text: Strings.BACK_BUTTON_TITLE,
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: Strings.DELETE,
          onPress: async () => {
            try {
              const removed = await APIprovider.removeQnaChat({
                qnaId: item?.item?.qna,
                chatId: item?.item?._id,
              });

              // console.log(removed);

              if (removed && removed.success) {
                setQuestionArray(removed.updatedQnaChats);
              }
            } catch (err) {
              console.log('removeQnaChat error', err);

              Alert.alert(
                Strings.FAILED_TO_DELETE,
                err.errorMsg ? err.errorMsg : '',
                [{ text: Strings.OK }],
                { cancelable: true },
              );
            }
          },
        },
      ],
      { cancelable: false },
    );
  };

  return (
    <View
      style={{
        alignSelf: !right ? 'flex-start' : 'flex-end',
        marginVertical: 8,
        maxWidth: '90%',
        flexDirection: 'row',
      }}
    >
      {!right && (
        <TouchableOpacity
          onPress={() => {
            navigation.push('UserPage', {
              pageOwnerUserId: item?.item?.author?.userId,
              pageOwnerUserName: item?.item?.author?.name,
              pageOwnerUserProfilePicUrl: item?.item?.author?.profilePicUrl,
              isPushedPage: true,
            });
          }}
        >
          <UserProfilePicViewUpdate
            style={styles.profileImage}
            source={{ uri: item?.item?.author?.profilePicUrl }}
            class={item?.item?.author?.class}
          />
        </TouchableOpacity>
      )}
      <View style={!right ? { marginLeft: 8 } : { marginRight: 8 }}>
        <Text
          style={[
            styles.titleText,
            { color: Constants.TIER_COLORS.ARTISAN, fontSize: moderateScale(14), marginBottom: 4 },
          ]}
        >
          {right ? user?.name : item?.item?.author?.name}
        </Text>
        <View
          style={
            !right
              ? {
                  backgroundColor: Constants.TIER_COLORS.PIONEER,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  borderTopRightRadius: 16,
                }
              : {
                  backgroundColor: Constants.TIER_COLORS.EXPLORER,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  borderTopLeftRadius: 16,
                }
          }
        >
          <MentionText
            text={item?.item?.chat}
            mentiondUser={item?.item?.tagUser}
            navigation={navigation}
            right={right}
          />
          {/* {user?.name === item?.item?.author.name && ( */}
          {right && (
            <TouchableOpacity onPress={() => handlePressDeleteChat()}>
              <IconAntDesign name="close" color={Constants.TIER_COLORS.ARTISAN} size={18} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.dateText}>{utils.timestampToAgo(item?.item?.createdAt)}</Text>
      </View>
      {right && (
        <UserProfilePicViewUpdate
          style={styles.profileImage}
          source={{ uri: user?.profilePicUrl }}
          class={user?.class}
        />
      )}
    </View>
  );
};

const BubblView = ({ item, navigation }) => {
  return (
    <View style={{ flexDirection: 'column', marginHorizontal: 16, flex: 1 }}>
      <FlatList
        data={item?.answer}
        ListHeaderComponent={<ChatHeadView item={item} navigation={navigation} />}
        renderItem={(item) => <ChatBuble item={item} />}
      />
    </View>
  );
};

export default BubblView;
