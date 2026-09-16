import { default as Codes, default as Constants } from '../Constants';
import Strings from '../Strings';
import NotificationProvider from '../utils/NotificationProvider';

const notificationCode = Codes.NOTIFICATION_CODE;

// icon : {imageUrl, shape}, contents : {title, subtitle, action}, action : {actionType, actionIconUrl, onAction}
//const {isRead, icon, contents} = item;

export default class NotificationNomalizer {
  static getNomalizedNotiItem = (pushedNotiParams) => {
    let nomalizedIcon = {};
    let nomalizedContents = {};
    let action = {};
    let navigationParams = {};
    let linkUrl = '';

    if (pushedNotiParams.notificationCode === 214) {
      console.log(pushedNotiParams);
    }

    const notiItem = {
      isRead: pushedNotiParams.isRead,
      id: pushedNotiParams._id,
      notificationCode: pushedNotiParams.notificationCode,
      receiverUserid: pushedNotiParams.receiverId,
      videoId: pushedNotiParams.videoId?._id,
      videoThumbnailUrl: pushedNotiParams.videoId?.thumbnailUrl,
      ratingScore: pushedNotiParams.ratingScore,
      userId: pushedNotiParams.eventMakerId?._id,
      userName: pushedNotiParams.eventMakerId?.name,
      userProfilePicUrl: pushedNotiParams.eventMakerId?.profilePicUrl
        ? pushedNotiParams.eventMakerId.profilePicUrl
        : Constants.NO_USER_URL,
      productTitle: pushedNotiParams.productId?.title,
      productId: pushedNotiParams.productId?._id,
      productThumbnailUrl: pushedNotiParams.productId?.thumbnailUrl,
      productCount: pushedNotiParams.productCount,
      comment: pushedNotiParams.comment,
      reason: pushedNotiParams.reason,
      createdAt: pushedNotiParams.createdAt,
      updatedAt: pushedNotiParams.updatedAt,

      qnaSender: pushedNotiParams.qnaSenderId,
      qnaId: pushedNotiParams.qnaId,
      qnaAuthor: pushedNotiParams.qnaAuthor,
      qnaHost: pushedNotiParams.qnaHost,
      qnaHashtag: pushedNotiParams.qnaHashtag,
      qnaChat: pushedNotiParams.qnaChat,
    };

    // 캠페인 활동 알림 6xx(P2) — 서버 푸시가 같은 코드를 보내면 로컬 파생 알림과 동일 형태·딥링크로
    if (notiItem.notificationCode >= 600 && notiItem.notificationCode < 700) {
      const codeKey = Object.keys(notificationCode).find(
        (k) => notificationCode[k] === notiItem.notificationCode,
      );
      const ctx = {
        title: pushedNotiParams.campaignTitle || pushedNotiParams.title || '',
        brand: pushedNotiParams.brand,
        dayLeft: pushedNotiParams.dayLeft ?? null,
        points: pushedNotiParams.points ?? null,
      };
      const t = Strings[`NOTI_${codeKey}_TITLE`];
      const b = Strings[`NOTI_${codeKey}_BODY`];
      const toActivity = { page: 'MainBottom', params: { screen: 'Activity' } };
      const toLedger = { page: 'RewardLedger', params: undefined };
      const toConsent = { page: 'SecondaryUseConsent', params: undefined };
      const toReuse = { page: 'SecondaryUseStatus', params: undefined };
      const pageOf = {
        CAMPAIGN_REVIEW_RECEIVED: toLedger,
        CAMPAIGN_REWARD_CONFIRMED: toLedger,
        CAMPAIGN_REWARD_PAID: toLedger,
        CAMPAIGN_CONSENT_REQUESTED: toConsent,
        CAMPAIGN_INCENTIVE_APPROVED: toReuse,
        CAMPAIGN_GROUPBUY_REACHED: toReuse,
      };
      return {
        id: notiItem.id,
        local: true,
        isRead: notiItem.isRead,
        notificationCode: notiItem.notificationCode,
        timestamp: notiItem.createdAt,
        createdAt: notiItem.createdAt,
        icon: { imageUrl: pushedNotiParams.thumbnailUrl || Constants.NO_USER_URL, shape: 'square' },
        contents: {
          title: typeof t === 'function' ? t(ctx) : t || codeKey,
          subTitle: typeof b === 'function' ? b(ctx) : b || '',
        },
        navigationParams: pageOf[codeKey] || toActivity,
      };
    }

    const messageTemplete = NotificationProvider.getNotificationByCode(notiItem.notificationCode);
    switch (notiItem.notificationCode) {
      case notificationCode.NEW_RATING_ON_UPLOADED_VIDEO:
        nomalizedIcon.imageUrl = notiItem.userProfilePicUrl;
        nomalizedIcon.shape = 'round';
        nomalizedContents.title = messageTemplete.body(notiItem);
        action.actionType = 'image';
        action.actionIconUrl = notiItem.videoThumbnailUrl;
        nomalizedContents.action = action;
        navigationParams = {
          page: 'VideoPage',
          params: {
            videoId: notiItem.videoId,
          },
        };
        break;
      case notificationCode.NEW_REVIEW_ON_UPLOADED_PRODUCT:
        nomalizedIcon.imageUrl = notiItem.userProfilePicUrl;
        nomalizedIcon.shape = 'round';
        nomalizedContents.title = messageTemplete.body(notiItem);
        action.actionType = 'image';
        action.actionIconUrl = notiItem.productThumbnailUrl;
        nomalizedContents.action = action;
        navigationParams = {
          page: 'ProductPage',
          params: {
            productId: notiItem.productId,
          },
        };
        break;
      case notificationCode.NEW_COMMENT_ON_UPLOADED_VIDEO:
      case notificationCode.NEW_COMMENT_ON_TAGGED_USER:
      case notificationCode.NEW_NESTED_COMMENT_ON_COMMENT:
        nomalizedIcon.imageUrl = notiItem.userProfilePicUrl;
        nomalizedIcon.shape = 'round';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        action.actionType = 'image';
        action.actionIconUrl = notiItem.videoThumbnailUrl;
        nomalizedContents.action = action;
        navigationParams = {
          page: 'VideoPage',
          params: {
            videoId: notiItem.videoId,
          },
        };
        break;
      case notificationCode.NEW_COMMENT_ON_UPLOADED_PRODUCT:
        nomalizedIcon.imageUrl = notiItem.userProfilePicUrl;
        nomalizedIcon.shape = 'round';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        action.actionType = 'image';
        action.actionIconUrl = notiItem.productThumbnailUrl;
        nomalizedContents.action = action;
        navigationParams = {
          page: 'ProductPage',
          params: {
            productId: notiItem.productId,
          },
        };
        break;
      case notificationCode.NEW_FOLLOWER:
        nomalizedIcon.imageUrl = notiItem.userProfilePicUrl;
        nomalizedIcon.shape = 'round';
        nomalizedContents.title = messageTemplete.body(notiItem);
        action.actionType = 'button';
        action.actionIconEnableTitle = Strings.FOLLOW;
        action.actionIconDisableTitle = Strings.FOLLOWING;
        action.onAction = () => {
          // 팔로우하고, 사용자에게 ui 응답!
        };
        nomalizedContents.action = action;
        navigationParams = {
          page: 'UserPage',
          params: {
            pageOwnerUserId: notiItem.userId,
            pageOwnerUserName: notiItem.userName,
          },
        };
        break;
      case notificationCode.NEW_RELAY_REVIEW_ON_UPLOADED_REVIEW:
        nomalizedIcon.imageUrl = notiItem.userProfilePicUrl;
        nomalizedIcon.shape = 'round';
        nomalizedContents.title = messageTemplete.body(notiItem);
        action.actionType = 'image';
        action.actionIconUrl = notiItem.videoThumbnailUrl;
        nomalizedContents.action = action;
        navigationParams = {
          page: 'VideoPage',
          params: {
            videoId: notiItem.videoId,
          },
        };
        break;
      case notificationCode.ORDER_NOT_ACCEPTED:
        nomalizedIcon.imageUrl = notiItem.productThumbnailUrl;
        nomalizedIcon.shape = 'square';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        navigationParams = {
          page: 'MyStore',
          params: {},
        };
        break;
      case notificationCode.ORDER_PREPARING:
        nomalizedIcon.imageUrl = notiItem.productThumbnailUrl;
        nomalizedIcon.shape = 'square';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        navigationParams = {
          page: 'MyOrderList',
          params: {},
        };
        break;
      case notificationCode.ORDER_SHIPPING:
        nomalizedIcon.imageUrl = notiItem.productThumbnailUrl;
        nomalizedIcon.shape = 'square';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        navigationParams = {
          page: 'MyOrderList',
          params: {},
        };
        break;
      case notificationCode.ORDER_SHIPMENT_COMPLETED:
        nomalizedIcon.imageUrl = notiItem.productThumbnailUrl;
        nomalizedIcon.shape = 'square';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        navigationParams = {
          page: 'MyOrderList',
          params: {},
        };
        break;
      case notificationCode.ORDER_PURCHASE_COMPLETED:
        nomalizedIcon.imageUrl = notiItem.productThumbnailUrl;
        nomalizedIcon.shape = 'square';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        navigationParams = {
          page: 'MyStore',
          params: {},
        };
        break;
      case notificationCode.ORDER_CANCEL_REQUEST_BY_SELLER:
        nomalizedIcon.imageUrl = notiItem.productThumbnailUrl;
        nomalizedIcon.shape = 'square';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        navigationParams = {
          page: 'MyOrderList',
          params: {},
        };
        break;
      case notificationCode.ORDER_CANCEL_REQUEST_BY_BUYER:
        nomalizedIcon.imageUrl = notiItem.productThumbnailUrl;
        nomalizedIcon.shape = 'square';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        navigationParams = {
          page: 'MyStore',
          params: {},
        };
        break;
      case notificationCode.ORDER_CANCEL_PENDING_BY_ADMIN:
        nomalizedIcon.imageUrl = notiItem.productThumbnailUrl;
        nomalizedIcon.shape = 'square';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        navigationParams = {
          page: 'MyStore',
          params: {},
        };
        break;
      case notificationCode.ORDER_CANCEL_FINISHED:
        nomalizedIcon.imageUrl = notiItem.productThumbnailUrl;
        nomalizedIcon.shape = 'square';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        navigationParams = {
          page: 'MyStore',
          params: {},
        };
        break;
      case notificationCode.ORDER_PURCHASE_COMPLETED_AUTOMATICALLY:
        nomalizedIcon.imageUrl = notiItem.productThumbnailUrl;
        nomalizedIcon.shape = 'square';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        break;
      // case notificationCode.REVIEW_REWARD_FUNDED:
      //     nomalizedContents.title = messageTemplete.body(notiItem);
      //     break;
      // case notificationCode.REVIEW_REWARD_WITHDRAWAL:
      //     nomalizedContents.title = messageTemplete.body(notiItem);
      //     break;
      case notificationCode.USER_WITHDRAWAL_ACCEPTED:
        nomalizedContents.title = messageTemplete.body(notiItem);
        break;
      case notificationCode.USER_WITHDRAWAL_REJECTED:
        nomalizedContents.title = messageTemplete.body(notiItem);
        break;
      case notificationCode.USER_WITHDRAWAL_FINISHED:
        nomalizedContents.title = messageTemplete.body(notiItem);
        break;

      case notificationCode.APPROVAL_SELLER_REGISTER:
        nomalizedContents.title = messageTemplete.body(notiItem);
        break;

      case notificationCode.QNA_HASHTAG_CREATED:
        nomalizedIcon.imageUrl = notiItem?.qnaSender?.profilePicUrl; //notiItem.userProfilePicUrl;
        nomalizedIcon.shape = 'round';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        action.actionType = 'image';
        nomalizedContents.action = action;
        navigationParams = {
          // page: 'UserPage',
          // params: {
          //   pageOwnerUserId: notiItem.userId,
          //   pageOwnerUserName: notiItem.userName,
          //   pageOwnerUserProfilePicUrl: notiItem.userProfilePicUrl,
          //   isPushedPage: false,
          // },
          page: 'QNAChat',
          params: {
            qnaId: notiItem.qnaId,
          },
        };

        break;
      case notificationCode.QNA_CHAT_CREATED:
        nomalizedIcon.imageUrl = notiItem?.qnaSender?.profilePicUrl; //notiItem.userProfilePicUrl;
        nomalizedIcon.shape = 'round';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        action.actionType = 'image';
        nomalizedContents.action = action;
        navigationParams = {
          page: 'QNAChat',
          params: {
            qnaId: notiItem.qnaId,
          },
        };
        break;
      case notificationCode.QNA_CHAT_MENTIONED:
        nomalizedIcon.imageUrl = notiItem?.qnaSender?.profilePicUrl; //notiItem.userProfilePicUrl;
        nomalizedIcon.shape = 'round';
        nomalizedContents.title = messageTemplete.title(notiItem);
        nomalizedContents.subTitle = messageTemplete.body(notiItem);
        action.actionType = 'image';
        nomalizedContents.action = action;
        navigationParams = {
          page: 'QNAChat',
          params: {
            qnaId: notiItem.qnaId,
          },
        };
        break;
      // Push messages to reviewers after User purchase an item through a review
      case notificationCode.ORDER_PURCHASE_ALARM_TO_REVIEWER:
        nomalizedIcon.imageUrl = pushedNotiParams?.eventMakerId.profilePicUrl;
        nomalizedIcon.shape = 'round';
        nomalizedContents.title = messageTemplete.title(pushedNotiParams);
        nomalizedContents.subTitle = messageTemplete.body(pushedNotiParams);
        action.actionType = 'image';
        nomalizedContents.action = action;
        navigationParams = {
          page: 'UserPage',
          params: {
            pageOwnerUserId: pushedNotiParams.eventMakerId._id,
            pageOwnerUserName: pushedNotiParams.eventMakerId.name,
          },
        };
        break;
      case notificationCode.SERVER_SIDE_NOTIFICATION:
        nomalizedIcon.imageUrl = pushedNotiParams.imageUrl;
        nomalizedIcon.shape = pushedNotiParams?.shape || 'square'; //'round';
        nomalizedContents.title = pushedNotiParams.title;
        nomalizedContents.subTitle = pushedNotiParams.message;
        action.actionType = 'image';
        nomalizedContents.action = action;
        navigationParams = pushedNotiParams.navigationParams;
        action.actionIconUrl = pushedNotiParams.rightImageUrl;
        break;
    }
    return {
      isRead: notiItem.isRead,
      icon: nomalizedIcon,
      contents: nomalizedContents,
      timestamp: notiItem.createdAt,
      navigationParams: navigationParams,
    };
  };
}

// NEW_RATING_ON_UPLOADED_VIDEO: 101,
// NEW_REVIEW_ON_UPLOADED_PRODUCT: 102,
// NEW_COMMENT_ON_UPLOADED_VIDEO: 103,
// NEW_COMMENT_ON_UPLOADED_PRODUCT: 104,
// NEW_BOOKMARK_ON_UPLOADED_VIDEO: 105,
// NEW_BOOKMARK_ON_UPLOADED_PRODUCT: 106,
// NEW_LINKED_VIDEO_ON_UPLOADED_PRODUCT: 107,
// NEW_FOLLOWER: 110,
// NEW_RELAY_REVIEW_ON_UPLOADED_REVIEW: 112,
// ORDER_NOT_ACCEPTED: 202,
// ORDER_PREPARING: 203,
// ORDER_SHIPPING: 204,
// ORDER_SHIPMENT_COMPLETED: 205,
// ORDER_PURCHASE_COMPLETED: 206,
// ORDER_REJECTED: 207,
// ORDER_PURCHASE_CANCELED: 208,
// ORDER_PURCHASE_COMPLETED_AUTOMATICALLY: 209,
// REVIEW_REWARD_FUNDED: 301,
// REVIEW_REWARD_WITHDRAWAL: 302,
