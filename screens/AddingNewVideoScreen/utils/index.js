import { LayoutAnimation } from 'react-native';
import RNFS from 'react-native-fs';
import APIprovider from '../../../Components/APIprovider';
import utils from '../../../Components/utils';

export function getThumbnailImageFromVideo(context, time = 0) {
  const { videoUri, uriWithSpaces } = context.state;

  utils
    .getThumbnailImageFromVideo(uriWithSpaces ? uriWithSpaces : videoUri, time)
    .then((result) => {
      context.setState({
        thumbnailUri: result,
      });
      LayoutAnimation.linear();
    })
    .catch((err) => {
      console.log('err : ', err);
    });
}

export async function uploadToGcsBySignedUrl({ videoUri, videoType }, context) {
  try {
    context.setState({ isShowingUploadToGcsProgressModal: true });

    const videoHash = await RNFS.hash(videoUri, 'md5');
    const videoFilename = `${videoHash}.${utils.fileExtension(videoUri)}`;

    const { uploadSignedUrl, filePath } = await APIprovider.getSignedUrl(videoFilename, videoType);
    await APIprovider.uploadFileWithSignedUrl(
      uploadSignedUrl,
      videoUri,
      videoFilename,
      videoType,
      context,
    );
    const { success } = await APIprovider.getFileMetadata(filePath);

    context.setState({
      isShowingUploadToGcsProgressModal: false,
      uploadToGcsProgress: 0,
    });

    if (!success) {
      return {
        success: false,
      };
    }

    return {
      success: true,
      videoUrl: `https://resource.greyd.app/${filePath}`,
      videoPath: filePath,
    };
  } catch (error) {
    console.error('uploadToGcsBySignedUrl error', error);

    context.setState({ isShowingUploadToGcsProgressModal: false });

    return {
      success: false,
      error: error.code,
      message: error.message,
    };
  }
}
