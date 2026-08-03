import { Platform } from 'react-native';
import APIprovider, { version } from '../../Components/APIprovider';
import utils from '../../Components/utils';
export async function getRequestHeader() {
  return {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      version,
      os: Platform.OS,
      'current-version': await utils.getCurrentDeviceVersion(),
    },
    params: {
      requesterToken: APIprovider.requesterToken,
      requesterId: APIprovider.requesterId,
    },
  };
}
