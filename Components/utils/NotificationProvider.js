import Strings from '../Strings';
import Codes from '../Constants';

const notificationCode = Codes.NOTIFICATION_CODE;

const notificationContentsMap = new Map([
  [
    notificationCode.NEW_RATING_ON_UPLOADED_VIDEO,
    {
      title: Strings.NEW_RATING_ON_UPLOADED_REVIEW_TITLE,
      body: Strings.NEW_RATING_ON_UPLOADED_REVIEW_BODY,
      image: (params) => {
        return params.videoThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.NEW_REVIEW_ON_UPLOADED_PRODUCT,
    {
      title: Strings.NEW_LINKED_REVIEW_ON_UPLOADED_PRODUCT_TITLE,
      body: Strings.NEW_LINKED_REVIEW_ON_UPLOADED_PRODUCT_BODY,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.NEW_COMMENT_ON_UPLOADED_VIDEO,
    {
      title: Strings.NEW_COMMENT_ON_UPLOADED_REVIEW_TITLE,
      body: Strings.NEW_COMMENT_ON_UPLOADED_REVIEW_BODY,
      image: (params) => {
        return params.videoThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.NEW_COMMENT_ON_UPLOADED_PRODUCT,
    {
      title: Strings.NEW_COMMENT_ON_UPLOADED_PRODUCT_TITLE,
      body: Strings.NEW_COMMENT_ON_UPLOADED_PRODUCT_BODY,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.NEW_FOLLOWER,
    {
      title: Strings.NEW_FOLLOWER_TITLE,
      body: Strings.NEW_FOLLOWER_BODY,
      image: (params) => {
        return params.userProfilePicUrl;
      },
    },
  ],
  [
    notificationCode.NEW_RELAY_REVIEW_ON_UPLOADED_REVIEW,
    {
      title: Strings.NEW_RELAY_REVIEW_ON_UPLOADED_REVIEW_TITLE,
      body: Strings.NEW_RELAY_REVIEW_ON_UPLOADED_REVIEW_BODY,
      image: (params) => {
        return params.relayVideoThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.ORDER_NOT_ACCEPTED,
    {
      title: Strings.ORDER_NOT_ACCEPTED_TITLE,
      body: Strings.ORDER_A_PRODUCT_AND_OTHERS,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.ORDER_PREPARING,
    {
      title: Strings.ORDER_PREPARING_TITLE,
      body: Strings.ORDER_A_PRODUCT_AND_OTHERS,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.ORDER_SHIPPING,
    {
      title: Strings.ORDER_SHIPPING_TITLE,
      body: Strings.ORDER_A_PRODUCT_AND_OTHERS,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.ORDER_SHIPMENT_COMPLETED,
    {
      title: Strings.ORDER_SHIPMENT_COMPLETED_TITLE,
      body: Strings.ORDER_A_PRODUCT_AND_OTHERS,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.ORDER_PURCHASE_COMPLETED,
    {
      title: Strings.ORDER_PURCHASE_COMPLETED_TITLE,
      body: Strings.ORDER_A_PRODUCT_AND_OTHERS,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.ORDER_CANCEL_REQUEST_BY_SELLER,
    {
      title: Strings.ORDER_REJECTED_TITLE,
      body: Strings.ORDER_REJECTED_BODY,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.ORDER_CANCEL_REQUEST_BY_BUYER,
    {
      title: Strings.ORDER_PURCHASE_CANCELED_TITLE,
      body: Strings.ORDER_PURCHASE_CANCELED_BODY,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.ORDER_CANCEL_PENDING_BY_ADMIN,
    {
      title: Strings.ORDER_PENDING_REFUND_TITLE,
      body: Strings.ORDER_PENDING_REFUND_BODY,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.ORDER_CANCEL_FINISHED,
    {
      title: Strings.ORDER_CANCEL_FINISHED_TITLE,
      body: Strings.ORDER_CANCEL_FINISHED_BODY,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.ORDER_PURCHASE_COMPLETED_AUTOMATICALLY,
    {
      title: Strings.ORDER_PURCHASE_COMPLETED_AUTOMATICALLY_TITLE,
      body: Strings.ORDER_A_PRODUCT_AND_OTHERS,
      image: (params) => {
        return params.productThumbnailUrl;
      },
    },
  ],
  // [
  //     notificationCode.REVIEW_REWARD_FUNDED,
  //     {
  //         title: Strings.REVIEW_REWARD_FUNDED_TITLE,
  //         body: Strings.REVIEW_REWARD_FUNDED_BODY,
  //         image: params => {
  //             return null;
  //         },
  //     },
  // ],
  // [
  //     notificationCode.REVIEW_REWARD_WITHDRAWAL,
  //     {
  //         title: Strings.REVIEW_REWARD_WITHDRAWAL_TITLE,
  //         body: Strings.REVIEW_REWARD_WITHDRAWAL_BODY,
  //         image: params => {
  //             return null;
  //         },
  //     },
  // ],
  [
    notificationCode.NEW_COMMENT_ON_UPLOADED_REVIEW_YOU_COMMENTED,
    {
      title: Strings.NEW_COMMENT_ON_UPLOADED_REVIEW_YOU_COMMENTED_TITLE,
      body: Strings.NEW_COMMENT_ON_UPLOADED_REVIEW_YOU_COMMENTED_BODY,
      image: (params) => {
        return params.videoThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.NEW_COMMENT_ON_TAGGED_USER,
    {
      title: Strings.NEW_COMMENT_ON_TAGGED_USER_TITLE,
      body: Strings.NEW_COMMENT_ON_TAGGED_USER_BODY,
      image: (params) => {
        return params.videoThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.NEW_NESTED_COMMENT_ON_COMMENT,
    {
      title: Strings.NEW_NESTED_COMMENT_ON_COMMENT_TITLE,
      body: Strings.NEW_NESTED_COMMENT_ON_COMMENT_BODY,
      image: (params) => {
        return params.videoThumbnailUrl;
      },
    },
  ],
  [
    notificationCode.REVIEWER_REQUESTED_WITHDRAWAL,
    {
      title: Strings.REVIEWER_REQUESTED_WITHDRAWAL_TITLE,
      body: undefined,
      image: (params) => {
        return params.userProfilePicUrl;
      },
    },
  ],
  [
    notificationCode.USER_WITHDRAWAL_ACCEPTED,
    {
      title: Strings.USER_WITHDRAWAL_ACCEPTED_TITLE,
      body: Strings.USER_WITHDRAWAL_ACCEPTED_BODY,
      image: (params) => {
        return null;
      },
    },
  ],
  [
    notificationCode.USER_WITHDRAWAL_REJECTED,
    {
      title: Strings.USER_WITHDRAWAL_REJECTED_TITLE,
      body: Strings.USER_WITHDRAWAL_REJECTED_BODY,
      image: (params) => {
        return null;
      },
    },
  ],
  [
    notificationCode.USER_WITHDRAWAL_FINISHED,
    {
      title: Strings.USER_WITHDRAWAL_FINISHED_TITLE,
      body: Strings.USER_WITHDRAWAL_FINISHED_BODY,
      image: (params) => {
        return null;
      },
    },
  ],
  [
    notificationCode.APPROVAL_SELLER_REGISTER,
    {
      title: Strings.APPROVAL_SELLER_REGISTER_TITLE,
      body: Strings.APPROVAL_SELLER_REGISTER_BODY,
      image: (params) => {
        return null;
      },
    },
  ],
  // Q&A hashtag notification
  [
    notificationCode.QNA_HASHTAG_CREATED,
    {
      title: Strings.QNA_HASHTAG_CREATED_TITLE,
      body: Strings.QNA_HASHTAG_CREATED_BODY,
      image: (params) => {
        return null;
      },
    },
  ],
  [
    notificationCode.QNA_CHAT_CREATED,
    {
      title: Strings.QNA_CHAT_CREATED_TITLE,
      body: Strings.QNA_CHAT_CREATED_BODY,
      image: (params) => {
        return null;
      },
    },
  ],
  [
    notificationCode.QNA_CHAT_MENTIONED,
    {
      title: Strings.QNA_CHAT_MENTIONED_TITLE,
      body: Strings.QNA_CHAT_MENTIONED_BODY,
      image: (params) => {
        return null;
      },
    },
  ],
  // Push messages to reviewers after User purchase an item through a review
  [
    notificationCode.ORDER_PURCHASE_ALARM_TO_REVIEWER,
    {
      title: Strings.ORDER_PURCHASE_ALARM_TO_REVIEWER_TITLE,
      body: Strings.ORDER_PURCHASE_ALARM_TO_REVIEWER_BODY,
      image: (params) => {
        console.log('214params', params);
        return null;
      },
    },
  ],
]);

export default class NotificationProvider {
  static getNotificationByCode = (code) => {
    return notificationContentsMap.get(code);
  };
}
