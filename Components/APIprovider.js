import { Platform } from 'react-native';
import Preference from 'react-native-default-preference';
import RNFS from 'react-native-fs';
import Constants from './Constants';
import { getLanguage } from './Strings/index';
import Utils from './utils';

export const API_ROOT_URL = 'https://api.greyd.app';
// export const API_ROOT_URL = 'http://localhost:3340';
// export const API_ROOT_URL = 'http://172.30.1.68:3340';
//export const API_ROOT_URL = "http://192.168.35.112:3340"
// export const API_ROOT_URL = 'http://3.35.180.81:3341'; // development server

export const version = 20231030;
export default class APIprovider {
  static requesterId;
  static requesterToken;
  static request = async (url, method, params = {}, files = []) => {
    if (this.requesterToken) {
      params.requesterToken = this.requesterToken;
    }
    if (this.requesterId) {
      params.requesterId = this.requesterId;
    }

    console.log('requesterToken', this.requesterToken);
    console.log('requesterId', this.requesterId);

    let fetchParams = {
      method: method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        version,
        os: Platform.OS,
        'current-version': await Utils.getCurrentDeviceVersion(),
      },
    };

    let body;

    if (method === 'GET') {
      url = new URL(url);
      Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
    } else if (files.length > 0) {
      body = new FormData();
      for (let i = 0; i < files.length; i++) {
        body.append(files[i].field, files[i]);
      }
      Object.keys(params).forEach((key) => {
        if (typeof params[key] === 'object') {
          params[key] = JSON.stringify(params[key]);
        }
        body.append(key, params[key]);
      });
      fetchParams.body = body;
      fetchParams.headers = {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      };
    } else {
      fetchParams.body = JSON.stringify(params);
    }

    try {
      const response = await fetch(url, fetchParams);
      const responseJson = await response.json();

      if (response.status === 500) {
        console.error(url, fetchParams);
        throw new Error(responseJson.errorMsg);
      }

      if (!response.ok || (responseJson.hasOwnProperty('result') && responseJson.result === 0)) {
        return responseJson;
      }

      return responseJson;
    } catch (err) {
      console.error('request error', err);
      return err;
    }
  };

  static requestWithHeaderToken = async (url, method, params = {}, files = []) => {
    const fetchParams = {
      method: method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        version,
        access_token: this.requesterToken || '',
        user_id: this.requesterId || '',
        os: Platform.OS,
        'current-version': await Utils.getCurrentDeviceVersion(),
      },
    };

    try {
      if (method === 'GET') {
        url = new URL(url);
        Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
      } else if (files.length > 0) {
        const body = new FormData();
        for (let i = 0; i < files.length; i++) {
          body.append(files[i].field, files[i]);
        }
        Object.keys(params).forEach((key) => {
          if (typeof params[key] === 'object') {
            params[key] = JSON.stringify(params[key]);
          }
          body.append(key, params[key]);
        });
        fetchParams.body = body;
        fetchParams.headers = {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        };
      } else {
        fetchParams.body = JSON.stringify(params);
      }

      const response = await fetch(url, fetchParams);
      const result = await response.json();

      return result;
    } catch (err) {
      console.log('request err', err);
      return err;
    }
  };
  static requestWithFile = async (url, method = 'POST', params = {}, files = []) => {
    if (this.requesterToken) {
      params.requesterToken = this.requesterToken;
    }
    if (this.requesterId) {
      params.requesterId = this.requesterId;
    }
    Object.keys(params).forEach((key) => {
      if (key === 'id') {
        params[key] = params[key].toString();
      }
      if (typeof params[key] === 'object') {
        params[key] = JSON.stringify(params[key]);
      }
    });
    for (let i = 0; i < files.length; i++) {
      let file = {};
      file.name = files[i].field;
      file.filename = files[i].name;
      file.filetype = files[i].type;
      file.filepath = files[i].uri.replace('file://', '');
      files[i] = file;
    }

    let uploadBegin = (response) => {
      let jobId = response.jobId;
      console.log('UPLOAD HAS BEGUN! JobId: ' + jobId);
    };
    let uploadProgress = (response) => {
      let percentage = Math.floor(
        (response.totalBytesSent / response.totalBytesExpectedToSend) * 100,
      );
      console.log('UPLOAD IS ' + percentage + '% DONE!');
    };

    try {
      const response = await RNFS.uploadFiles({
        toUrl: url,
        files: files,
        method: method,
        headers: {
          Accept: 'application/json',
        },
        fields: params,
        begin: uploadBegin,
        progress: uploadProgress,
      }).promise;

      if (response.statusCode === 200) {
        return response.body;
      }
      return response;
    } catch (err) {
      if (err.description === 'cancelled') {
      }
      return err;
    }
  };

  static uploadFileWithXhs = (url, method = 'POST', params = {}, files = []) => {
    return new Promise(async function (resolve, reject) {
      if (this.requesterToken) {
        params.requesterToken = this.requesterToken;
      }
      if (this.requesterId) {
        params.requesterId = this.requesterId;
      }
      let data = new FormData();
      for (let i = 0; i < files.length; i++) {
        data.append(files[i].field, files[i]);
      }
      Object.keys(params).forEach((key) => {
        if (typeof params[key] === 'object') {
          params[key] = JSON.stringify(params[key]);
        }
        data.append(key, params[key]);
      });
      const onUploadFinish = (res) => {
        data = null;
        resolve(res);
      };
      const onUploadProgress = (res) => {
        // console.log('onprogress', res);
        // res: {"isTrusted": false, "lengthComputable": true, "loaded": 239599616, "total": 279928225}
      };
      const onUploadError = (res) => {
        reject(res);
      };
      let xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = (res) => {
        onUploadFinish('onupload', res);
      };
      xhr.upload.onprogress = onUploadProgress;
      xhr.onerror = onUploadError;

      xhr.send(data);
    });
  };

  static uploadFileWithSignedUrl = (url, filePath, fileName, fileType, context) => {
    return new Promise(async function (resolve, reject) {
      const onUploadFinish = (res) => {
        console.log(res);
        resolve(res);
      };
      const onUploadProgress = (res) => {
        console.log('onprogress', res);
        const { loaded, total } = res;

        context.setState({ uploadToGcsProgress: loaded / total });
      };
      const onUploadError = (res) => {
        console.log('error');
        reject(res);
      };
      let xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.onload = (res) => {
        onUploadFinish('onupload', res);
      };
      xhr.upload.onprogress = onUploadProgress;
      xhr.onerror = onUploadError;

      const video = {
        uri: filePath,
        type: fileType,
        name: fileName,
      };

      xhr.setRequestHeader('Content-Type', video.type);
      xhr.send(video);
    });

    // const onUploadFinish = (res) => {
    //   console.log('onUploadFinish', res);
    //   // resolve(res);
    // };
    // const onUploadProgress = (res) => {
    //   console.log('onprogress', res);
    // };
    // const onUploadError = (res) => {
    //   console.log('onUploadError', res);
    //   // reject(res);
    // };
    // let xhr = new XMLHttpRequest();
    // xhr.open('PUT', url);
    // xhr.onload = (res) => {
    //   onUploadFinish('onupload', res);
    // };
    // xhr.upload.onprogress = onUploadProgress;
    // xhr.onerror = onUploadError;

    // const video = {
    //   uri: filePath,
    //   type: 'video/mp4',
    //   name: 'video.mp4',
    // }

    // xhr.setRequestHeader('Content-Type', video.type);
    // xhr.send(video);
  };

  static requestHtml = (url) => {
    return new Promise(async function (resolve, reject) {
      fetch(url)
        .then((response) => {
          resolve(response.text());
        })
        .catch((error) => {
          console.log(error);
          reject(error);
        });
    });
  };

  static setRequester = async (rawToken, id) => {
    this.requesterToken = Utils.SHA256(rawToken);
    this.requesterId = id;
  };

  static clearRequester = async () => {
    this.requesterToken = undefined;
    this.requesterId = undefined;
  };

  static getSearchResult = (searchKeyword = '', offset = '', limit = 18) => {
    return this.request(API_ROOT_URL + '/search', 'GET', {
      offset: offset,
      limit: limit,
      searchKeyword: searchKeyword,
    });
  };

  /** Video **/
  static getVideoList = (
    listType,
    sortType = undefined,
    searchKeyword,
    offset = '',
    skip = 0,
    limit = 18,
    isInitial = undefined,
  ) => {
    return this.request(API_ROOT_URL + '/videos', 'GET', {
      offset: offset,
      skip: skip,
      limit: limit,
      searchKeyword: searchKeyword,
      listType: listType,
      sortType: sortType,
      isInitial,
    });
  };

  static getNotificationList = (userId, offset = '', limit = 18) => {
    return this.request(API_ROOT_URL + '/notifications', 'GET', {
      userId: userId,
      offset: offset,
      limit: limit,
    });
  };

  static readAllNotifications = () => {
    return this.request(API_ROOT_URL + '/notifications', 'PUT', {});
  };

  static getDiscoverMain = () => {
    return this.request(API_ROOT_URL + '/videos', 'GET', {
      listType: 'discoverMain',
    });
  };

  static getRelayingVideoList = (
    videoId,
    sortType = undefined,
    offset = '',
    skip = 0,
    limit = 18,
  ) => {
    return this.request(API_ROOT_URL + '/videos', 'GET', {
      offset: offset,
      skip: skip,
      limit: limit,
      listType: Constants.VIDEO_LIST_RELAYING,
      videoId: videoId,
      sortType: sortType,
    });
  };

  static getLinkedVideoListOfProduct = (
    productId,
    sortType = undefined,
    offset = '',
    skip = 0,
    limit = 18,
  ) => {
    return this.request(API_ROOT_URL + '/videos', 'GET', {
      offset: offset,
      skip: skip,
      limit: limit,
      listType: Constants.VIDEO_LIST_LINKED_PRODUCT,
      productId: productId,
      sortType: sortType,
    });
  };

  static getBookmarkedVideoList = (userId, offset = '', skip = 0, limit = 18) => {
    return this.request(API_ROOT_URL + '/videos', 'GET', {
      offset: offset,
      skip: skip,
      limit: limit,
      listType: 'bookmarked',
      userId: userId,
    });
  };

  static getCategorizedVideoList = (
    categoryCode,
    sortType = undefined,
    offset = '',
    skip = 0,
    limit = 18,
  ) => {
    return this.request(API_ROOT_URL + '/videos', 'GET', {
      offset: offset,
      skip: skip,
      limit: limit,
      listType: Constants.VIDEO_LIST_CATEGORY,
      categoryCode: categoryCode,
      sortType: sortType,
    });
  };

  static getUserUploadVideoList = (userId, offset = '', skip = 0, limit = 18) => {
    return this.request(API_ROOT_URL + '/videos', 'GET', {
      offset: offset,
      skip: skip,
      limit: limit,
      listType: 'userUpload',
      userId: userId,
    });
  };

  static getVideoSearch = (searchKeyword, offset = '', skip = 0, limit = 18) => {
    return this.request(API_ROOT_URL + '/videos', 'GET', {
      offset: offset,
      skip: skip,
      limit: limit,
      listType: '',
      searchKeyword: searchKeyword,
      description: 1,
    });
  };

  static getVideoDetails = (videoId) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId, 'GET', {});
  };

  static getVideoCommentList = (videoId, parentId = undefined, offset = '', limit = 18) => {
    return this.request(
      API_ROOT_URL + '/videos/' + videoId + '/comments' + (parentId ? `/${parentId}` : ''),
      'GET',
      {
        offset: offset,
        limit: limit,
      },
    );
  };

  /** React to video **/
  static getVideoRatingList = (videoId, offset = '', limit = 20) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId + '/ratings', 'GET', {
      offset: offset,
      limit: limit,
    });
  };

  static ratingVideo = (videoId, score) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId + '/ratings', 'PUT', {
      ratingScore: score,
    });
  };

  static getVideoG6RatingList = (videoId, offset = '', limit = 20) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId + '/g6-ratings', 'GET', {
      offset: offset,
      limit: limit,
    });
  };

  static g6RatingVideo = (videoId, score) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId + '/g6-ratings', 'POST', {
      g6Score: score,
    });
  };

  static cancelRatingVideo = (videoId, score) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId + '/ratings', 'DELETE', {});
  };

  static cancelG6RatingVideo = (videoId, score) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId + '/g6-ratings', 'DELETE', {});
  };

  static bookmarkVideo = (videoId, isBookmarked) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId + '/bookmarks', 'PUT', {
      isBookmarked: isBookmarked,
    });
  };

  static addNewVideoComment = ({ comment, videoId, targetId, isSecret }) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId + '/comments', 'POST', {
      comment,
      targetId,
      isSecret,
    });
  };

  static addVideoRecomment = (comment, videoId, targetId, upperCommentId, tagId) => {
    return this.request(
      API_ROOT_URL + '/videos/' + videoId + '/comments/' + upperCommentId,
      'POST',
      {
        comment: comment,
        targetId: targetId,
        tagId: tagId,
      },
    );
  };

  static deleteVideoComment = (videoId, commentId) => {
    return this.request(
      API_ROOT_URL + '/videos/' + videoId + '/comments/' + commentId,
      'DELETE',
      {},
    );
  };

  static reportVideo = (videoId, reasonCode, reasonMessage) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId + '/reports', 'POST', {
      reasonCode: reasonCode,
      reasonMessage: reasonMessage,
    });
  };

  /** Upload video **/
  static addNewVideo = (video) => {
    // const request = this.uploadFileWithXhs;
    // const request = this.requestWithFile;
    const request = this.requestWithFile;

    // const uploadFileWithSignedUrl = this.uploadFileWithSignedUrl;
    // const getFileMetadata = this.getFileMetadata;
    return new Promise(async function (resolve, reject) {
      // const videoHash = await RNFS.hash(video.videoUri, 'md5')
      // const videoFilename = `${videoHash}.${Utils.fileExtension(video.videoUri)}`;

      // const { uploadSignedUrl } = await APIprovider.request(`${API_ROOT_URL}/signed-url`, 'GET', { fileName: videoFilename, contentType: video.videoType });
      // await uploadFileWithSignedUrl(uploadSignedUrl, video.videoUri, videoFilename, video.videoType);
      // const { success } = await getFileMetadata(videoFilename);

      // if(!success) {
      //   throw new Error('Video Upload to GCS Failed');
      // }

      // video.videoUrl = `https://resource.greyd.app/${videoFilename}`;
      // video.videoPath = videoFilename;

      const thumbnailHash = await RNFS.hash(video.thumbnailUri, 'md5');
      const thumbnailFilename = `${thumbnailHash}.${Utils.fileExtension(video.thumbnailUri)}`;

      let attachmentListToAdd = [];
      for (let i = 0; i < video.attachmentList.length; i++) {
        const resizedImageUri = await Utils.resizeImage(
          video.attachmentList[i].uri,
          Constants.MAX_SCALE_REVIEW_IMAGE,
        );
        const fileHash = await RNFS.hash(resizedImageUri, 'md5');
        const fileName = `${fileHash}.${Utils.fileExtension(resizedImageUri)}`;
        attachmentListToAdd.push({
          field: 'reviewImage',
          uri: resizedImageUri,
          type:
            resizedImageUri === video.attachmentList[i].uri
              ? video.attachmentList[i].mime
              : 'image/jpeg',
          name: fileName,
        });
      }

      request(
        API_ROOT_URL + '/videos',
        'POST',
        {
          ...video,
          attachmentList: [],
        },
        [
          // {
          //   field: 'video',
          //   uri: video.videoUri,
          //   type: 'video/mp4',
          //   name: videoFilename
          // },
          {
            field: 'videoThumbnail',
            uri: video.thumbnailUri,
            type: 'image/jpg',
            name: thumbnailFilename,
          },
          ...attachmentListToAdd,
        ],
      )
        .then((result) => {
          // console.log('upload result', result);
          resolve(result);
        })
        .catch((err) => {
          console.log('upload err', err);
          reject(err);
        });
    });
  };
  static createVideo = async (video) => {
    try {
      const thumbnailHash = await RNFS.hash(video.thumbnailUri, 'md5');
      const thumbnailFilename = `${thumbnailHash}.${Utils.fileExtension(video.thumbnailUri)}`;

      let attachmentListToAdd = [];
      for (let i = 0; i < video.attachmentList.length; i++) {
        const resizedImageUri = await Utils.resizeImage(
          video.attachmentList[i].uri,
          Constants.MAX_SCALE_REVIEW_IMAGE,
        );
        const fileHash = await RNFS.hash(resizedImageUri, 'md5');
        const fileName = `${fileHash}.${Utils.fileExtension(resizedImageUri)}`;
        attachmentListToAdd.push({
          field: 'reviewImage',
          uri: resizedImageUri,
          type:
            resizedImageUri === video.attachmentList[i].uri
              ? video.attachmentList[i].mime
              : 'image/jpeg',
          name: fileName,
        });
      }

      const result = await this.request(
        API_ROOT_URL + '/videos',
        'POST',
        {
          ...video,
          attachmentList: [],
        },
        [
          {
            field: 'videoThumbnail',
            uri: video.thumbnailUri,
            type: 'image/jpg',
            name: thumbnailFilename,
          },
          ...attachmentListToAdd,
        ],
      );

      console.log('upload result', result);
      return result;
    } catch (err) {
      console.log('upload err', err);
      return err;
    }
  };
  static editVideo = async (video) => {
    try {
      let files = [];
      let oldAttachmentList = [];

      if (video.oldThumbnailPath !== video.thumbnailUri && video.oldThumbnailPath) {
        const thumbnailHash = await RNFS.hash(video.thumbnailUri, 'md5');
        const thumbnailFilename = `${thumbnailHash}.${Utils.fileExtension(video.thumbnailUri)}`;

        files.push({
          field: 'videoThumbnail',
          uri: video.thumbnailUri,
          type: 'image/jpg',
          name: thumbnailFilename,
        });
      }

      for (let i = 0; i < video.attachmentList.length; i++) {
        const file = video.attachmentList[i];
        if (file.hasOwnProperty('change')) {
          if (file.change === Constants.ATTACHMENT_CHANGE_ADDED) {
            const resizedImageUri = await Utils.resizeImage(
              video.attachmentList[i].uri,
              Constants.MAX_SCALE_REVIEW_IMAGE,
            );
            const fileHash = await RNFS.hash(resizedImageUri, 'md5');
            const fileName = `${fileHash}.${Utils.fileExtension(resizedImageUri)}`;
            files.push({
              field: 'reviewImage',
              uri: resizedImageUri,
              type: resizedImageUri === file.uri ? video.attachmentList[i].mime : 'image/jpeg',
              name: fileName,
            });
          }
        } else {
          oldAttachmentList.push(video.attachmentList[i]);
        }
      }

      const result = await this.request(
        API_ROOT_URL + '/videos/' + video.videoId,
        'PUT',
        {
          ...video,
          attachmentList: oldAttachmentList,
        },
        files,
      );

      return result;
    } catch (err) {
      console.error('editVideo err', err);
      return err;
    }
  };

  static deleteVideo = (videoId) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId, 'DELETE', {});
  };

  /** Product */
  static getStoreMain = (limit = 10) => {
    return this.request(API_ROOT_URL + '/products', 'GET', {
      listType: 'storeMain',
      limit: limit,
    });
  };

  static getProductList = (
    listOf,
    sortType = undefined,
    searchKeyword = '',
    offset = '',
    skip = 0,
    limit = 18,
  ) => {
    return this.request(API_ROOT_URL + '/products', 'GET', {
      offset: offset,
      limit: limit,
      listType: listOf,
      searchKeyword: searchKeyword,
      sortType: sortType,
      skip: skip,
    });
  };

  static getUserUploadProductList = (userId, offset = '', skip = 0, limit = 18) => {
    return this.request(API_ROOT_URL + '/products', 'GET', {
      offset: offset,
      limit: limit,
      listType: 'sellerUpload',
      userId: userId,
      skip: skip,
    });
  };

  static getProductListRelatedToProduct = (
    productId,
    sortType = undefined,
    offset = '',
    skip = 0,
    limit = 18,
  ) => {
    return this.request(API_ROOT_URL + '/products', 'GET', {
      offset: offset,
      limit: limit,
      listType: 'relatedToProduct',
      productId: productId,
      sortType: sortType,
      skip: skip,
    });
  };

  static getBookmarkedProductList = (userId, offset = '', skip = 0, limit = 18) => {
    return this.request(API_ROOT_URL + '/products', 'GET', {
      offset: offset,
      limit: limit,
      listType: 'bookmarked',
      userId: userId,
      skip: skip,
    });
  };

  static getCategorizedProductList = (
    categoryCode,
    sortType = undefined,
    offset = '',
    skip = 0,
    limit = 18,
  ) => {
    return this.request(API_ROOT_URL + '/products', 'GET', {
      offset: offset,
      limit: limit,
      categoryCode: categoryCode,
      sortType: sortType,
      skip: skip,
    });
  };

  static getProductSearch = (searchKeyword, offset = '', skip = 0, limit = 18) => {
    return this.request(API_ROOT_URL + '/products', 'GET', {
      offset: offset,
      limit: limit,
      listType: '',
      searchKeyword: searchKeyword,
      skip: skip,
    });
  };

  static getProductDetails = (productId) => {
    return this.request(API_ROOT_URL + '/products/' + productId, 'GET', {});
  };
  // TOCHECK: skip 파라미터 필요여부 체크
  static getProductCommentList = (productId, offset = '', limit = 18) => {
    return this.request(API_ROOT_URL + '/products/' + productId + '/comments', 'GET', {
      offset: offset,
      limit: limit,
    });
  };

  static getProductReviewList = (productId, offset = '', limit = 18) => {
    return this.request(API_ROOT_URL + '/products/' + productId + '/reviews', 'GET', {
      offset: offset,
      limit: limit,
    });
  };

  /** Upload product **/
  static addNewProduct = (product) => {
    const request = this.request;
    return new Promise(async function (resolve, reject) {
      let attachmentListToAdd = [];
      for (let i = 0; i < product.attachmentList.length; i++) {
        const resizedImageUri = await Utils.resizeImage(
          product.attachmentList[i].uri,
          Constants.MAX_SCALE_PRODUCT_IMAGE,
        );
        const fileHash = await RNFS.hash(resizedImageUri, 'md5');
        const fileName = `${fileHash}.${Utils.fileExtension(resizedImageUri)}`;
        attachmentListToAdd.push({
          field: 'productImage',
          uri: resizedImageUri,
          type:
            resizedImageUri === product.attachmentList[i].uri
              ? product.attachmentList[i].mime
              : 'image/jpeg',
          name: fileName,
        });
      }
      for (let i = 0; i < product.descriptionImageList.length; i++) {
        let resizedImageUri = product.descriptionImageList[i].uri;
        if (product.descriptionImageList[i].mime !== 'image/jpeg') {
          resizedImageUri = await Utils.resizeImage(
            product.descriptionImageList[i].uri,
            Constants.MAX_SCALE_PRODUCT_DESCRIPTION_IMAGE_WIDTH,
            Constants.MAX_SCALE_PRODUCT_DESCRIPTION_IMAGE_HEIGHT,
            'contain',
          );
        }
        const fileHash = await RNFS.hash(resizedImageUri, 'md5');
        const fileName = `${fileHash}.${Utils.fileExtension(resizedImageUri)}`;
        attachmentListToAdd.push({
          field: 'descriptionImage',
          uri: resizedImageUri,
          type:
            resizedImageUri === product.descriptionImageList[i].uri
              ? product.descriptionImageList[i].mime
              : 'image/jpeg',
          name: fileName,
        });
      }

      request(
        API_ROOT_URL + '/products',
        'POST',
        {
          ...product,
          attachmentList: [],
          descriptionImageList: [],
        },
        attachmentListToAdd,
      )
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  static editProduct = (product) => {
    const request = this.request;
    return new Promise(async function (resolve, reject) {
      let attachmentListToAdd = [];
      let oldAttachmentList = [];
      for (let i = 0; i < product.attachmentList.length; i++) {
        const file = product.attachmentList[i];
        if (file.hasOwnProperty('change')) {
          if (file.change === Constants.ATTACHMENT_CHANGE_ADDED) {
            const resizedImageUri = await Utils.resizeImage(
              product.attachmentList[i].uri,
              Constants.MAX_SCALE_PRODUCT_IMAGE,
            );
            const fileHash = await RNFS.hash(resizedImageUri, 'md5');
            const fileName = `${fileHash}.${Utils.fileExtension(resizedImageUri)}`;
            attachmentListToAdd.push({
              field: 'productImage',
              uri: resizedImageUri,
              type: resizedImageUri === file.uri ? product.attachmentList[i].mime : 'image/jpeg',
              name: fileName,
            });
          }
        } else {
          oldAttachmentList.push(product.attachmentList[i]);
        }
      }
      let oldDescriptionImageList = [];
      for (let i = 0; i < product.descriptionImageList.length; i++) {
        const file = product.descriptionImageList[i];
        if (file.hasOwnProperty('change')) {
          if (file.change === Constants.ATTACHMENT_CHANGE_ADDED) {
            const resizedImageUri = await Utils.resizeImage(
              product.descriptionImageList[i].uri,
              Constants.MAX_SCALE_PRODUCT_DESCRIPTION_IMAGE_WIDTH,
              Constants.MAX_SCALE_PRODUCT_DESCRIPTION_IMAGE_HEIGHT,
              'contain',
            );
            const fileHash = await RNFS.hash(resizedImageUri, 'md5');
            const fileName = `${fileHash}.${Utils.fileExtension(resizedImageUri)}`;
            attachmentListToAdd.push({
              field: 'descriptionImage',
              uri: resizedImageUri,
              type:
                resizedImageUri === file.uri ? product.descriptionImageList[i].mime : 'image/jpeg',
              name: fileName,
            });
          }
        } else {
          oldDescriptionImageList.push(product.descriptionImageList[i]);
        }
      }

      request(
        API_ROOT_URL + '/products/' + product.productId,
        'PUT',
        {
          ...product,
          attachmentList: oldAttachmentList,
          descriptionImageList: oldDescriptionImageList,
        },
        attachmentListToAdd,
      )
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  static deleteProduct = (productId) => {
    return this.request(API_ROOT_URL + '/products/' + productId, 'DELETE', {});
  };

  static addNewProductComment = (comment, productId, targetId) => {
    return this.request(API_ROOT_URL + '/products/' + productId + '/comments', 'POST', {
      comment: comment,
      targetId: targetId,
    });
  };

  static deleteProductComment = (productId, commentId) => {
    return this.request(
      API_ROOT_URL + '/products/' + productId + '/comments/' + commentId,
      'DELETE',
      {},
    );
  };

  static addNewProductReview = (comment, productId, targetId, p6Score) => {
    return this.request(API_ROOT_URL + '/products/' + productId + '/reviews', 'POST', {
      comment: comment,
      targetId: targetId,
      p6Score: {
        brand: p6Score.brand,
        merchantability: p6Score.merchantability,
        practicality: p6Score.practicality,
        convenience: p6Score.convenience,
        design: p6Score.design,
        reasonable: p6Score.reasonable,
      },
    });
  };

  static deleteProductReview = (productId, reviewId) => {
    return this.request(
      API_ROOT_URL + '/products/' + productId + '/reviews/' + reviewId,
      'DELETE',
      {},
    );
  };

  static bookmarkProduct = (productId, isBookmarked) => {
    return this.request(API_ROOT_URL + '/products/' + productId + '/bookmarks', 'PUT', {
      isBookmarked: isBookmarked,
    });
  };

  /** My store **/
  static getMystoreDashboard = async () => {
    return this.request(API_ROOT_URL + '/users/' + this.requesterId + '/dashboard', 'GET', {});
  };

  static getCart = (offset = '', limit = 18) => {
    return this.request(API_ROOT_URL + '/cart', 'GET', {
      offset: offset,
      limit: limit,
      buyerId: this.requesterId,
    });
  };

  static newCartItem = (productId, number, options, reviewerVideoId, cartOrBuy) => {
    return this.request(API_ROOT_URL + '/cart', 'POST', {
      productId: productId,
      number: number,
      options: options,
      reviewerVideoId,
      cartOrBuy,
    });
  };

  static deleteCart = (cartItemId) => {
    return this.request(API_ROOT_URL + '/cart/' + cartItemId, 'DELETE', {});
  };

  static getOrderList = (orderStatusCode, buyerId, sellerId, offset = '', limit = 18) => {
    return this.request(API_ROOT_URL + '/orders', 'GET', {
      offset: offset,
      limit: limit,
      statusCode: orderStatusCode,
      buyerId: buyerId,
      sellerId: sellerId,
    });
  };

  static getOrder = (orderId, buyerId, sellerId) => {
    return this.request(API_ROOT_URL + '/orders/' + orderId, 'GET', {
      sellerId: sellerId,
      buyerId: buyerId,
    });
  };

  static newOrder = (params) => {
    return this.request(API_ROOT_URL + '/orders', 'POST', params);
  };

  static actionOrder = (
    orderId,
    actionCode = undefined,
    courier = undefined,
    actionMemoBuyer = undefined,
    actionMemoSeller = undefined,
  ) => {
    return this.request(API_ROOT_URL + '/orders/' + orderId, 'PUT', {
      actionMemoBuyer: actionMemoBuyer,
      actionMemoSeller: actionMemoSeller,
      actionCode: actionCode,
      shipmentCourierCO: courier ? courier.company : undefined,
      shipmentCourierNO: courier ? courier.invoice : undefined,
    });
  };

  static deleteOrder = (orderId) => {
    return this.request(API_ROOT_URL + '/orders/' + orderId, 'DELETE', {});
  };

  /** User **/
  static login = (authType, authData) => {
    this.clearRequester();
    return this.request(API_ROOT_URL + '/login', 'POST', {
      authType: authType,
      authData: authData,
    });
  };

  static signUp = (profile) => {
    const request = this.request;
    return new Promise(async function (resolve, reject) {
      let userProfilePic = [];
      if (profile.profilePicUri) {
        if (Utils.isUrl(profile.profilePicUri)) {
          profile.profilePicUrl = profile.profilePicUri;
        } else {
          const resizedProfilePicUri = await Utils.resizeImage(
            profile.profilePicUri,
            Constants.MAX_SCALE_USER_PROFILE_PIC,
          );
          const fileHash = await RNFS.hash(resizedProfilePicUri, 'md5');
          const fileName = `${fileHash}.${Utils.fileExtension(resizedProfilePicUri)}`;
          userProfilePic.push({
            field: 'userProfilePic',
            uri: resizedProfilePicUri,
            type:
              resizedProfilePicUri === profile.profilePicUri
                ? profile.profilePicType
                : 'image/jpeg',
            name: fileName,
          });
        }
      }
      request(
        API_ROOT_URL + '/users',
        'POST',
        {
          ...profile,
        },
        userProfilePic,
      )
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  };

  static logon_ = (profile) => {
    const self = this; // Apiprovider
    const request = this.request;
    return new Promise(async function (resolve, reject) {
      const myUserId = await Preference.get('userId');
      const originalRequesterToken = await Preference.get('userAccessToken');
      if (originalRequesterToken) {
        this.requesterToken = Utils.SHA256(originalRequesterToken);

        self.requesterToken = Utils.SHA256(originalRequesterToken);
        self.requesterId = myUserId;
      }
      this.requesterId = await Preference.get('userId');

      request(API_ROOT_URL + '/users/' + myUserId + '/login', 'GET', {
        ...profile,
      })
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          console.log('logon error', err);
          reject(err);
        });
    });
  };

  static logon = async (profile) => {
    const myUserId = await Preference.get('userId');
    const originalRequesterToken = await Preference.get('userAccessToken');

    if (originalRequesterToken) {
      this.requesterToken = Utils.SHA256(originalRequesterToken);
      this.requesterId = myUserId;
    }
    this.requesterId = await Preference.get('userId');

    try {
      const result = await this.request(API_ROOT_URL + '/users/' + myUserId + '/login', 'GET', {
        ...profile,
      });

      return result;
    } catch (err) {
      console.error('logon error', err);
      return err;
    }
  };

  static getUserList = (
    listOf = undefined,
    sortType = undefined,
    offset = '',
    skip = 0,
    limit = 18,
  ) => {
    return this.request(API_ROOT_URL + '/users', 'GET', {
      listOf: listOf,
      sortType: sortType,
      offset: offset,
      skip: skip,
      limit: limit,
    });
  };

  static getUserDetails = (userId) => {
    return this.request(API_ROOT_URL + '/users/' + userId, 'GET', {});
  };

  static getWithdrawalUserDetails = (userId) => {
    return this.request(API_ROOT_URL + '/users/' + userId, 'GET', { isWithdrawal: true });
  };

  static updateAgreementToTermsOfService = (userId) => {
    return this.requestWithHeaderToken(
      API_ROOT_URL + '/users/' + userId + '/terms-of-service',
      'PATCH',
    );
  };

  static updateWithdrawalInfo = (
    userId,
    acceptWithdrawal,
    accountHolderName,
    bankName,
    bankAccount,
  ) => {
    return this.request(API_ROOT_URL + '/users/' + userId + '/withdrawalRequest', 'PUT', {
      acceptWithdrawal,
      accountHolderName,
      bankName,
      bankAccount,
    });
  };

  static requestWithdrawal = async ({
    userId,
    accountHolderName,
    bankName,
    bankAccount,
    requestedAmount,
    phone,
    identificationImageUrl,
    identification,
    agencyBusinessLicenseUrl,
    agencyBusinessLicense,
    fullName,
  }) => {
    try {
      let files = [];

      if (!identification) {
        const identificationImageHash = await RNFS.hash(identificationImageUrl, 'md5');
        const identificationImageFilename = `${identificationImageHash}.${Utils.fileExtension(
          identificationImageUrl,
        )}`;

        files.push({
          field: 'identificationImageUrl',
          uri: identificationImageUrl,
          type: 'image/jpg',
          name: identificationImageFilename,
        });
      }

      if (!agencyBusinessLicense && agencyBusinessLicenseUrl) {
        const agencyBusinessLicenseImageHash = await RNFS.hash(agencyBusinessLicenseUrl, 'md5');
        const agencyBusinessLicenseImageFilename = `${agencyBusinessLicenseImageHash}.${Utils.fileExtension(
          agencyBusinessLicenseUrl,
        )}`;

        files.push({
          field: 'agencyBusinessLicenseUrl',
          uri: agencyBusinessLicenseUrl,
          type: 'image/jpg',
          name: agencyBusinessLicenseImageFilename,
        });
      }

      return this.request(
        API_ROOT_URL + '/users/' + userId + '/withdrawal',
        'POST',
        {
          accountHolderName,
          bankName,
          bankAccount,
          requestedAmount,
          phone,
          fullName,
        },
        files,
      );
    } catch (error) {
      console.error('requestWithdrawal request error', error);
      throw error;
    }
  };

  static getUserSearch = (searchKeyword, offset = '', limit = 18) => {
    return this.request(API_ROOT_URL + '/users', 'GET', {
      offset: offset,
      limit: limit,
      listType: '',
      searchKeyword: searchKeyword,
    });
  };

  static getEntireReviewRewardList = async ({
    offset = '',
    limit = 18,
    userId = this.requesterId,
    revenueType = undefined,
    skip = 0,
  }) => {
    try {
      const result = await this.request(API_ROOT_URL + '/users/' + userId + '/revenues', 'GET', {
        offset,
        limit,
        revenueType,
        isSeller: false,
        skip,
      });

      return result;
    } catch (err) {
      console.err('getEntireReviewRewardList', err);
      return err;
    }
  };

  static getReviewRewardList = async ({ offset = '', limit = 18, userId = this.requesterId }) => {
    try {
      const result = await this.request(API_ROOT_URL + '/users/' + userId + '/revenues', 'GET', {
        offset: offset,
        limit: limit,
        isSeller: false,
        isValid: true,
      });

      return result;
    } catch (err) {
      console.err('getReviewRewardList', err);
      return err;
    }
  };

  static getRevenueList = (offset = '', limit = 18) => {
    return this.request(API_ROOT_URL + '/users/' + this.requesterId + '/revenues', 'GET', {
      offset: offset,
      limit: limit,
      isSeller: true,
      isValid: true,
    });
  };

  static getBlockedUserList = (offset = '', limit = 18) => {
    const request = this.request;
    return new Promise(async function (resolve, reject) {
      const myUserId = await Preference.get('userId');
      request(API_ROOT_URL + '/users/' + myUserId + '/block', 'GET', {
        offset: offset,
        limit: limit,
      })
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  };

  static blockUser = (userId) => {
    const request = this.request;
    return new Promise(async function (resolve, reject) {
      const myUserId = await Preference.get('userId');
      request(API_ROOT_URL + '/users/' + myUserId + '/block', 'POST', {
        actionCode: 1,
        targetUserId: userId,
      })
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  };

  static unblockUser = (userId) => {
    const request = this.request;
    return new Promise(async function (resolve, reject) {
      const myUserId = await Preference.get('userId');
      request(API_ROOT_URL + '/users/' + myUserId + '/block', 'POST', {
        actionCode: 0,
        targetUserId: userId,
      })
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  };

  /** Following **/
  static getFollowingList = (userId, offset = '', skip = 0, limit = 18) => {
    return this.request(API_ROOT_URL + '/users', 'GET', {
      offset: offset,
      skip: skip,
      limit: limit,
      listType: 'following',
      userId: userId,
    });
  };

  static getFollowerList = (userId, offset = '', skip = 0, limit = 18) => {
    return this.request(API_ROOT_URL + '/users/', 'GET', {
      offset: offset,
      skip: skip,
      limit: limit,
      listType: 'follower',
      targetUserId: userId,
    });
  };

  static followUser = (targetUserId, isFollow) => {
    return this.request(API_ROOT_URL + '/users/' + targetUserId + '/follows', 'PUT', {
      targetUserId: targetUserId,
      isFollow: isFollow,
    });
  };

  static reportContent = (contentType, contentId, contentWrapperId, reportCode) => {
    if (contentType === 'video') {
      return this.request(API_ROOT_URL + '/videos/' + contentId + '/reports', 'POST', {
        code: reportCode,
      });
    } else if (contentType === 'product') {
      return this.request(API_ROOT_URL + '/products/' + contentId + '/reports', 'POST', {
        code: reportCode,
      });
    } else if (contentType === 'user') {
      return this.request(API_ROOT_URL + '/users/' + contentId + '/reports', 'POST', {
        code: reportCode,
      });
    } else if (contentType === 'comment') {
      return this.request(
        API_ROOT_URL + '/videos/' + contentWrapperId + '/comments/' + contentId + '/reports',
        'POST',
        {
          code: reportCode,
        },
      );
    }
  };

  /** My page **/
  static editProfile = (profile) => {
    const request = this.request;
    return new Promise(async function (resolve, reject) {
      let userProfilePic = [];
      if (profile.profilePicUri) {
        if (Utils.isUrl(profile.profilePicUri)) {
          profile.profilePicUrl = profile.profilePicUri;
        } else {
          const resizedProfilePicUri = await Utils.resizeImage(
            profile.profilePicUri,
            Constants.MAX_SCALE_USER_PROFILE_PIC,
          );
          const fileHash = await RNFS.hash(resizedProfilePicUri, 'md5');
          const fileName = `${fileHash}.${Utils.fileExtension(resizedProfilePicUri)}`;
          userProfilePic.push({
            field: 'userProfilePic',
            uri: resizedProfilePicUri,
            type:
              resizedProfilePicUri === profile.profilePicUri
                ? profile.profilePicType
                : 'image/jpeg',
            name: fileName,
          });
        }
      }

      request(
        API_ROOT_URL + '/users/' + profile.userId,
        'PUT',
        {
          ...profile,
          action: 'updateProfile',
        },
        userProfilePic,
      )
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  static cancelMembership = (userId, reason) => {
    const request = this.request;
    return new Promise(async function (resolve, reject) {
      request(API_ROOT_URL + '/users/' + userId + '/delete', 'PUT', {
        deletedReason: reason,
      })
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  static registerSeller = (userId, params) => {
    const request = this.request;
    return new Promise(async function (resolve, reject) {
      let sellerCertification = [];
      if (params.sellerCertificationUri) {
        const resizedPicUri = await Utils.resizeImage(
          params.sellerCertificationUri,
          Constants.MAX_SCALE_CERTIFICATION_IMAGE,
        );
        const fileHash = await RNFS.hash(resizedPicUri, 'md5');
        const fileName = `${userId}_${fileHash}.${Utils.fileExtension(resizedPicUri)}`;
        sellerCertification.push({
          field: 'sellerCertification',
          uri: resizedPicUri,
          type:
            resizedPicUri === params.sellerCertificationUri
              ? params.sellerCertificationType
              : 'image/jpeg',
          name: fileName,
        });
      }

      request(
        API_ROOT_URL + '/users/' + userId,
        'PUT',
        {
          ...params,
          action: 'registerSeller',
        },
        sellerCertification,
      )
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  static payWithPaypal = (orderId, paypalData) => {
    return this.request(API_ROOT_URL + '/orders/' + orderId + '/pay/paypal', 'POST', {
      paypalData,
    });
  };

  static getInstagramAthentication = (code) => {
    return this.request(API_ROOT_URL + '/login/instagram/user', 'GET', {
      code: code,
    });
  };

  static getWithdrawalRequests = (userId = this.requesterId, skip = 0, limit = 18) => {
    return this.request(API_ROOT_URL + '/users/' + userId + '/withdrawal', 'GET', {
      // skip: skip,
      // limit: limit,
    });
  };

  static getFileMetadata = (fileName) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/uploads/file-metadata', 'GET', {
      fileName,
    });
  };

  static getSignedUrl = (videoFilename, videoType) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/uploads/signed-url', 'GET', {
      fileName: videoFilename,
      contentType: videoType,
    });
  };

  static getUserProfileDynamicLink = (id, title, description, thumbnailUrl) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/dynamic-link', 'GET', {
      path: 'users',
      id,
      title,
      description,
      thumbnailUrl,
    });
    // return this.requestWithHeaderToken(API_ROOT_URL + '/dynamic-link', 'GET', { params: 'users/622ea9cd43bdb162de28c250' })
  };

  static getVideoDynamicLink = (id, title, description, thumbnailUrl) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/dynamic-link', 'GET', {
      path: 'videos',
      id,
      title,
      description,
      thumbnailUrl,
    });
  };

  static getVideoReplyDynamicLink = (id) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/dynamic-link', 'GET', {
      path: 'reply',
      id,
    });
  };

  static getVideoCommentsDynamicLink = (id) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/dynamic-link', 'GET', {
      path: 'comments',
      id,
    });
  };

  static getProductDynamicLink = (id, title, description, thumbnailUrl) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/dynamic-link', 'GET', {
      path: 'products',
      id,
      title,
      description,
      thumbnailUrl,
    });
  };

  static getQnaDynamicLink = (id, title, description, thumbnailUrl) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/dynamic-link', 'GET', {
      path: 'qnas',
      id,
      title,
      description,
      thumbnailUrl,
    });
  };

  static updateLastVideoView = (videoId, productId) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/orders/last-video-view', 'POST', {
      id: this.requesterId,
      videoId,
      productId,
    });
  };

  static getCurrencyRate = (currencyType = 'USD') => {
    return this.request(API_ROOT_URL + '/currency', 'GET', { currencyType });
    // return this.request(API_ROOT_URL + '/currency', 'GET', { currencyType }).then((res) => {
    //   Preference.set('KRW/USD', res.currencyRate.toString());
    // });
  };

  static checkDuplicateId = (name) => {
    return this.request(API_ROOT_URL + '/users/duplicate', 'GET', { name });
  };

  static getUserTotalReward = (userId) => {
    return this.requestWithHeaderToken(API_ROOT_URL + `/users/${userId}/total-reward`, 'GET', {
      isSeller: false,
    });
  };

  static getUserAvailableReward = (userId) => {
    return this.requestWithHeaderToken(API_ROOT_URL + `/users/${userId}/available-reward`, 'GET', {
      isSeller: false,
    });
  };

  static getVersionCode = ({ type }) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/app-version', 'GET', {
      type,
    });
  };

  static findVideoByHashTag = (hashTag) => {
    return this.requestWithHeaderToken(API_ROOT_URL + `/videos/hash-tag/${hashTag}`, 'GET', {
      locale: getLanguage(),
    });
  };

  static getVideoThumbnails = () => {
    return this.request(API_ROOT_URL + '/videos/thumbnails', 'GET');
  };

  //hastaglist api call
  static hashtagList = async (hostId) => {
    const myUserId = await Preference.get('userId');

    return this.requestWithHeaderToken(API_ROOT_URL + '/users/qna', 'GET', {
      host: hostId || myUserId,
    });
  };

  //qna hastag question list
  static getQnaChatlist = async (qnaId) => {
    const myUserId = await Preference.get('userId');

    return this.requestWithHeaderToken(API_ROOT_URL + `/users/qna/${qnaId}/chats`, 'GET');
  };

  static addQnaHashtag = async ({ host, hashtag }) => {
    const myUserId = await Preference.get('userId');

    return this.requestWithHeaderToken(API_ROOT_URL + '/users/qna', 'POST', {
      author: myUserId,
      host,
      hashtag,
    });
  };

  static addQNAChat = async (qnaId, chat, tagUser) => {
    const author = await Preference.get('userId');
    return this.requestWithHeaderToken(API_ROOT_URL + `/users/qna/${qnaId}`, 'POST', {
      chat,
      author,
      tagUserId: tagUser?._id,
    });
  };

  static removeQna = async ({ qnaId }) => {
    return this.requestWithHeaderToken(API_ROOT_URL + `/users/qna/${qnaId}`, 'DELETE');
  };

  static updateQnaChat = async ({ qnaId, chatId, chat }) => {
    return this.requestWithHeaderToken(API_ROOT_URL + `/users/qna/${qnaId}/${chatId}`, 'PATCH', {
      chat,
    });
  };

  static removeQnaChat = async ({ qnaId, chatId }) => {
    return this.requestWithHeaderToken(API_ROOT_URL + `/users/qna/${qnaId}/${chatId}`, 'DELETE');
  };

  static findParticipantByIds = async ({ qnaId, participants }) => {
    return this.requestWithHeaderToken(API_ROOT_URL + `/users/qna/${qnaId}/participants`, 'POST', {
      participants,
    });
  };

  static findUsersByName = async ({ username }) => {
    return this.requestWithHeaderToken(API_ROOT_URL + `/users/short/${username}`, 'GET');
  };

  static getMyHashtagListByHost = async (hostId) => {
    const myUserId = await Preference.get('userId');

    return this.requestWithHeaderToken(API_ROOT_URL + '/users/qna', 'GET', {
      host: hostId || myUserId,
      author: myUserId,
    });
  };

  static findQnaById = async ({ hostId, qnaId }) => {
    const myUserId = await Preference.get('userId');

    return this.requestWithHeaderToken(API_ROOT_URL + `/users/qna/${qnaId}`, 'GET', {
      host: hostId || myUserId,
    });
  };

  static getGoogleMapApiKey = async () => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/google-map', 'GET', {
      os: Platform.OS,
    });
  };

  static setGuestDeviceInfo = async (params) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/users/guest/device-token', 'POST', params);
  };

  static addBuyerToProduct = async ({ userId, productId }) => {
    return this.requestWithHeaderToken(API_ROOT_URL + `/products/${productId}/buyer`, 'PATCH', {
      userId,
    });
  };

  static findFollowMatchMe = async ({ myUserId, targetUserId }) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/users/find-follow-match-me', 'POST', {
      myUserId,
      targetUserId,
    });
  };

  static payWithReward = async ({ orderId, rewardUse, certifiedReviewerRewardUse }) => {
    return this.requestWithHeaderToken(API_ROOT_URL + `/orders/${orderId}/pay/reward`, 'POST', {
      rewardUse,
      certifiedReviewerRewardUse,
    });
  };

  static checkAvailablePromotionCode = async ({ promotionCode, userId, productId }) => {
    return this.requestWithHeaderToken(
      API_ROOT_URL + `/discount-codes/${promotionCode}/check`,
      'POST',
      {
        userId,
        productId,
      },
    );
  };

  static usePromotionCode = async ({ promotionCode, userId }) => {
    return this.requestWithHeaderToken(API_ROOT_URL + `/discount-codes/${promotionCode}`, 'POST', {
      userId,
      promotionCode,
    });
  };

  static removePromotionCodeUsage = async ({ promotionCode, userId }) => {
    return this.requestWithHeaderToken(
      API_ROOT_URL + `/discount-codes/${promotionCode}`,
      'DELETE',
      {
        userId,
        promotionCode,
      },
    );
  };

  static getChannelIOMemberHash = async ({ memberId }) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/users/channel-io/member-hash', 'POST', {
      memberId,
    });
  };

  static likeVideo = (videoId, isLiked) => {
    return this.request(API_ROOT_URL + '/videos/' + videoId + '/likes', 'PUT', {
      isLiked,
    });
  };

  static findReviewLikers = async ({ videoId, myUserId }) => {
    return this.requestWithHeaderToken(
      API_ROOT_URL + `/videos/${videoId}/find-review-likers`,
      'POST',
      { myUserId },
    );
  };

  static createNotification = async (params) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/notifications', 'POST', params);
  };

  static likeReviewComment = ({ videoId, commentId, isLiked }) => {
    return this.request(
      API_ROOT_URL + '/videos/' + videoId + '/comments/' + commentId + '/likes',
      'PUT',
      {
        isLiked,
      },
    );
  };

  static getRewardTypes = () => {
    return this.request(API_ROOT_URL + '/revenues/types', 'GET');
  };

  static getEventDynamicLink = (id, title, description, thumbnailUrl) => {
    return this.requestWithHeaderToken(API_ROOT_URL + '/dynamic-link', 'GET', {
      path: 'events',
      id,
      title,
      description,
      thumbnailUrl,
    });
  };

  static getEvents = () => {
    return this.request(API_ROOT_URL + '/events', 'GET');
  };

  static getRewardGuide = () => {
    return this.request(API_ROOT_URL + '/events/reward-guide', 'GET');
  };

  static getVideoExtraInformation = (videoId) => {
    return this.request(API_ROOT_URL + '/videos/extra-info/' + videoId, 'GET', {});
  };
  static getGlobalGroupBuyings = (videoId) => {
    return this.request(API_ROOT_URL + '/videos/global-group-buying/', 'GET', {});
  };

  static sendB2BInquiry = (b2bInquiryParams) => {
    return this.request(API_ROOT_URL + '/products/b2b-inquiry', 'POST', b2bInquiryParams);
  };

  static;
}
