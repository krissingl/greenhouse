import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { Interest } from '../../domain/interest';
import { interestService } from '../../services/InterestService';
import { ThemeProvider } from '../../theme';
import EditInterestScreen from '../EditInterestScreen';

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
  goBack: jest.Mock;
}): Promise<ReturnType<typeof render>> {
  const props = {
    navigation,
    route: { key: 'EditInterest', name: 'EditInterest', params: { interestId: INTEREST.id } },
  } as unknown as Parameters<typeof EditInterestScreen>[0];

  return render(
    <ThemeProvider>
      <EditInterestScreen {...props} />
    </ThemeProvider> as ReactElement,
  );
}

describe('EditInterestScreen', () => {
  it('shows inline feedback when loading the interest fails', async () => {
    jest.spyOn(interestService, 'get').mockRejectedValueOnce(new Error('boom'));
    const navigation = { goBack: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    expect(
      await findByText('Could not load this interest. Please try again.'),
    ).toBeTruthy();
  });

  it('shows inline feedback and does not navigate back when saving fails', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(interestService, 'update').mockRejectedValueOnce(new Error('boom'));
    const navigation = { goBack: jest.fn() };

    const { findByText, findByDisplayValue, getByText } = await renderScreen(navigation);

    await findByDisplayValue('Learn violin');

    await act(async () => {
      fireEvent.press(getByText('Save'));
    });

    expect(
      await findByText('Could not save this interest. Please try again.'),
    ).toBeTruthy();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
