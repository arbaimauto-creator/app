import React from 'react';
import { Rating as OriginalRating } from 'react-native-rating-element';

const CustomRating = ({
  rated = 0,
  totalCount = 5,
  ratingColor = '#f1c644',
  ratingBackgroundColor = '#d4d4d4',
  size = 12,
  icon = 'ios-star',
  marginBetweenRatingIcon = 1,
  readonly = false,
  direction = 'row',
  type = 'icon',
  onIconTap,
  selectedIconImage,
  emptyIconImage,
  ...props
}) => {
  return (
    <OriginalRating
      rated={rated}
      totalCount={totalCount}
      ratingColor={ratingColor}
      ratingBackgroundColor={ratingBackgroundColor}
      size={size}
      icon={icon}
      marginBetweenRatingIcon={marginBetweenRatingIcon}
      readonly={readonly}
      direction={direction}
      type={type}
      onIconTap={onIconTap}
      selectedIconImage={selectedIconImage}
      emptyIconImage={emptyIconImage}
      {...props}
    />
  );
};

export default CustomRating;
