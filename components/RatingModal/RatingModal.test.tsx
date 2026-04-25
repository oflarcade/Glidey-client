import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { RatingModal } from './RatingModal';

jest.mock('@rentascooter/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@rentascooter/ui', () => ({
  StarRating: ({
    onRatingChange,
  }: {
    onRatingChange?: (rating: number) => void;
  }) => {
    const React = require('react');
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity accessibilityRole="button" onPress={() => onRatingChange?.(5)}>
        <Text>mock-star-rating</Text>
      </TouchableOpacity>
    );
  },
}));

describe('RatingModal', () => {
  it('submits selected rating and trimmed comment', () => {
    const onSubmit = jest.fn();
    const { getByText, getByLabelText } = render(
      <RatingModal visible onSubmit={onSubmit} onDismiss={jest.fn()} />
    );

    fireEvent.press(getByText('mock-star-rating'));
    fireEvent.changeText(getByLabelText('client.review_placeholder'), '  Great ride  ');
    fireEvent.press(getByLabelText('common.submit'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(5, 'Great ride');
  });

  it('calls onDismiss when user presses later action', () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = render(
      <RatingModal visible onSubmit={jest.fn()} onDismiss={onDismiss} />
    );

    fireEvent.press(getByLabelText('common.dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
