import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { Interest } from '../../domain/interest';
import { ThemeProvider } from '../../theme';
import InterestListItem from '../InterestListItem';

const INTEREST: Interest = {
  id: 'interest-1',
  title: 'Learn violin',
  type: null,
  state: 'InProgress',
  archivedAt: null,
  typeSkippedAt: null,
  dueBy: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('InterestListItem', () => {
  it('renders the state through displayLabel, spaced, not the raw enum value', async () => {
    const { getByText, queryByText } = await render(
      (
        <ThemeProvider>
          <InterestListItem interest={INTEREST} onPress={jest.fn()} />
        </ThemeProvider>
      ) as ReactElement,
    );

    expect(getByText('In progress')).toBeTruthy();
    expect(queryByText('InProgress')).toBeNull();
  });
});
