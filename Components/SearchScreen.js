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
        <View style={styles.emptyMessageContainer}>
          <InstaGrid columns={3} navigation={this.props.navigation} />
        </View>
      );
    }
  }

  renderSearchMain() {
    return (
      <View style={styles.emptyMessageContainer}>
        <Text style={styles.emptyMessage}>{Strings.INPUT_SEARCH_KEYWORD}</Text>
      </View>
    );
  }

  render() {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: Constants.COLOR_BACKGROUND_DARK,
            paddingTop: Platform.OS === 'ios' ? 0 : 40,
          },
        ]}
      >
        <View style={{ ...styles.header, flexDirection: 'row' }}>
          {Platform.OS === 'ios' ? (
            <HeaderLeftBackButton navigation={this.props.navigation} />
          ) : null}
          <SearchBar
            {...Constants.SEARCH_BAR_COMMON_PROPS}
            showCancel={false}
            containerStyle={{
              width: Platform.OS === 'ios' ? '90%' : '100%',
              backgroundColor: Constants.COLOR_BACKGROUND_DARK,
            }}
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
                color: Constants.TIER_COLORS.ARTISAN,
              },
            }}
            onChangeText={this.onChangeText}
            value={this.state.typingSearchKeyword}
            onSubmitEditing={this.onSearchSubmit} // Trigger search when user submits
            onCancel={() => {
              this.props.navigation.pop();
            }}
          />
        </View>
        <View style={{ flex: 1 }} contentContainerStyle={{ flex: 1 }}>
          {this.renderSearchResult()}
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  emptyMessageContainer: {
    marginHorizontal: 15,
    flex: 1,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  emptyMessage: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 18,
  },
});
