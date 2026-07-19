import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { Interest } from '../../domain/interest';
import { interestService } from '../../services/InterestService';
import { ThemeProvider } from '../../theme';
import InterestDetailScreen from '../InterestDetailScreen';

const INTEREST: Interest = {
  id: 'interest-1',
  title: 'Learn violin',
  type: null,
  state: 'Backlog',
  archivedAt: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

async function renderScreen(navigation: {
  navigate: jest.Mock;
}): Promise<ReturnType<typeof render>> {
  const props = {
    navigation,
    route: { key: 'InterestDetail', name: 'InterestDetail', params: { interestId: INTEREST.id } },
  } as unknown as Parameters<typeof InterestDetailScreen>[0];

  return render(
    <ThemeProvider>
      <NavigationContainer>
        <InterestDetailScreen {...props} />
      </NavigationContainer>
    </ThemeProvider> as ReactElement,
  );
}

describe('InterestDetailScreen', () => {
  it('shows inline feedback and does not navigate away when archiving fails', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(interestService, 'archive').mockRejectedValueOnce(new Error('boom'));
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    await act(async () => {
      fireEvent.press(await findByText('Archive'));
    });

    expect(
      await findByText('Could not update this interest. Please try again.'),
    ).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalledWith('InterestList');
  });

  it('shows inline feedback when loading the interest fails', async () => {
    jest.spyOn(interestService, 'get').mockRejectedValueOnce(new Error('boom'));
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    expect(
      await findByText('Could not load this interest. Please try again.'),
    ).toBeTruthy();
  });
});
