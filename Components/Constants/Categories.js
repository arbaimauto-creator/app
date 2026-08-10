import Strings from '../Strings';

const MAIN_VIDEO_LIST_TITLE = {
  trending: Strings.TRENDING_REVIEWS,
  recent: Strings.NEWEST_REVIEWS,
  following: Strings.FOLLOWING_REVIEWS,
  abroad: Strings.ABROAD_REVIEWS,
  worstProduct: Strings.WORSTPRODUCT_REVIEWS,
  hotReviewer: Strings.HOT_REVIEWER,
  scoreEvent: Strings.SCORE_EVENT_REVIEWS,
};

const CATEGORY_LIST = [
  {
    key: 'fashion',
    title: Strings.CATEGORY_FASHION,
    activeIcon: require('../../Resources/img/iconRenewal/fashion.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/fashion-color.png'),
  },
  {
    key: 'beauty',
    title: Strings.CATEGORY_BEAUTY,
    activeIcon: require('../../Resources/img/iconRenewal/beauty.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/beauty-color.png'),
  },
  {
    key: 'health',
    title: Strings.CATEGORY_HEALTH,
    activeIcon: require('../../Resources/img/iconRenewal/nutrition.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/health-color.png'),
  },
  {
    key: 'living',
    title: Strings.CATEGORY_LIVING,
    activeIcon: require('../../Resources/img/iconRenewal/living.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/living-color.png'),
  },
  {
    key: 'child',
    title: Strings.CATEGORY_CHILD_CARE,
    activeIcon: require('../../Resources/img/iconRenewal/child.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/child-color.png'),
  },
  {
    key: 'sports',
    title: Strings.CATEGORY_SPORTS,
    activeIcon: require('../../Resources/img/iconRenewal/sport.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/sport-color.png'),
  },
  {
    key: 'interior',
    title: Strings.CATEGORY_INTERIOR,
    activeIcon: require('../../Resources/img/iconRenewal/interior.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/interior-color.png'),
  },
  {
    key: 'digital',
    title: Strings.CATEGORY_DIGITAL,
    activeIcon: require('../../Resources/img/iconRenewal/digital.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/digital-color.png'),
  },
  {
    key: 'food',
    title: Strings.CATEGORY_FOOD,
    activeIcon: require('../../Resources/img/iconRenewal/food.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/food-color.png'),
  },
  {
    key: 'animal',
    title: Strings.CATEGORY_ANIMAL,
    activeIcon: require('../../Resources/img/iconRenewal/pet.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/animal-color.png'),
  },
  {
    key: 'hobby',
    title: Strings.CATEGORY_HOBBY,
    activeIcon: require('../../Resources/img/iconRenewal/hobby.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/hobby-color.png'),
  },
  {
    key: 'service',
    title: Strings.CATEGORY_SERVICE,
    activeIcon: require('../../Resources/img/iconRenewal/service.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/service-color.png'),
  },
  {
    key: 'others',
    title: Strings.CATEGORY_OTHERS,
    activeIcon: require('../../Resources/img/iconRenewal/etc.png'),
    deactiveIcon: require('../../Resources/img/iconRenewal/etc.png'),
  },
];

//VideoPage
const VIDEO_LIST_FOR_YOU = 'foryou';
const VIDEO_LIST_FOLLOWING = 'following';
const VIDEO_LIST_RELATED_TO_VIDEO = 'relatedToVideo';
const VIDEO_LIST_LINKED_PRODUCT = 'linkedProduct';
const VIDEO_LIST_TRENDING = 'trending';
const VIDEO_LIST_RELAYING = 'relaying';
const VIDEO_LIST_CATEGORY = 'category';
const VIDEO_LIST_RECENT = 'recent';
const VIDEO_LIST_ABROAD = 'abroad';
const VIDEO_LIST_WORSTPRODUCT = 'worstProduct';
const VIDEO_LIST_HOME = 'reviewHome';
const VIDEO_LIST_HOT_REVIEWER = 'hotReviewer';
const VIDEO_LIST_SCORE_EVENT = 'scoreEvent';
const VIDEO_LIST_CURATED_K_PRODUCT = 'curatedKProduct';

//Store
const PRODUCT_LIST_SEARCH = 'search';
const PRODUCT_LIST_HISTORY = 'history';
const PRODUCT_LIST_PROMOTION = 'promotion';
const PRODUCT_LIST_RECOMMENDED = 'recommended';
const PRODUCT_LIST_SPECIAL_PRICE = 'specialPrice';
const PRODUCT_LIST_OF_SELLER = 'sellerUpload';
const PRODUCT_LIST_RELATED_TO_PRODUCT = 'related_to_product';
const PRODUCT_LIST_CATEGORY = 'category';
const PRODUCT_LIST_NEW = 'new';
const PRODUCT_LIST_B2B = 'productList';
const PRODUCT_LIST_BEST_SELLING = 'best_selling';
const PRODUCT_LIST_MANY_REVIEWS = 'many_reviews';
const PRODUCT_LIST_HOME = 'storeHome';
const PRODUCT_LIST_PROMOTION_EVENT = 'promotion_event';
const PRODUCT_LIST_GOOGLE_PROMOTION_EVENT = 'google_promotion_1';

const DISCOVER_SCREEN_CATEGORY_LIST = [
  {
    key: VIDEO_LIST_HOME,
    title: 'Home', //Strings.REVIEW_HOME,
  },
  {
    key: VIDEO_LIST_HOT_REVIEWER,
    title: 'HOT',
  },
  {
    key: VIDEO_LIST_RECENT,
    title: 'NEW',
  },
  {
    key: VIDEO_LIST_TRENDING,
    title: Strings.TRENDING_REVIEWS_SHORT, // '인기',
  },
  {
    key: VIDEO_LIST_WORSTPRODUCT,
    title: Strings.WORSTPRODUCT_REVIEWS_SHORT, // '비추천',
  },
  {
    key: VIDEO_LIST_ABROAD,
    title: Strings.ABROAD_REVIEWS_SHORT, // '해외',
  },
  {
    key: VIDEO_LIST_FOLLOWING,
    title: Strings.FOLLOWING_REVIEWS_SHORT, // '팔로잉',
  },
];

const GREYD_GUIDE_LIST = [
  {
    key: 'whatIsgreyd',
    title: Strings.GREYD_GUIDE_WHAT_IS_GREYD, //'그레이드란',
    image: require('../../Resources/newIcon/7.3.png'),
    url: {
      video: {
        ko: 'https://storage.googleapis.com/greyd/video-guide/What%20is%20greyd%20(kor).mp4',
        en: 'https://storage.googleapis.com/greyd/video-guide/What%20is%20greyd.mp4',
      },
    },
  },
  {
    key: 'howToReview',
    title: Strings.GREYD_GUIDE_HOW_TO_REVIEW, //'리뷰하는법',
    image: require('../../Resources/img/newIcon/how-to-review.jpg'),
    url: {
      video: {
        ko: 'https://storage.googleapis.com/greyd/video-guide/(Kor)%20How%20to%20make%20a%20good%20review.mp4',
        en: 'https://storage.googleapis.com/greyd/video-guide/(Eng)%20How%20to%20make%20a%20good%20review.mp4',
      },
    },
  },
  {
    key: 'uploadReview',
    title: Strings.GREYD_GUIDE_HOW_TO_UPLOAD, //'리뷰올리기',
    image: require('../../Resources/img/newIcon/how-to-upload.jpg'),
    url: {
      video: {
        ko: 'https://storage.googleapis.com/greyd/video-guide/(Kor)%20How%20to%20upload%20a%20review%201.mp4',
        en: 'https://storage.googleapis.com/greyd/video-guide/(Eng)%20How%20to%20upload%20a%20review%202.mp4',
      },
    },
  },
  {
    key: 'tierGuide',
    title: Strings.GREYD_GUIDE_TIER_DESCRIPTION, //'티어설명',
    image: require('../../Resources/img/newIcon/tier.jpg'),
  },
  // {
  //   key: 'relayReview',
  //   title: Strings.GREYD_GUIDE_HOW_TO_RELAY_REVIEW, //'릴레이리뷰',
  // },
  // {
  //   key: 'getReward',
  //   title: Strings.GREYD_GUIDE_GET_REWARD, //'리워드받는법',
  // },
  // {
  //   key: 'greyder',
  //   title: Strings.GREYD_GUIDE_BECOME_GREYDER, //'그레이더되기',
  // },
  // {
  //   key: 'reviewEvent',
  //   title: Strings.GREYD_GUIDE_REVIEW_EVENT, //'리뷰이벤트',
  // },
  // {
  //   key: 'joinEvent',
  //   title: Strings.GREYD_GUIDE_JOIN_EVENT, //'가입이벤트',
  // },
];

export default {
  MAIN_VIDEO_LIST_TITLE,
  CATEGORY_LIST,
  VIDEO_LIST_FOR_YOU,
  VIDEO_LIST_FOLLOWING,
  VIDEO_LIST_RELATED_TO_VIDEO,
  VIDEO_LIST_LINKED_PRODUCT,
  VIDEO_LIST_TRENDING,
  VIDEO_LIST_RELAYING,
  VIDEO_LIST_RECENT,
  VIDEO_LIST_ABROAD,
  VIDEO_LIST_WORSTPRODUCT,
  PRODUCT_LIST_SEARCH,
  PRODUCT_LIST_HISTORY,
  PRODUCT_LIST_PROMOTION,
  PRODUCT_LIST_RECOMMENDED,
  PRODUCT_LIST_SPECIAL_PRICE,
  PRODUCT_LIST_OF_SELLER,
  PRODUCT_LIST_RELATED_TO_PRODUCT,
  PRODUCT_LIST_CATEGORY,
  PRODUCT_LIST_NEW,
  PRODUCT_LIST_B2B,
  PRODUCT_LIST_BEST_SELLING,
  PRODUCT_LIST_MANY_REVIEWS,
  DISCOVER_SCREEN_CATEGORY_LIST,
  GREYD_GUIDE_LIST,
  VIDEO_LIST_HOME,
  VIDEO_LIST_HOT_REVIEWER,
  PRODUCT_LIST_HOME,
  PRODUCT_LIST_PROMOTION_EVENT,
  VIDEO_LIST_CATEGORY,
  VIDEO_LIST_SCORE_EVENT,
  PRODUCT_LIST_GOOGLE_PROMOTION_EVENT,
  VIDEO_LIST_CURATED_K_PRODUCT,
};
