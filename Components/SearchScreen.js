import { useScrollToTop } from '@react-navigation/native';
import React from 'react';
import { Alert, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { SearchBar } from 'react-native-elements';
import FastImage from 'react-native-fast-image';
import APIprovider from './APIprovider';
import Constants from './Constants';
import InstaGrid from './CustomComponents/InstaGrid/index';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import SearchResultTabView from './SearchResultTabView';
import Strings from './Strings';
import T from './Constants/DesignTokens';

const { COLORS, RADIUS, FONT, TYPE } = T;

export default function SearchScreenWrapper(props) {
  const ref = React.useRef(null);
  useScrollToTop(ref);
  return <SearchScreen {...props} scrollRef={ref} />;
}

class SearchScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      typingSearchKeyword: '',
      searchKeyword: '',
      filterType: '',
      searchResultData: null,
      searchMainData: null,

      promotionVideoList: [],
      hottestVideoList: [],
      rankerVideoList: [],
      categorizedVideoList: null,

      promotionVideoListIsRefreshing: false,
      hottestVideoListIsRefreshing: false,
      rankerVideoListIsRefreshing: false,
    };
    this.onChangeText = this.onChangeText.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
  }

  componentDidMount() {
    const { hashTag, isHashtagSearch } = this.props.route.params;
    if (hashTag) {
      this.setState({ typingSearchKeyword: '#' + hashTag }, () => {
        if (isHashtagSearch) {
          this.onSearchSubmit();
        }
      });
    }
  }

  async onChangeText(typingSearchKeyword) {
    this.setState({ typingSearchKeyword });
  }

  async onSearchSubmit() {
    const { typingSearchKeyword } = this.state;
    if (typingSearchKeyword.trim() !== '') {
      // Call the search API only when the search is submitted
      if (typingSearchKeyword.startsWith('#')) {
        const result = await APIprovider.findVideoByHashTag(typingSearchKeyword.slice(1));
        this.getSearchResultCallback(result);
      } else {
        this.getSearchResult(typingSearchKeyword);
      }
    }
  }

  getSearchResult(typingSearchKeyword) {
    APIprovider.getSearchResult(typingSearchKeyword)
      .then(this.getSearchResultCallback.bind(this))
      .catch((err) => {
        Alert.alert(
          Strings.FAILED_TO_LOAD_DATA,
          err.errorMsg ? err.errorMsg : '',
          [{ text: Strings.OK }],
          { cancelable: true },
        );
      });
  }

  getSearchResultCallback(data) {
    this.setState({
      searchResultData: data,
      searchKeyword: this.state.typingSearchKeyword,
    });
  }

  renderSearchResult() {
    if (this.state.searchResultData !== null) {
      return (
        <SearchResultTabView
          navigation={this.props.navigation}
          tabData={this.state.searchResultData}
          searchKeyword={this.state.searchKeyword}
          scrollRef={this.props.scrollRef}
        />
      );
    } else if (!this.props.route.params.isHashtagSearch) {
      return (
        <View style={styles.gridContainer}>
          <InstaGrid columns={3} navigation={this.props.navigation} />
        </View>
      );
    }
    return this.renderSearchMain();
  }

  renderSearchMain() {
    return (
      <View style={styles.emptyMessageContainer}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={styles.emptyTitle}>{Strings.INPUT_SEARCH_KEYWORD}</Text>
        <Text style={styles.emptyDesc}>{Strings.SEARCH_EMPTY_DESC}</Text>
      </View>
    );
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {/* 안드로이드도 화면 내 뒤로가기를 노출한다 — 하드웨어 back만 남으면
              검색에서 홈/마이로 돌아갈 수단이 화면에 보이지 않는다 */}
          <HeaderLeftBackButton navigation={this.props.navigation} />
          <SearchBar
            {...Constants.SEARCH_BAR_COMMON_PROPS}
            showCancel={false}
            containerStyle={styles.searchBarContainer}
            inputContainerStyle={styles.searchBarInputContainer}
            inputStyle={styles.searchBarInput}
            placeholderTextColor={COLORS.GREY}
            placeholder={Strings.SEARCH_HASH_TAG_PLACE_HOLDER}
            ref={(search) => (this.search = search)}
            searchIcon={
              <FastImage
                style={styles.headerButton}
                source={require('../Resources/img/icHeaderSearch24.png')}
              />
            }
            cancelIcon={{
              iconProps: {
                color: COLORS.INK,
              },
            }}
            clearIcon={{ iconProps: { color: COLORS.GREY } }}
            onChangeText={this.onChangeText}
            value={this.state.typingSearchKeyword}
            onSubmitEditing={this.onSearchSubmit} // Trigger search when user submits
            onCancel={() => {
              this.props.navigation.pop();
            }}
          />
        </View>
        <View style={styles.body}>{this.renderSearchResult()}</View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
    paddingTop: T.TOP_INSET,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 6,
  },
  headerButton: {
    width: 18,
    height: 18,
  },
  searchBarContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  searchBarInputContainer: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: COLORS.LINE,
    borderRadius: RADIUS.FIELD,
    height: 42,
  },
  searchBarInput: {
    fontFamily: FONT.Medium,
    fontSize: 13.5,
    color: COLORS.INK,
  },
  body: {
    flex: 1,
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  emptyMessageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 34,
  },
  emptyTitle: {
    fontFamily: FONT.ExtraBold,
    fontSize: 15,
    color: COLORS.INK,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptyDesc: {
    ...TYPE.SUB,
    textAlign: 'center',
    lineHeight: 17,
  },
});
