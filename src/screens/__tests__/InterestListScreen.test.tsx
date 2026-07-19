import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { Interest } from '../../domain/interest';
import { constraintService } from '../../services/ConstraintService';
import { interestService } from '../../services/InterestService';
import { ThemeProvider } from '../../theme';
import InterestListScreen from '../InterestListScreen';

function makeInterest(overrides: Partial<Interest> = {}): Interest {
  return {
    id: 'interest-1',
    title: 'Learn violin',
    type: null,
    state: 'Backlog',
    archivedAt: null,
    typeSkippedAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

async function renderScreen(navigation: {
  navigate: jest.Mock;
}): Promise<ReturnType<typeof render>> {
  const props = {
    navigation,
    route: { key: 'InterestList', name: 'InterestList' },
  } as unknown as Parameters<typeof InterestListScreen>[0];

  return render(
    (
      <ThemeProvider>
        <NavigationContainer>
          <InterestListScreen {...props} />
        </NavigationContainer>
      </ThemeProvider>
    ) as ReactElement,
  );
}

describe('InterestListScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows inline feedback when loading interests fails', async () => {
    jest.spyOn(interestService, 'list').mockRejectedValueOnce(new Error('boom'));
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    expect(await findByText('Could not load interests. Please try again.')).toBeTruthy();
  });

  it('shows the nudge banner when an interest needs enrichment', async () => {
    jest
      .spyOn(interestService, 'list')
      .mockResolvedValueOnce([
        makeInterest({ id: 'interest-1', type: 'OneTimeProject', typeSkippedAt: null }),
      ]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValueOnce(new Set(['interest-1']));
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    expect(await findByText('Got a minute? 1 seeds could tell me more')).toBeTruthy();
  });

  it('hides the banner when nothing needs enrichment', async () => {
    jest
      .spyOn(interestService, 'list')
      .mockResolvedValueOnce([
        makeInterest({ id: 'interest-1', type: 'OneTimeProject', typeSkippedAt: null }),
      ]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValueOnce(new Set());
    const navigation = { navigate: jest.fn() };

    const { queryByText, findByText } = await renderScreen(navigation);

    await findByText('Learn violin');
    expect(queryByText(/Got a minute/)).toBeNull();
  });

  it('dismisses the banner and does not re-show it', async () => {
    jest
      .spyOn(interestService, 'list')
      .mockResolvedValueOnce([
        makeInterest({ id: 'interest-1', type: 'OneTimeProject', typeSkippedAt: null }),
      ]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValueOnce(new Set(['interest-1']));
    const navigation = { navigate: jest.fn() };

    const { findByText, queryByText } = await renderScreen(navigation);

    await findByText('Got a minute? 1 seeds could tell me more');

    await act(async () => {
      fireEvent.press(await findByText('✕'));
    });

    expect(queryByText(/Got a minute/)).toBeNull();
  });

  it('makes exactly one needsEnrichment call regardless of list size', async () => {
    jest
      .spyOn(interestService, 'list')
      .mockResolvedValueOnce([
        makeInterest({ id: 'interest-1', title: 'Learn violin', type: 'OneTimeProject' }),
        makeInterest({ id: 'interest-2', title: 'Bake bread', type: 'OneTimeProject' }),
        makeInterest({ id: 'interest-3', title: 'Build shelves', type: 'OneTimeProject' }),
      ]);
    const needsEnrichmentSpy = jest
      .spyOn(constraintService, 'needsEnrichment')
      .mockResolvedValueOnce(new Set());
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    await findByText('Build shelves');

    expect(needsEnrichmentSpy).toHaveBeenCalledTimes(1);
    expect(needsEnrichmentSpy).toHaveBeenCalledWith(
      ['interest-1', 'interest-2', 'interest-3'],
      ['Time', 'Supplies', 'Location', 'Social', 'WeatherSeason'],
    );
  });
});
