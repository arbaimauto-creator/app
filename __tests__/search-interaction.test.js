import { Alert } from 'react-native';
import APIprovider from '../Components/APIprovider';
import { SearchScreen } from '../Components/SearchScreen';

jest.mock('@react-navigation/native', () => ({ useScrollToTop: jest.fn() }));
jest.mock('react-native-elements', () => ({ SearchBar: 'SearchBar' }));
jest.mock('react-native-fast-image', () => 'FastImage');
jest.mock('../Components/APIprovider', () => ({
  getSearchResult: jest.fn(),
  findVideoByHashTag: jest.fn(),
  isFailure: (value) => !value || value.result === 0,
}));
jest.mock('../Components/Constants', () => ({}));
jest.mock('../Components/CustomComponents/InstaGrid/index', () => 'InstaGrid');
jest.mock('../Components/CustomComponents/headerBackButton/headerLeftBackButton', () => 'Back');
jest.mock('../Components/SearchResultTabView', () => 'Results');

function screen() {
  const instance = new SearchScreen({ route: {}, navigation: {} });
  instance.setState = (value) => {
    instance.state = { ...instance.state, ...value };
  };
  instance.componentDidMount();
  return instance;
}

beforeEach(() => jest.clearAllMocks());

test('search opens without route parameters and ignores empty hashtags', async () => {
  const instance = screen();
  await instance.onChangeText(' # ');
  await instance.onSearchSubmit();
  expect(APIprovider.findVideoByHashTag).not.toHaveBeenCalled();
});

test('a slow previous search cannot replace the latest result', async () => {
  let finishFirst;
  APIprovider.getSearchResult.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishFirst = resolve;
      }),
  );
  const instance = screen();
  await instance.onChangeText('old');
  const first = instance.onSearchSubmit();
  await instance.onChangeText(' new ');
  APIprovider.getSearchResult.mockResolvedValueOnce({ videos: ['new'] });
  await instance.onSearchSubmit();
  finishFirst({ videos: ['old'] });
  await first;
  expect(instance.state.searchKeyword).toBe('new');
  expect(instance.state.searchResultData).toEqual({ videos: ['new'] });
});

test('hashtag failure releases the spinner and lets the user retry', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  APIprovider.findVideoByHashTag.mockRejectedValueOnce(new Error('offline'));
  const instance = screen();
  await instance.onChangeText('#skin');
  await instance.onSearchSubmit();
  expect(instance.state.searching).toBe(false);
  expect(Alert.alert).toHaveBeenCalled();
  APIprovider.findVideoByHashTag.mockResolvedValueOnce({ videos: [] });
  await instance.onSearchSubmit();
  expect(instance.state.searchKeyword).toBe('#skin');
});

test('clearing the field invalidates a pending result', async () => {
  let finish;
  APIprovider.getSearchResult.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const instance = screen();
  await instance.onChangeText('skin');
  const pending = instance.onSearchSubmit();
  await instance.onChangeText('');
  finish({ videos: ['skin'] });
  await pending;
  expect(instance.state.searchResultData).toBeNull();
  expect(instance.state.searching).toBe(false);
});
