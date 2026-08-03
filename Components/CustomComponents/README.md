# CustomRating Component

## Overview
The `CustomRating` component is a wrapper around the `react-native-rating-element` Rating component that eliminates the React Native warning about `defaultProps` being deprecated in function components.

## Problem
The original `react-native-rating-element` package uses `defaultProps` in its Rating component, which generates the following warning in React Native:

```
Warning: Rating: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.
```

## Solution
This wrapper component uses JavaScript default parameters instead of `defaultProps`, which is the recommended approach for React function components.

## Usage
Replace all imports of `Rating` from `react-native-rating-element` with `CustomRating`:

```javascript
// Before
import { Rating } from 'react-native-rating-element';

// After
import CustomRating from '../../Components/CustomComponents/CustomRating';
```

Then replace all `<Rating>` components with `<CustomRating>` in your JSX.

## Props
The component accepts all the same props as the original Rating component:

- `rated` (default: 0) - The current rating value
- `totalCount` (default: 5) - Total number of rating items
- `ratingColor` (default: "#f1c644") - Color of filled rating items
- `ratingBackgroundColor` (default: "#d4d4d4") - Color of empty rating items
- `size` (default: 12) - Size of rating items
- `icon` (default: "ios-star") - Icon name for rating items
- `marginBetweenRatingIcon` (default: 1) - Margin between rating items
- `readonly` (default: false) - Whether the rating is read-only
- `direction` (default: "row") - Direction of rating items
- `type` (default: "icon") - Type of rating display
- `onIconTap` - Callback function when rating item is tapped
- `selectedIconImage` - Custom image for selected rating items
- `emptyIconImage` - Custom image for empty rating items

## Files Updated
The following files have been updated to use `CustomRating`:

- `screens/AddingNewVideoScreen/ProductRating.js`
- `screens/VideoPageScreen/ReviewerRating.js`
- `Components/ProductPageScreen.js`
- `screens/B2BScreen/B2BProductPage.js`
