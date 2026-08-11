import * as React from 'react';
import T from '../../Components/Constants/DesignTokens';
import { StyleSheet, View } from 'react-native';
import { ClipPath, Defs, Path, Svg, Image as SvgImage } from 'react-native-svg';

import Constants from '../../Components/Constants';
import { getTierColorByTierName, getTierNameByClass } from '../../Components/utils';
import { ReviewGradeBadgeView } from '../../Components/Views';

export default function UserProfilePicViewUpdate({
  style = {},
  source = { uri: Constants.NO_USER_URL },
  class: userClass = 0,
  showGrade,
  ratingScore,
  ratingCount,
  ...props
}) {
  let classColor = T.COLORS.INK;
  switch (userClass) {
    case 1:
      classColor = Constants.COLOR_USER_CLASS_1;
      break;
    case 2:
      classColor = Constants.COLOR_USER_CLASS_2;
      break;
    case 3:
      classColor = Constants.COLOR_USER_CLASS_3;
      break;
    default:
      classColor = 'rgba(0, 0, 0, 0)';
  }

  const tierName = getTierNameByClass(userClass);
  const tierColor = getTierColorByTierName(tierName);

  const size = style.hasOwnProperty('width')
    ? style.width
    : style.hasOwnProperty('height')
      ? style.height
      : 0;

  if (!source.uri || source.uri === '') {
    source.uri = Constants.NO_USER_URL;
  }

  return React.useMemo(
    () => (
      <View style={style}>
        <View
          style={{
            position: 'absolute',
            borderColor: classColor,
            //             width: size * 13 / 10,
            //             height: size * 13 / 10,
            //             borderRadius: size * 13 / 10,
            //             backgroundColor: classColor,
            //             top: - size * 3 / 20,
            //             left: - size * 3 / 20,
            //             borderWidth: size * 2 / 20,
            width: size + 8,
            height: size + 8,
            borderRadius: size + 8,
            top: -4,
            left: -4,
          }}
        />

        <Svg height={size} width={size} viewBox="0 0 90 100">
          <Defs>
            <ClipPath id="hexagon-profile">
              <Path d="M34.64101615137754 4.999999999999999Q43.30127018922193 0 51.96152422706632 4.999999999999999L77.94228634059948 20Q86.60254037844386 25 86.60254037844386 35L86.60254037844386 65Q86.60254037844386 75 77.94228634059948 80L51.96152422706632 95Q43.30127018922193 100 34.64101615137754 95L8.660254037844387 80Q0 75 0 65L0 35Q0 25 8.660254037844387 20Z" />
            </ClipPath>
          </Defs>
          <SvgImage
            preserveAspectRatio="xMidYMid slice"
            width="90%"
            height="100%"
            href={source}
            clipPath="url(#hexagon-profile)"
          />

          {/* <Path
            // opacity={0.8}
            stroke={'black'}
            strokeWidth={8}
            d="M34.64101615137754 4.999999999999999Q43.30127018922193 0 51.96152422706632 4.999999999999999L77.94228634059948 20Q86.60254037844386 25 86.60254037844386 35L86.60254037844386 65Q86.60254037844386 75 77.94228634059948 80L51.96152422706632 95Q43.30127018922193 100 34.64101615137754 95L8.660254037844387 80Q0 75 0 65L0 35Q0 25 8.660254037844387 20Z"
          /> */}
          <Path
            opacity={0} // 0.8
            stroke={tierColor}
            strokeWidth={1}
            d="M34.64101615137754 4.999999999999999Q43.30127018922193 0 51.96152422706632 4.999999999999999L77.94228634059948 20Q86.60254037844386 25 86.60254037844386 35L86.60254037844386 65Q86.60254037844386 75 77.94228634059948 80L51.96152422706632 95Q43.30127018922193 100 34.64101615137754 95L8.660254037844387 80Q0 75 0 65L0 35Q0 25 8.660254037844387 20Z"
          />
        </Svg>

        {/* <Image
        style={{
          width: size,
          height: size,
          borderRadius: size,
        }}
        source={source}
      /> */}
        {showGrade && (
          <ReviewGradeBadgeView
            type={'user'}
            ratingScore={ratingScore}
            ratingCount={ratingCount}
            containerStyle={styles.reviewGradeBadge}
          />
        )}
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source],
  );
}

const styles = StyleSheet.create({
  reviewGradeBadge: {
    alignSelf: 'center',
    position: 'absolute',
    bottom: -18,
  },
});
