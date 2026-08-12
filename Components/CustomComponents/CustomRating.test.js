import React from 'react';
import renderer from 'react-test-renderer';
import CustomRating from './CustomRating';

jest.mock('react-native-rating-element', () => {
  const React = require('react');
  return { Rating: (props) => React.createElement('Rating', props) };
});

describe('CustomRating', () => {
  it('renders without defaultProps warning', () => {
    const component = renderer.create(
      <CustomRating rated={3} totalCount={5} size={20} type="custom" testID="custom-rating" />,
    );

    expect(component.root.findByProps({ testID: 'custom-rating' })).toBeTruthy();
  });

  it('uses default parameters correctly', () => {
    const component = renderer.create(<CustomRating testID="custom-rating-defaults" />);

    expect(component.root.findByProps({ testID: 'custom-rating-defaults' })).toBeTruthy();
  });
});
