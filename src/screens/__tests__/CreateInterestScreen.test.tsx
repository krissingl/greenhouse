import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { interestService } from '../../services/InterestService';
import { ThemeProvider } from '../../theme';
import CreateInterestScreen from '../CreateInterestScreen';

async function renderScreen(navigation: {
  goBack: jest.Mock;
  navigate: jest.Mock;
  replace: jest.Mock;
}): Promise<ReturnType<typeof render>> {
  const props = {
    navigation,
    route: { key: 'CreateInterest', name: 'CreateInterest' },
  } as unknown as Parameters<typeof CreateInterestScreen>[0];

  return render(
    <ThemeProvider>
      <CreateInterestScreen {...props} />
    </ThemeProvider> as ReactElement,
  );
}

describe('CreateInterestScreen', () => {
  it('shows inline feedback and does not navigate away when create fails', async () => {
    jest.spyOn(interestService, 'create').mockRejectedValueOnce(new Error('boom'));
    const navigation = { goBack: jest.fn(), navigate: jest.fn(), replace: jest.fn() };

    const { getByPlaceholderText, getByText, findByText } = await renderScreen(navigation);

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('What do you want to do?'), 'Learn violin');
    });

    await act(async () => {
      fireEvent.press(getByText('Save'));
    });

    expect(await findByText('Could not save this interest. Please try again.')).toBeTruthy();
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('routes into the guided setup flow for the newly created interest on save', async () => {
    jest.spyOn(interestService, 'create').mockResolvedValueOnce({
      id: 'interest-1',
      title: 'Learn violin',
      type: null,
      state: 'Backlog',
      archivedAt: null,
      typeSkippedAt: null,
      dueBy: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    });
    const navigation = { goBack: jest.fn(), navigate: jest.fn(), replace: jest.fn() };

    const { getByPlaceholderText, getByText } = await renderScreen(navigation);

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('What do you want to do?'), 'Learn violin');
    });

    await act(async () => {
      fireEvent.press(getByText('Save'));
    });

    expect(navigation.replace).toHaveBeenCalledWith('GuidedSetup', { interestId: 'interest-1' });
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
