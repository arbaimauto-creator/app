import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';

import BlockedUserItemView from './BlockedUserItemView';
import APIprovider from './APIprovider';
import Strings from './Strings';
import Constants from './Constants';
import HeaderLeftBackButton from './CustomComponents/headerBackButton/headerLeftBackButton';
import Animated from 'react-native-reanimated';
import { moderateScale } from './utils/scailing';

function BlockedUserListScreen(props) {
  const [blockedUserList, setBlockedUserList] = useState([]);
  const [isRefreshing, setRefreshing] = useState(false);

  const getBlockedUserList = async () => {
    const userList = await APIprovider.getBlockedUserList();
    if (Array.isArray(userList)) {
      setBlockedUserList(userList);
    }
  };

  const onListEndReached = async () => {
    if (blockedUserList.length === 0) {
      return;
    }
    const offset = blockedUserList[blockedUserList.length - 1].createdAt;
    setRefreshing(true);
    try {
      const additionalBlockedUserList = await APIprovider.getBlockedUserList(offset);
      if (Array.isArray(additionalBlockedUserList)) {
        setBlockedUserList([...blockedUserList, ...additionalBlockedUserList]);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // props.navigation.setOptions({
  //   title: Strings.BLOCKED_ACCOUNT,
  // });

  useEffect(() => {
    props.navigation.setOptions({
      title: Strings.BLOCKED_ACCOUNT,
      headerLeft: () => HeaderLeftBackButton({ navigation: props.navigation }),
      headerTintColor: Constants.TIER_COLORS.ARTISAN,
      headerTitleStyle: {
        fontSize: moderateScale(20),
        fontFamily: Constants.CUSTOM_FONTS.SCDREAM.SEMIBOLD_6,
      },
    });

    getBlockedUserList();
  }, [props.navigation]);
  return (
    <SafeAreaView style={styles.container} contentContainerStyle={{ flex: 1 }}>
      <Animated.FlatList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        data={blockedUserList}
        renderItem={({ item }) => {
          return <BlockedUserItemView {...props} item={item.targetUserId} />;
        }}
        keyExtractor={(item) => item.id}
        onRefresh={() => {
          getBlockedUserList();
        }}
        onEndReached={({ distanceFromEnd }) => {
          if (blockedUserList.length >= 10 && isRefreshing === false) {
            onListEndReached();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshing={isRefreshing}
        style={{ marginTop: 20 }}
      />
    </SafeAreaView>
  );
}

export default BlockedUserListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.COLOR_BACKGROUND_DARK,
  },
  scene: {
    flex: 1,
  },
  tabLabelStyle: {
    color: Constants.TIER_COLORS.ARTISAN,
  },
  header: {
    padding: 5,
  },
  tabBarLabelFocused: {
    color: Constants.TIER_COLORS.ARTISAN,
    fontSize: 21,
    fontWeight: 'bold',
  },
  tabBarLabel: {
    color: 'rgb(128, 128, 128)',
    fontSize: 21,
    fontWeight: 'bold',
  },
  divider: {
    height: 0,
    backgroundColor: Constants.TIER_COLORS.STRIVER,
    marginTop: 10,
  },
});

/*
[
    {
        "_id": "6188f67507ffa83f849335c1",
        "requesterId": "6184a1cf5a419d27688a5da0",
        "targetUserId": {
            "introduction": "하이하이",
            "_id": "609948750df8c4732fd6a8bd",
            "name": "sesilll",
            "userId": "609948750df8c4732fd6a8bd",
            "ratingCount": 0,
            "id": "609948750df8c4732fd6a8bd"
        },
        "id": "6188f67507ffa83f849335c1"
    },
    {
        "_id": "6188f4f507ffa83f84933596",
        "requesterId": "6184a1cf5a419d27688a5da0",
        "targetUserId": {
            "introduction": "안녕하세요",
            "_id": "5ffebd7340bbb46474bceb8a",
            "name": "sesil",
            "userId": "5ffebd7340bbb46474bceb8a",
            "ratingCount": 0,
            "id": "5ffebd7340bbb46474bceb8a"
        },
        "id": "6188f4f507ffa83f84933596"
    },
    {
        "_id": "6188e46207ffa83f8493344a",
        "requesterId": "6184a1cf5a419d27688a5da0",
        "targetUserId": {
            "introduction": "혁신(Renovation)적인 라이프 스타일,\n리노베라 since 2002",
            "_id": "610a9c89c48fa72335c5369f",
            "name": "RENOVERA",
            "userId": "610a9c89c48fa72335c5369f",
            "ratingCount": 0,
            "id": "610a9c89c48fa72335c5369f"
        },
        "id": "6188e46207ffa83f8493344a"
    },
    {
        "_id": "6184f533a512450dcc37d844",
        "requesterId": "6184a1cf5a419d27688a5da0",
        "targetUserId": {
            "introduction": "",
            "_id": "61302141c38f9e2d52b288e2",
            "name": "Jay.P",
            "userId": "61302141c38f9e2d52b288e2",
            "ratingCount": 0,
            "id": "61302141c38f9e2d52b288e2"
        },
        "id": "6184f533a512450dcc37d844"
    },
    {
        "_id": "6184eaf3a78fad2eb4a1d686",
        "requesterId": "6184a1cf5a419d27688a5da0",
        "targetUserId": {
            "introduction": "아이들의 장난감 리뷰어",
            "_id": "60eeb3d6d68f28753dce6938",
            "name": "Seungwoo",
            "userId": "60eeb3d6d68f28753dce6938",
            "ratingCount": 0,
            "id": "60eeb3d6d68f28753dce6938"
        },
        "id": "6184eaf3a78fad2eb4a1d686"
    }
]
*/
