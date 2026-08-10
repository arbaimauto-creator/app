import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { logout as KakaoLogout } from '@react-native-seoul/kakao-login';
import { CommonActions } from '@react-navigation/native';
import { Alert, Image, Linking, Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { checkVersion } from 'react-native-check-version';
import Preference from 'react-native-default-preference';
import { clearGreydLocalData } from '../../api/localReset';
import deviceInfoModule from 'react-native-device-info';
// FFmpegKit imports - 변경된 부분
import { FFmpegKit, FFmpegKitConfig, FFprobeKit, ReturnCode } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import { PERMISSIONS, RESULTS, check as checkPermission, request } from 'react-native-permissions';
import PushNotification from 'react-native-push-notification';

import dayjs from 'dayjs';
import Geolocation from 'react-native-geolocation-service';
import { getStatusBarHeight } from 'react-native-safearea-height';
import Share from 'react-native-share';
import { store } from '../../redux/store';
import { setCountryCode, setGuest } from '../../slices/user';
import APIprovider from '../APIprovider';
import Constants from '../Constants';
import Codes from '../Constants/Codes';
import Strings, { getLanguage } from '../Strings';
import SHA256 from './SHA256';

import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import * as Sentry from '@sentry/react-native';

const allowedImageExtension = ['jpeg', 'jpg', 'png', 'gif', 'bmp'];
const allowedVideoExtension = ['mp4'];

const IDLE = 'IDLE';
const BUSY = 'BUSY';

let uploadingTaskQueue = [];

function getFileNameWithDate() {
  const nowDate = new Date();
  const yyyy = nowDate.getFullYear().toString();
  const MM = (nowDate.getMonth() + 1 + '').padStart(2, '0');
  const dd = (nowDate.getDate() + '').padStart(2, '0');
  const hh = (nowDate.getHours() + '').padStart(2, '0');
  const mm = (nowDate.getMinutes() + '').padStart(2, '0');
  const ss = (nowDate.getSeconds() + '').padStart(2, '0');
  return yyyy + MM + dd + '_' + hh + mm + ss;
}

function isNumeric(v) {
  // 기존 구현은 모든 문자열을 false 처리해 서버가 "12000"처럼 문자열 숫자를 주면
  // numberWithCommas가 '-'를 표시했다.
  if (typeof v === 'number') {
    return Number.isFinite(v);
  }
  if (typeof v === 'string') {
    return v.trim() !== '' && !isNaN(v) && Number.isFinite(Number.parseFloat(v));
  }
  return false;
}

function stringShorten(str, length) {
  return str.substring(0, length) + (str.length > length ? '..' : '');
}

function timestampToDatetime(timestamp, timezone = 'ko-KR') {
  const datetime = new Date(timestamp);
  return datetime.toLocaleString(timezone);
}

function timestampToAgo(timestamp) {
  let date = new Date(timestamp);
  let seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) {
    const years = Math.floor(interval);
    return Strings.YEARS_AGO(years);
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    const months = Math.floor(interval);
    return Strings.MONTHS_AGO(months);
  }
  interval = seconds / 86400;
  if (interval > 1) {
    const days = Math.floor(interval);
    return Strings.DAYS_AGO(days);
  }
  interval = seconds / 3600;
  if (interval > 1) {
    const hours = Math.floor(interval);
    return Strings.HOURS_AGO(hours);
  }
  interval = seconds / 60;
  if (interval > 1) {
    const mins = Math.floor(interval);
    return Strings.MINUTES_AGO(mins);
  }
  return Strings.SECONDS_AGO(seconds);
}

function timestampToDday(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const timestampDelta = date.getTime() - now.getTime();
  const dday = parseInt(timestampDelta / (1000 * 60 * 60 * 24), 10);
  return dday;
}

export function numberWithCommas(x) {
  if (isNumeric(x)) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } else {
    return '-';
  }
}

function displayPrice(x, countryCode = 'kr', KRWPerUSD = 1) {
  if (countryCode === 'kr') {
    return Strings.MONEY_AMOUNT_UNIT_WON(numberWithCommas(x));
  } else {
    const dollorValue = +(x / KRWPerUSD).toFixed(2);
    return Strings.MONEY_AMOUNT_UNIT_DOLLOR(numberWithCommas(dollorValue));
  }
}

function displayPriceNumber(x, countryCode = 'kr', KRWPerUSD = 1) {
  if (countryCode === 'kr') {
    return x;
  } else {
    const dollorValue = +(x / KRWPerUSD).toFixed(2);
    return dollorValue;
  }
}

function convertKRWUSD(value, countryCode = 'kr', KRWPerUSD = 1) {
  if (countryCode === 'us') {
    return Math.round((value * KRWPerUSD) / 10) * 10;
  }

  return value;
}

function convertUSDToKRW(value, KRWPerUSD = 1) {
  return (value / KRWPerUSD).toFixed(2);
}

// 할인율(0~1)을 "15" 형태의 표시용 정수 문자열로 통일.
// 흩어져 있던 (rate*100).toFixed(0) 인라인 산식은 rate가 없으면 "NaN%"를 그렸다.
function displayDiscountRate(rate) {
  return String(Math.round((rate || 0) * 100));
}

function isImageFormat(filename) {
  const _fileExtension = filename.split('.').pop().toLowerCase();

  let isValidFile = false;

  for (let index in allowedImageExtension) {
    if (_fileExtension === allowedImageExtension[index]) {
      isValidFile = true;
      break;
    }
  }

  if (!isValidFile) {
    return false;
  }
  return true;
}

function isVideoFormat(filename) {
  let _fileExtension = filename.split('.').pop().toLowerCase();
  let isValidFile = false;

  for (let index in allowedVideoExtension) {
    if (_fileExtension === allowedVideoExtension[index]) {
      isValidFile = true;
      break;
    }
  }

  if (!isValidFile) {
    return false;
  }
  return true;
}

// FFmpegKit으로 변경된 썸네일 생성 함수
function getThumbnailImageFromVideo(videoUri, second = 1) {
  return new Promise(function (resolve, reject) {
    const now = new Date().getTime();
    let outputPath = `${RNFS.CachesDirectoryPath}/thumbnail_${now}.jpg`;
    if (outputPath.substring(0, 'file://'.length) !== 'file://') {
      outputPath = 'file://' + outputPath;
    }

    const command = `-i "${videoUri}" -ss ${second} -frames:v 1 -filter:v scale="720:-1" ${outputPath}`;

    FFmpegKit.execute(command)
      .then(async (session) => {
        const returnCode = await session.getReturnCode();
        if (ReturnCode.isSuccess(returnCode)) {
          resolve(outputPath);
        } else {
          reject('Thumbnail generation failed');
        }
      })
      .catch(reject);
  });
}

// FFmpegKit으로 변경된 비디오 압축 함수
async function compressVideo(videoUri) {
  return new Promise(async function (resolve, reject) {
    console.log('start compress');
    const now = new Date().getTime();
    let outputPath = `${RNFS.CachesDirectoryPath}/video_${now}.mp4`;

    try {
      const mediaInformation = await FFprobeKit.getMediaInformation(videoUri);
      const streams = mediaInformation.getStreams();
      const videoStream = streams.find((stream) => stream.getCodecType() === 'video');

      if (!videoStream) {
        reject('No video stream found');
        return;
      }

      const width = videoStream.getWidth();
      const height = videoStream.getHeight();
      const rotate = videoStream.getAllProperties().tags?.rotate || '0';

      let command;
      if (width > height && rotate === '0') {
        command = `-i "${videoUri}" -vf scale=1920:-1 -preset ultrafast ${outputPath}`;
      } else {
        command = `-i "${videoUri}" -vf scale=-1:1920 -preset ultrafast ${outputPath}`;
      }

      FFmpegKit.execute(command)
        .then(async (session) => {
          const returnCode = await session.getReturnCode();
          if (ReturnCode.isSuccess(returnCode)) {
            console.log('Compression successful');
            resolve(outputPath);
          } else {
            reject('Compression failed');
          }
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

// FFmpegKit으로 변경된 비디오 트림 함수
async function trimVideo(videoUri, startTime, endTime, onExecution, width = 0, height = 0) {
  return new Promise(async function (resolve, reject) {
    const now = new Date().getTime();
    let outputPath = `${RNFS.CachesDirectoryPath}/video_${now}.mp4`;
    if (outputPath.substring(0, 'file://'.length) !== 'file://') {
      outputPath = 'file://' + outputPath;
    }

    const command = `-i "${videoUri}" -ss ${startTime} -t ${endTime - startTime} -c:v copy -c:a copy ${outputPath} -y`;

    FFmpegKit.executeAsync(command, async (session) => {
      const returnCode = await session.getReturnCode();
      console.log('FFmpeg process exited with rc ' + returnCode);
      if (ReturnCode.isSuccess(returnCode)) {
        resolve(outputPath);
      } else {
        reject('Trim error');
      }
    })
      .then((session) => {
        const sessionId = session.getSessionId();
        onExecution(sessionId);
      })
      .catch(reject);
  });
}

function compressImage(imageUri, mode = 'contain') {
  return new Promise(function (resolve, reject) {
    const now = new Date().getTime();
    let outputPath = `${RNFS.CachesDirectoryPath}/image_${now}.jpg`;
    if (outputPath.substring(0, 'file://'.length) !== 'file://') {
      outputPath = 'file://' + outputPath;
    }
    outputPath = null; // if set outputPath, error on android
    const quality = 80;
    const rotation = 0;
    ImageResizer.createResizedImage(
      imageUri,
      720,
      1280,
      'JPEG',
      quality,
      rotation,
      outputPath,
      false,
      { mode: mode, onlyScaleDown: true },
    )
      .then((response) => {
        resolve(response.uri);
      })
      .catch(() => {
        reject(null);
      });
  });
}

function resizeImage(imageUri, widthScale, heightScale = widthScale, mode = 'contain') {
  return new Promise(function (resolve, reject) {
    const now = new Date().getTime();
    let outputPath = `${RNFS.CachesDirectoryPath}/image_${now}.jpg`;
    if (outputPath.substring(0, 'file://'.length) !== 'file://') {
      outputPath = 'file://' + outputPath;
    }
    outputPath = null; // if set outputPath, error on android
    const quality = 70;
    const rotation = 0;
    ImageResizer.createResizedImage(
      imageUri,
      widthScale,
      heightScale,
      'JPEG',
      quality,
      rotation,
      outputPath,
      false,
      { mode: mode, onlyScaleDown: true },
    )
      .then((response) => {
        resolve(response.uri);
      })
      .catch(() => {
        reject('Failed resize image');
      });
  });
}

// FFmpegKit으로 변경된 비디오 처리 중단 함수
function stopVideoProcessing(sessionId) {
  FFmpegKit.cancel(sessionId);
}

function fileExtension(url) {
  return url.split('.').pop().split(/\#|\?/)[0];
}

function sumItemsOfObject(obj) {
  return Object.keys(obj).reduce((sum, key) => sum + parseFloat(obj[key] || 0), 0);
}

function isUrl(string) {
  string = string.toLowerCase();
  const urlPattern = new RegExp(
    '^((ft|htt)ps?:\\/\\/)?' + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,})',
  );
  return urlPattern.test(string);
}

function getCategoryTitle(categoryCode) {
  for (const category of Constants.CATEGORY_LIST) {
    if (category.key === categoryCode) {
      return category.title;
    }
  }
  return null;
}

// FFmpegKit으로 변경된 워터마크 함수
function putWatermarkOnVideo(videoUri, userName = '', target = null, onProgress = undefined) {
  return new Promise(async function (resolve, reject) {
    const now = new Date().getTime();
    let outputPath = `${RNFS.CachesDirectoryPath}/video_${now}.mp4`;
    let watermarkFile = 'watermark_52.png';
    let wartermarkRequiredSource = require('../../Resources/img/watermark_52.png');
    let fontSize = 28;
    let watermarkRatio = 1;

    try {
      const mediaInformation = await FFprobeKit.getMediaInformation(videoUri);
      console.log('FFprobeKit.getMediaInformation', mediaInformation);
      const streams = mediaInformation.getStreams();
      const videoStream = streams.find((stream) => stream.getCodecType() === 'video');

      if (!videoStream) {
        reject('No video stream found');
        return;
      }

      const width = videoStream.getWidth();
      const height = videoStream.getHeight();
      const properties = videoStream.getAllProperties();
      const rotate = properties.tags?.rotate || '0';
      const duration = parseFloat(videoStream.getDuration() || '0');
      const durationMs = Math.floor(duration * 1000);

      if (outputPath.substring(0, 'file://'.length) !== 'file://') {
        outputPath = 'file://' + outputPath;
      }

      let fontpath =
        Platform.OS === 'ios'
          ? RNFS.MainBundlePath + '/fonts/NanumBarunGothic.ttf'
          : '/system/fonts/DroidSans.ttf';

      if (Platform.OS === 'android') {
        await RNFS.copyFileAssets(watermarkFile, RNFS.CachesDirectoryPath + watermarkFile);
      }
      let watermarkUri =
        Platform.OS === 'ios'
          ? Image.resolveAssetSource(wartermarkRequiredSource).uri
          : RNFS.CachesDirectoryPath + watermarkFile;

      let outputWidth = width,
        outputHeight = height;
      const maxSize = Constants.MAX_SCALE_VIDEO;
      if (width > height && width > maxSize) {
        outputWidth = maxSize;
        outputHeight = parseInt(height * (maxSize / width), 10);
        if (outputHeight % 2 === 1) {
          outputHeight -= 1;
        }
      } else if (width <= height && height > maxSize) {
        outputHeight = maxSize;
        outputWidth = parseInt(width * (maxSize / height), 10);
        if (outputWidth % 2 === 1) {
          outputWidth -= 1;
        }
      } else {
        if (outputWidth % 2 === 1) {
          outputWidth -= 1;
        } else if (outputHeight % 2 === 1) {
          outputHeight -= 1;
        }
      }

      let positionLogo = 'W-w-12:H-h-60';
      let positionUsername = 'x=w-text_w-18: y=h-text_h-20';
      if (target === Constants.SHARE_REVIEW_TO.INSTAGRAM) {
        if (width > height && rotate === '0') {
          watermarkRatio = height / 1080;
          positionLogo = `(W+H)/2-w-12:H-h-${Math.floor(52 * 1.5 * watermarkRatio)}`;
          positionUsername = `x=(w+h)/2-text_w-18: y=h-text_h-${Math.floor(20 * watermarkRatio)}`;
        } else {
          watermarkRatio = width / 1080;
          positionLogo = `W-w-12:(H+W)/2-h-${Math.floor(52 * 1.5 * watermarkRatio)}`;
          positionUsername = `x=w-text_w-18: y=(w+h)/2-text_h-${Math.floor(20 * watermarkRatio)}`;
        }
      }

      const command = `-i "${videoUri}" -i "${watermarkUri}" -c:a copy -vcodec libx264 -preset superfast -filter_complex "[1]colorchannelmixer=aa=0.8,scale=-1:${Math.floor(52 * 1.5 * watermarkRatio)}[wm];[0:v][wm]overlay=${positionLogo}, drawtext=fontfile='${fontpath}':text='@${userName}': fontcolor=white@0.8: fontsize=${fontSize * 1.5 * watermarkRatio}: box=1: boxcolor=black@0.0: boxborderw=5: ${positionUsername}" ${outputPath} -y`;

      FFmpegKit.executeAsync(command, async (session) => {
        const returnCode = await session.getReturnCode();
        if (ReturnCode.isSuccess(returnCode)) {
          onProgress(1);
          resolve(outputPath);
        } else {
          reject('Watermark error');
        }
      })
        .then((session) => {
          const sessionId = session.getSessionId();

          // 통계 콜백 설정
          const statisticsCallback = (statistics) => {
            if (sessionId === statistics.getSessionId()) {
              const time = statistics.getTime();
              onProgress(time / durationMs);
            }
          };

          FFmpegKitConfig.enableStatisticsCallback(statisticsCallback);
        })
        .catch((err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
}

function shareVideo(videoUri, message = null, target = null) {
  return new Promise(async function (resolve, reject) {
    if (Platform.OS === 'ios') {
      videoUri = await CameraRoll.save(videoUri, 'video');
    }

    if (target) {
      const shareOptions = {
        social: target,
        url: videoUri,
        type: 'video/mp4',
      };
      Share.shareSingle(shareOptions)
        .then((res) => {
          res.videoUri = videoUri;
          resolve(res);
        })
        .catch((err) => {
          reject(err);
          Sentry.captureException(err);
        });
    } else {
      Share.open({
        url: videoUri,
        message: message,
      });
    }
  })
    .then((res) => console.log('shareVideo result', res))
    .catch((err) => {
      console.log('shareVideo err', err);
    });
}

// FFmpegKit으로 변경된 비디오 정보 함수
async function getVideoInfo(videoUri) {
  try {
    const mediaInformation = await FFprobeKit.getMediaInformation(videoUri);
    return mediaInformation.getMediaProperties();
  } catch (error) {
    throw error;
  }
}

// FFmpegKit으로 변경된 미디어 스트림 함수
async function getMediaStreams(videoUri) {
  try {
    const mediaInformation = await FFprobeKit.getMediaInformation(videoUri);
    return mediaInformation.getStreams().map((stream) => {
      return stream.getAllProperties();
    });
  } catch (error) {
    throw error;
  }
}

function checkPermissionToAccessGallery() {
  console.log('Platform', Platform);
  return new Promise(async function (resolve, reject) {
    const permissionRes = await checkPermission(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : Platform.OS === 'android' && Platform.Version >= 33
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    );

    if (permissionRes === RESULTS.BLOCKED) {
      reject(Strings.REJECTED_PERMISSION_GALLERY_MESSAGE);
      return;
    } else if (permissionRes === RESULTS.DENIED) {
      Alert.alert(Strings.REQUEST_PERMISSION, Strings.PERMISSION_GALLERY_MESSAGE, [
        {
          text: Strings.OK,
          onPress: async () => {
            if (Platform.OS === 'android' && Platform.Version >= 33) {
              const requested2 = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
              console.log('requested2', requested2);
            }

            resolve(2);
          },
        },
      ]);
    } else if (permissionRes === RESULTS.GRANTED) {
      resolve(1);
      return;
    } else if (permissionRes === RESULTS.LIMITED) {
      resolve(1);
      return;
    }
  });
}

async function scheduleBackgroundTask({ onTask, interval = 1000 }) {
  if (onTask == null) {
    console.log('ERROR: onTask is not passed!!!');
    return;
  }

  const id = new Date().getTime();
  uploadingTaskQueue.push({
    id: id,
    status: IDLE,
    task: onTask,
  });
  if (uploadingTaskQueue.length === 1) {
    BackgroundTimer.runBackgroundTimer(async () => {
      const taskIndex = 0;
      if (uploadingTaskQueue.length !== 0 && uploadingTaskQueue[taskIndex].status === IDLE) {
        uploadingTaskQueue[taskIndex].status = BUSY;
        console.log('[BackgroundFetch] task : ', uploadingTaskQueue[0].id);
        await uploadingTaskQueue[taskIndex].task();

        uploadingTaskQueue.splice(taskIndex, 1);
        if (uploadingTaskQueue.length === 0) {
          BackgroundTimer.stopBackgroundTimer();
        }
      }
    }, interval);
  }
}

function simpleNotification({
  data = {
    type: 'default',
  },
  title,
  description,
  thumbnailUrl,
}) {
  PushNotification.localNotification({
    channelId: Codes.NOTIFICATION_CHENNEL_ID,
    autoCancel: true,
    bigText: description,
    title: title,
    message: description,
    largeIcon: 'notification_icon',
    largeIconUrl: thumbnailUrl,
    bigLargeIcon: 'notification_icon',
    bigLargeIconUrl: thumbnailUrl,
    vibrate: true,
    vibration: 300,
    playSound: true,
    soundName: 'default',
    data: data,
    userInfo: data,
  });
}

function checkTextFormat({ type, value }) {
  let regId = /^[0-9a-zA-Z_.]*$/;
  let regEmail =
    /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[0-9a-zA-Z]*$/;
  let regPhone = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
  switch (type) {
    case 'id':
      // value가 없거나 빈 문자열이면 길이 검사를 통과해버리던 버그 수정
      if (!value) {
        return { code: 'fail', msg: 'Exceed specified length' };
      }
      value = value.toLowerCase();
      if (value.length < 3 || value.length > 16) {
        return { code: 'fail', msg: 'Exceed specified length' };
      }
      if (!regId.test(value)) {
        return { code: 'fail', msg: 'invalid format' };
      }
      return { code: 'success' };
    case 'email':
      if (!value || value.length === 0) {
        return { code: 'success' };
      }
      if (!regEmail.test(value)) {
        return { code: 'fail', msg: 'invalid format' };
      }
      return { code: 'success' };
    case 'phone':
      if (!value || value.length === 0) {
        return { code: 'success' };
      }
      if (!regPhone.test(value)) {
        return { code: 'fail', msg: 'invalid format' };
      }
      return { code: 'success' };
    default:
      break;
  }
  return { code: 'fail', msg: 'invalid type' };
}

function convertKrwToUsd(priceKrw, currencyRate) {
  return Number((priceKrw / (currencyRate || Constants.KRW_PER_USD)).toFixed(2));
}

function compareVersion(verA, verB) {
  let compareResult = false;

  verA = verA.split('.');
  verB = verB.split('.');

  const length = Math.max(verA.length, verB.length);

  for (let i = 0; i < length; i += 1) {
    const a = verA[i] ? parseInt(verA[i], 10) : 0;
    const b = verB[i] ? parseInt(verB[i], 10) : 0;

    if (a > b) {
      compareResult = true;
      break;
    }
    if (a < b) {
      // 상위 자리에서 이미 작으면 더 볼 필요 없음 — 없으면 1.0.5 > 1.2.0 오판정
      break;
    }
  }
  return compareResult;
}

function isFirstVersionLarger(v1, v2) {
  let v1Parts = v1.split('.').map(Number);
  let v2Parts = v2.split('.').map(Number);

  let maxParts = Math.max(v1Parts.length, v2Parts.length);
  v1Parts.push(...Array(maxParts - v1Parts.length).fill(0));
  v2Parts.push(...Array(maxParts - v2Parts.length).fill(0));

  for (let i = 0; i < maxParts; i++) {
    if (v1Parts[i] > v2Parts[i]) {
      return true;
    } else if (v2Parts[i] > v1Parts[i]) {
      return false;
    }
  }

  return false;
}

async function checkUpdateAndAlert() {
  const { success, version } = await APIprovider.getVersionCode({ type: 'ios' });

  const storeVersion = (await checkVersion()).version;
  const currentVersion = deviceInfoModule.getVersion();
  const needsUpdate_ = isFirstVersionLarger(storeVersion, currentVersion);

  if (needsUpdate_) {
    Alert.alert(
      Strings.UPDATE_NOTICE,
      Strings.UPDATE_NOTICE_BODY,
      [
        {
          text: Strings.UPDATE,
          onPress: () => {
            Linking.openURL(Constants.DOWNLOAD_URL);
          },
        },
      ],
      { cancelable: true },
    );
  }
}

async function getCurrentDeviceVersion() {
  return deviceInfoModule.getVersion();
}

function isValidURL(str) {
  let pattern = new RegExp(
    '^(https?:\\/\\/)' +
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
      '((\\d{1,3}\\.){3}\\d{1,3}))' +
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
      '(\\?[;&a-z\\d%_.~+=-]*)?' +
      '(\\#[-a-z\\d_]*)?$',
    'i',
  );
  return !!pattern.test(str);
}

export function getTierNameByClass(tierNumber) {
  return Object.keys(Constants.TIER_COLORS).reverse()[tierNumber];
}
export function getTierColorByTierName(tierName) {
  return Constants.TIER_COLORS[tierName];
}

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export function getMaxima(data) {
  const groupedData = Object.keys(data[0]).reduce((memo, key) => {
    memo[key] = data.map((d) => d[key]);
    return memo;
  }, {});

  return Object.keys(groupedData).reduce((memo, key) => {
    memo[key] = Math.max(...groupedData[key]);
    return memo;
  }, {});
}

export function processData(data) {
  const maxByGroup = getMaxima(data);
  const makeDataArray = (d) => {
    return Object.keys(d).map((key) => {
      return { x: key, y: d[key] / maxByGroup[key] };
    });
  };
  return data.map((datum) => makeDataArray(datum));
}

export function changeCurrency({ current, currencyRate }) {
  if (getLanguage() === 'en') {
    // 환율 로딩 전(초기값 0/undefined)에는 Infinity/NaN이 되므로 상수로 폴백
    const rate = currencyRate || Constants.KRW_PER_USD;
    return +(current / rate).toFixed(2);
  }

  return +current;
}

export function isGuestUser(logonUserId) {
  const {
    user: { isGuest },
  } = store.getState();

  // 게스트 로그인 경로가 세팅하는 redux 플래그도 판정에 사용한다 —
  // 하드코딩 계정 ID가 서버에서 바뀌어도 가드가 무력화되지 않도록 이중 방어
  if (isGuest === true) {
    return true;
  }

  if (
    logonUserId === '640a908e092ea7d56d4a41d5' ||
    logonUserId === '63a126963389e30449162c3b' ||
    !logonUserId
  ) {
    return true;
  }

  return false;
}

export const menuLogout = async function (props) {
  console.log('menuLogout 발동!');
  console.log(props.route?.params?.videoId);
  console.log(props.route?.params?.productId);

  if (!props.route.path) {
    if (props.route?.params?.videoId) {
      props.route.path = `videos/${props.route.params.videoId}`;
    } else if (props.route?.params?.productId) {
      props.route.path = `products/${props.route.params.productId}`;
    }
  }
  console.log('props.route.path', props.route.path);

  const authType = await Preference.get('userAuthType');

  if (authType === 'kakao') {
    KakaoLogout();
  } else if (authType === 'facebook') {
  } else if (authType === 'google') {
    GoogleSignin.signOut();
  } else if (authType === 'apple') {
  }
  APIprovider.clearRequester();
  Preference.set('userId', null);
  Preference.set('userName', '');
  Preference.set('userProfilePicUrl', '');
  Preference.set('userIsSeller', '');
  Preference.set('userAccessToken', null);
  Preference.set('userAuthType', null);
  Preference.set('makeOrderBuyerName', null);
  Preference.set('makeOrderBuyerPhone', null);
  Preference.set('makeOrderBuyerEmail', null);
  Preference.set('makeOrderBuyerMemo', null);
  Preference.set('makeOrderReceiverName', null);
  Preference.set('makeOrderReceiverPhone', null);
  Preference.set('makeOrderAddress', null);
  Preference.set('agreementToTermsOfService', null);
  // 기기 잔존 PII(주소·전화·프로필·시딩) 클리어 — 공용 기기 대비 (보안 감사 H7).
  // 게이트 통과 상태는 유지 — 초대 코드는 1회성이라 지우면 재입장이 막힌다 (계정 삭제만 전체 클리어)
  clearGreydLocalData({ keepGate: true });

  Preference.set('previousPage', props.route.path);

  // setter가 없는 라우트(캠페인 상세 등)에서 호출돼도 크래시하지 않도록 ?.() 사용
  props?.route?.params?.setLogonUserId?.(null);
  props?.route?.params?.setLogonUserName?.('');
  props?.route?.params?.setLogonUserProfilePicUrl?.('');
  props?.route?.params?.setLogonUserIsSeller?.('false');
  props?.navigation.navigate('NotSignedIn');
  props?.navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'NotSignedIn' }],
    }),
  );

  store.dispatch(setGuest({ isGuest: false }));
};

export const LogoutAlert = (props) => {
  return Alert.alert(
    Strings.GUEST_USER_ALERT_TITLE,
    Strings.GUEST_USER_ALERT_CONTENT,
    [
      { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
      { text: 'OK', onPress: () => menuLogout(props) },
    ],
    { cancelable: false },
  );
};

export const getIPhoneHeaderMarginTop = () => {
  return getStatusBarHeight();
};

export const getKRWPerUSD = async () => {
  try {
    // Preference는 문자열을 반환하고 최초 실행 시엔 값이 없다 — 숫자+상수 폴백 보장
    const value = await Preference.get('KRW/USD');
    return Number(value) || Constants.KRW_PER_USD;
  } catch (error) {
    console.log(error);
    return Constants.KRW_PER_USD;
  }
};

export const getLanguageFromLocation = () => {
  const {
    user: { countryCode },
  } = store.getState();

  if (!countryCode) {
    return getLanguage();
  }

  return countryCode === 'KR' ? 'ko' : 'en';
};

export const setCountryFromLocation = () => {
  Geolocation.getCurrentPosition((geolocationInfo) => {
    const { latitude, longitude } = geolocationInfo.coords;
    APIprovider.getGoogleMapApiKey().then((res) => {
      if (res && res.success) {
        const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?key=${res.apiKey}&latlng=`;
        const url = `${apiUrl}${latitude},${longitude}`;
        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            // 지오코딩 실패(ZERO_RESULTS, 쿼터 초과 등) 시 results가 비어 있을 수 있다
            const countryInfo = data?.results?.[0]?.address_components?.find((component) =>
              component.types.includes('country'),
            );

            if (countryInfo?.short_name) {
              store.dispatch(setCountryCode({ countryCode: countryInfo.short_name }));
            }
          })
          .catch((error) => {
            console.log('Error:', error);
          });
      }
    });
  });
};

export const getFormattedDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const pageRoutingFunctions = {
  products: (navigation, productId) => {
    navigation.navigate('ProductPage', { productId });
  },
  users: (navigation, userParams) => {
    const [pageOwnerUserId, pageOwnerUserName] = userParams.split(':');

    navigation.navigate('UserPage', { pageOwnerUserId, pageOwnerUserName });
  },
  myPage: (navigation) => {
    navigation.navigate('UserPage');
  },
  videos: (navigation, videoId) => {
    navigation.navigate('VideoPage', { videoId });
  },
};

export const initializeFBPixel = async () => {
  if (Platform.OS === 'ios') {
    const ATT_CHECK = await checkPermission(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
    if (ATT_CHECK === RESULTS.DENIED) {
      try {
        const ATT = await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
        if (ATT === RESULTS.GRANTED) {
          Settings.setAdvertiserTrackingEnabled(true).then(() => {
            Settings.initializeSDK();
          });
        }
      } catch (error) {
        throw error;
      } finally {
        Settings.initializeSDK();
      }
      Settings.initializeSDK();
      Settings.setAdvertiserTrackingEnabled(true);
    }
  } else {
    Settings.initializeSDK();
    Settings.setAdvertiserTrackingEnabled(true);
  }
};

export const accountRegistrationFBPixel = (params) => {
  AppEventsLogger.logEvent('Account Registration', params);
};

export const purchaseFBPixel = ({ order, currency, price }) => {
  AppEventsLogger.logPurchase(price || order.totalPrice, currency, {
    orderId: order._id,
    buyerName: order.buyerName,
    buyerEmail: order.buyerEmail,
    buyerPhone: order.buyerPhone,
    receiverName: order.receiverName,
    receiverPhone: order.receiverPhone,
    buyerMemo: order.buyerMemo,
    address: order.address,
    shipmentCost: order.shipmentCost,
    rewardUse: order.rewardUse,
    discountCode: order.discountCode,
    promotionDiscount: order.promotionDiscount,
  });
};

export const videoWatchedFBPixel = (data) => {
  AppEventsLogger.logEvent(AppEventsLogger.AppEvents.ViewedContent, {
    [AppEventsLogger.AppEventParams.ContentID]: data._id,
    url: data.videoUrl,
    videoId: data._id,
    thumbnailUrl: data.thumbnailUrl,
    title: data.title,
  });
};

export const debounce = (callback, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
};

export function isASCII(str) {
  return /^[\x00-\x7F]*$/.test(str);
}

export default {
  SHA256,
  isNumeric,
  stringShorten,
  timestampToDatetime,
  timestampToAgo,
  timestampToDday,
  numberWithCommas,
  getFileNameWithDate,
  displayPrice,
  displayDiscountRate,
  isImageFormat,
  isVideoFormat,
  getThumbnailImageFromVideo,
  compressVideo,
  trimVideo,
  stopVideoProcessing,
  resizeImage,
  compressImage,
  fileExtension,
  sumItemsOfObject,
  isUrl,
  getCategoryTitle,
  putWatermarkOnVideo,
  shareVideo,
  getVideoInfo,
  checkPermissionToAccessGallery,
  scheduleBackgroundTask,
  simpleNotification,
  checkTextFormat,
  convertKrwToUsd,
  checkUpdateAndAlert,
  getMediaStreams,
  getCurrentDeviceVersion,
  isValidURL,
  getTierNameByClass,
  getTierColorByTierName,
  capitalizeFirstLetter,
  getKRWPerUSD,
  getLanguageFromLocation,
  setCountryFromLocation,
  displayPriceNumber,
  convertKRWUSD,
  convertUSDToKRW,
  isGuestUser,
  LogoutAlert,
};
