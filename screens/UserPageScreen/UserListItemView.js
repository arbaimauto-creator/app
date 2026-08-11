import React, { PureComponent } from 'react';
import T from '../../Components/Constants/DesignTokens';
import { StyleSheet, Text, TouchableNativeFeedback, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Constants from '../../Components/Constants';
import Strings from '../../Components/Strings';
import UserProfilePicView from './UserProfilePicView';

const VIEW_TYPE = {
  GRADE_GIVEN: 'grade',
  HORIZONTAL_LIST: 'list_horizontal',
};

function FollowButton({ onPress, isFollowing }) {
  return (
    <TouchableOpacity onPress={onPress} background={TouchableNativeFeedback.Ripple('#777', true)}>
      <View style={isFollowing ? styles.followingButton : styles.followButton}>
        <Text
          style={{
            color: isFollowing ? T.COLORS.INK : 'white',
            fontWeight: '600',
          }}
        >
          {isFollowing ? Strings.FOLLOWING : Strings.FOLLOW}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default class UserListItemView extends PureComponent {
  static defaultProps = {
    user: {
      userId: '',
      name: '',
      profilePicUrl: '',
      introduction: '',
      class: 0,
    },
    onPress: () => {},
  };

  constructor(props) {
    super(props);
  }

  // shouldComponentUpdate() {
  //   return false;
  // }

  onPressed() {
    // console.log('userlist', this.props.isShownFilterSelector);
    if (!this.props?.isShownFilterSelector) {
      const { user, mode = '' } = this.props;
      if (this.props.onPress() !== false) {
        this.props.navigation.push('UserPage', {
          pageOwnerUserId: user.userId,
          pageOwnerUserName: user.name,
          pageOwnerUserProfilePicUrl: user.profilePicUrl,
          isPushedPage: true,
        });
      }
    }
  }

  render() {
    const { user, mode = '' } = this.props;

    if (mode === VIEW_TYPE.GRADE_GIVEN) {
      return (
        <TouchableNativeFeedback onPress={this.onPressed.bind(this)} activeOpacity={0.9}>
          <View style={styles.containerGrade}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <UserProfilePicView
                style={styles.profilePicSmall}
                source={{ uri: user.profilePicUrl }}
                class={user.class}
                g6AvgRatingScore={user.g6AvgRatingScore}
                g6RatingCount={user.g6RatingCount}
              />
              <View style={{ marginLeft: 13 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.userNameGrade}>{user.name}</Text>
                </View>
                <Text style={styles.userFollower}>
                  {Strings.FOLLOWER_COUNT(user.followerCount)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableNativeFeedback>
      );
    } else if (mode === VIEW_TYPE.HORIZONTAL_LIST) {
      return (
        <View style={{ flex: 1 }}>
          <View
            style={
              this.props.backgroundBox
                ? {
                    justifyContent: 'center',
                    marginRight: 3,
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 5,
                    // backgroundColor: '#212121',
                    paddingVertical: 20,
                  }
                : {
                    justifyContent: 'center',
                    marginRight: 3,
                    flexDirection: 'column',
                    alignItems: 'center',
                  }
            }
          >
            <TouchableNativeFeedback onPress={this.onPressed.bind(this)} activeOpacity={0.9}>
              <View>
                <UserProfilePicView
                  style={styles.profilePicBigest}
                  source={{ uri: user.profilePicUrl }}
                  class={user.class}
                  showGrade
                  g6AvgRatingScore={user.g6AvgRatingScore}
                  g6RatingCount={user.g6RatingCount}
                  outline={this.props.outline}
                />
                <View
                  style={{
                    alignItems: 'center',
                    marginTop: 20,
                    width: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH - 10,
                  }}
                >
                  <Text
                    style={{
                      ...styles.userName,
                    }}
                    ellipsizeMode={'tail'}
                    numberOfLines={1}
                  >
                    {user.name}
                  </Text>
                  <Text style={styles.userFollower}>
                    {`${user.g6RatingCount ? user.g6RatingCount : 0} ${Strings.GRADE_COUNT_TITLE}`}
                  </Text>
                </View>
              </View>
            </TouchableNativeFeedback>
            {/* TODO: following 여부를 리스트에서는 안 넘겨 줌*/}
            {/* <FollowButton
              isFollowing={user.isFollowing}
              onPress={() => {
                const isFollow = !user.isFollowing ? true : false
                Vibration.vibrate(Constants.VIBRATION_USER_ACTION)
                APIprovider.followUser(user.userId, isFollow)
                .then((res) => {
                  if (res.result === 1) {
                    context.setState({
                      user: {
                        ...user,
                        isFollowing: isFollow,
                        followerCount: user.followerCount + (isFollow ? 1 : -1)
                      }
                    })
                  }
                })
                .catch((err) => {
                  console.log(err)
                  Alert.alert(
                      Strings.FAILED_TO_FOLLOW,
                      err.errorMsg ? err.errorMsg : "",
                      [ { text: Strings.OK }],
                      { cancelable: true }
                  )
                })
              }}
            /> */}
          </View>
        </View>
      );
    } else {
      return (
        <TouchableNativeFeedback onPress={this.onPressed.bind(this)} activeOpacity={0.9}>
          <View style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <UserProfilePicView
                style={styles.profilePicBig}
                source={{ uri: user.profilePicUrl }}
                class={user.class}
                showGrade
                g6AvgRatingScore={user.g6AvgRatingScore}
                g6RatingCount={user.g6RatingCount}
              />
              <View style={{ marginLeft: 13, width: '65%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.userName}>{user.name}</Text>
                </View>
                {user.introduction !== '' && (
                  <Text numberOfLines={2} style={styles.userIntroduction} ellipsizeMode="tail">
                    {user.introduction}
                  </Text>
                )}
                <Text style={styles.userFollower}>
                  {Strings.FOLLOWER_COUNT(user.followerCount)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableNativeFeedback>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  containerGrade: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  profilePicSmall: {
    width: 50,
    height: 50,
  },
  profilePicBig: {
    width: 90,
    height: 90,
  },
  profilePicBigest: {
    width: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH - 10,
    height: Constants.PRODUCT_GRID_LIST_ITEM_VIEW_WIDTH - 10,
  },
  userName: {
    color: T.COLORS.INK,
    // fontSize: 15,
    fontSize: 16,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
  },
  userIntroduction: {
    color: '#666',
    fontSize: 14,
  },
  userFollower: {
    // color: '#666',
    // color: '#999',
    color: T.COLORS.GREY,
    fontSize: 14,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.REGULAR,
  },
  userNameGrade: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: 'bold',
    color: T.COLORS.INK,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: '#313131',
  },
  followingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
});
