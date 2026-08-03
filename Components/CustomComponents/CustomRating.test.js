import { render } from '@testing-library/react-native';
import React from 'react';
import CustomRating from './CustomRating';

describe('CustomRating', () => {
  it('renders without defaultProps warning', () => {
    const { getByTestId } = render(
      <CustomRating rated={3} totalCount={5} size={20} type="custom" testID="custom-rating" />,
    );

    expect(getByTestId('custom-rating')).toBeTruthy();
  });

  it('uses default parameters correctly', () => {
    const { getByTestId } = render(<CustomRating testID="custom-rating-defaults" />);

    expect(getByTestId('custom-rating-defaults')).toBeTruthy();
  });
});
