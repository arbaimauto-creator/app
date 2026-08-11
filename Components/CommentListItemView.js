import React, { PureComponent } from 'react';
import T from './Constants/DesignTokens';
import { Alert, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import Preference from 'react-native-default-preference';
import { Button } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import { TouchableOpacity } from 'react-native-gesture-handler';
import IconEntypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UserProfilePicView from '../screens/UserPageScreen/UserProfilePicView';
import APIprovider from './APIprovider';
import Constants from './Constants';
import CommentLikeButton from './CustomComponents/CommentLikeButton';
import ModalMenuButton from './ModalMenuButton';
import Strings from './Strings';
import Utils, { LogoutAlert, isGuestUser } from './utils';

const MODE_COMMENT = 'comment';
const MODE_REVIEW = 'review';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

function CommentOptionButton({ onClicked, onShareClicked }) {
  const menuVisitor = [
    {
      key: 'share_comment',
      name: Strings.SHARE,
      icon: <MaterialCommunityIcons name="share" color={'#000'} size={20} />,
      onClicked: onShareClicked,
    },
    {
      key: 'report_comment',
      name: Strings.REPORT,
      icon: <IconMaterialIcons name="report" color={'#000'} size={20} />,
      onClicked: onClicked,
    },
  ];
  return (
    <ModalMenuButton
      menu={menuVisitor}
      style={{ marginLeft: 10 }}
      buttonView={
        <FastImage
          style={{ width: 16, height: 16 }}
          source={require('../Resources/img/icCommonMore22W.png')}
        />
      }
    />
  );
}

export default class CommentListItemView extends PureComponent {
  static defaultProps = {
    navigation: null,
    data: {
      commentId: null,
      authorId: null,
      authorName: '',
      authorProfilePicUrl: '',
      comment: '',
      postTimestamp: 0,
      rating: 0,
      isLiked: false,
      likes: 0,
    },
    onItemDeleteRequested: (commentId) => {},
    mode: 'comment',
    theme: THEME_LIGHT,
  };

  constructor(props) {
    super(props);

    this.state = {
      isMyComment: false,
      userId: '',
      isLiked: false,
      likes: 0,
    };
  }

  componentDidMount() {
    const comment = this.props.data;
    Preference.get('userId').then((value) => {
      this.setState({ userId: value, isLiked: comment.isLiked, likes: comment.likes });
    });
  }

  deleteCommentCallback() {}

  renderUserAction() {
    return (
      <Button
        title={Strings.REPLAY}
        type="clear"
        titleStyle={styles.userActionButtonTitle}
        containerStyle={styles.userActionButtonContainer}
        buttonStyle={styles.userActionButton}
        onPress={() => {}}
      />
    );
  }

  async handlePressLikeComment(comment) {
    const { contextProps } = this.props;
    if (isGuestUser(contextProps.route.params.logonUserId)) {
      return LogoutAlert(contextProps);
    }

    this.props.setLikeLoading(true);

    const likeCommentResult = await APIprovider.likeReviewComment({
      videoId: comment.targetId,
      commentId: comment._id,
      isLiked: !this.state.isLiked,
    });

    if (likeCommentResult && likeCommentResult.success) {
      const { videoCommentLike } = likeCommentResult;

      this.setState({
        isLiked: videoCommentLike.isLiked,
        likes: videoCommentLike.likes,
      });

      this.props.setLikeLoading(false);
    }

    this.props.setLikeLoading(false);
  }

  render() {
    const { data, type, videoAuthor } = this.props;

    const isSecret =
      type === 'video' &&
      data.isSecret &&
      !(
        data.authorId.toString() === APIprovider.requesterId.toString() ||
        videoAuthor?._id?.toString() === APIprovider.requesterId.toString()
      );

    return (
      <View
        style={{
          paddingHorizontal: 10,
          paddingTop: this.props.recomment ? 0 : 10,
          paddingBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableWithoutFeedback
            onPress={() => {
              this.props.navigation.push('UserPage', {
                pageOwnerUserId: data.authorId,
                pageOwnerUserName: data.authorName,
              });
            }}
          >
            <View>
              <UserProfilePicView
                style={styles.detailsProfilePicUrl}
                source={{ uri: data.authorProfilePicUrl }}
              />
            </View>
          </TouchableWithoutFeedback>
          <View
            style={{
              flex: 1,
              flexDirection: 'column',
              marginLeft: 10,
              marginVertical: this.props.recomment ? 5 : 10,
              marginBottom: isSecret ? 0 : this.props.recomment ? 5 : 10,
            }}
          >
            <TouchableOpacity
              disabled={this.props.onPressComment === undefined}
              onPress={() => {
                if (this.props.onPressComment) {
                  this.props.onPressComment();
                }
              }}
            >
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    color: this.props.theme === THEME_LIGHT ? '#666' : '#999',
                  }}
                >
                  {data.authorName} ·{' '}
                </Text>
                <Text
                  style={{
                    color: this.props.theme === THEME_LIGHT ? '#666' : '#999',
                  }}
                >
                  {Utils.timestampToAgo(data.createdAt)}
                </Text>
                {data.isSecret ? (
                  <FastImage
                    style={{ marginLeft: 5, width: 14, height: 14, marginBottom: 2 }}
                    source={require('../Resources/img/iconRenewal/secret.png')}
                  />
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isSecret ? null : (
                  <Text style={styles.commentText}>
                    {this.props.mentionedName && (
                      <Text
                        style={{ color: Constants.COLOR_MAIN }}
                      >{`@${this.props.mentionedName} `}</Text>
                    )}
                    {data.comment.trim()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            {!isSecret && (this.props.enableRecomment || this.props.recommentCount > 0) ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 2,
                  marginBottom: -10,
                }}
              >
                {this.props.recommentCount > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      if (this.props.onClickMoreComment) {
                        this.props.onClickMoreComment();
                      }
                    }}
                  >
                    <Text style={{ color: '#999', textDecorationLine: 'underline' }}>
                      {Strings.ViewRecomment(this.props.recommentCount)}
                    </Text>
                  </TouchableOpacity>
                )}
                {this.props.enableRecomment && (
                  <TouchableOpacity
                    onPress={() => {
                      if (this.props.onClickRecomment) {
                        this.props.onClickRecomment();
                      }
                    }}
                  >
                    <Text
                      style={{
                        marginLeft: this.props.recommentCount > 0 ? 10 : 0,
                        color: '#999',
                        textDecorationLine: 'underline',
                      }}
                    >
                      {Strings.INPUT_RECOMMENT}
                    </Text>
                  </TouchableOpacity>
                )}
                {/* like comment */}
                <CommentLikeButton
                  isLiked={this.state.isLiked}
                  likes={this.state.likes}
                  marginLeft={5}
                  handlePressLikeComment={() => this.handlePressLikeComment(data)}
                />
              </View>
            ) : this.props.recomment ? (
              <CommentLikeButton
                isLiked={this.state.isLiked}
                likes={this.state.likes}
                handlePressLikeComment={() => this.handlePressLikeComment(data)}
              />
            ) : (
              <Text
                style={{
                  ...styles.commentText,
                  color: T.COLORS.GREY,
                  paddingTop: 5,
                  fontSize: 14,
                }}
              >
                {Strings.SECRET_COMMENT}
              </Text>
            )}
          </View>
          <View style={{ marginRight: 10 }}>
            {this.props.data.authorId === this.state.userId ? (
              <TouchableWithoutFeedback
                onPress={() => {
                  Alert.alert(
                    'Delete ' + this.props.mode,
                    `${Strings.CONFIRM_TO_DELETE_MESSAGE} : ${data.comment}`,
                    [
                      {
                        text: Strings.CANCEL,
                        onPress: () => {},
                        style: 'cancel',
                      },
                      {
                        text: Strings.OK,
                        onPress: () => {
                          this.props.onItemDeleteRequested(data._id);
                        },
                      },
                    ],
                    { cancelable: false },
                  );
                }}
              >
                <IconEntypo name={'cross'} size={18} color={'#666'} />
              </TouchableWithoutFeedback>
            ) : this.props.onClickOption && !isGuestUser(this.state.userId) ? (
              <CommentOptionButton
                onClicked={this.props.onClickOption}
                onShareClicked={this.props.onShareClicked}
              />
            ) : null}
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  userActionButtonTitle: {
    fontWeight: 'bold',
    color: Constants.COLOR_MAIN,
    fontSize: 14,
  },
  userActionButtonContainer: {
    alignItems: 'flex-start',
  },
  userActionButton: {
    flex: 0,
    padding: 0,
  },
  detailsProfilePicUrl: {
    width: 30,
    height: 30,
    borderRadius: 30,
    marginRight: 10,
  },
  secretCommentContainer: {
    backgroundColor: Constants.TIER_COLORS.PIONEER,
    borderWidth: 0.5,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 15,
    marginHorizontal: 5,
  },
  commentText: {
    flex: 1,
    color: T.COLORS.INK,
    fontFamily: Constants.CUSTOM_FONTS.SUIT.MEDIUM,
    fontSize: 14,
  },
});
