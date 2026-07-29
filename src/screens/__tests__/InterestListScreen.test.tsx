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
    dueBy: null,
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

  it('defaults the state filter to In progress and the type filter to All', async () => {
    const listSpy = jest.spyOn(interestService, 'list').mockResolvedValueOnce([]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValueOnce(new Set());
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);
    await findByText('No interests yet');

    expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ state: 'InProgress' }));
    expect(await findByText('In progress · All')).toBeTruthy();
  });

  it('keeps the active filter summary visible while collapsed, and expands controls on tap', async () => {
    jest.spyOn(interestService, 'list').mockResolvedValue([]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValue(new Set());
    const navigation = { navigate: jest.fn() };

    const { findByText, queryByText } = await renderScreen(navigation);
    await findByText('No interests yet');

    expect(await findByText('In progress · All')).toBeTruthy();
    expect(queryByText('Archived')).toBeNull();

    await act(async () => {
      fireEvent.press(await findByText('In progress · All'));
    });

    expect(await findByText('Archived')).toBeTruthy();
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

  it('shows a Start button on Backlog rows and updates the row in place with no navigation', async () => {
    jest
      .spyOn(interestService, 'list')
      .mockResolvedValue([makeInterest({ id: 'interest-1', state: 'Backlog' })]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValue(new Set());
    jest
      .spyOn(interestService, 'setState')
      .mockResolvedValueOnce(makeInterest({ id: 'interest-1', state: 'InProgress' }));
    const navigation = { navigate: jest.fn() };

    const { findByText, queryByText } = await renderScreen(navigation);

    await act(async () => {
      fireEvent.press(await findByText('Start'));
    });

    expect(interestService.setState).toHaveBeenCalledWith('interest-1', 'InProgress');
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(await findByText('In progress')).toBeTruthy();
    expect(queryByText('Start')).toBeNull();
  });

  it('does not show a Start button for non-Backlog rows', async () => {
    jest
      .spyOn(interestService, 'list')
      .mockResolvedValueOnce([makeInterest({ id: 'interest-1', state: 'InProgress' })]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValueOnce(new Set());
    const navigation = { navigate: jest.fn() };

    const { findByText, queryByText } = await renderScreen(navigation);

    await findByText('Learn violin');
    expect(queryByText('Start')).toBeNull();
  });

  it('keeps the just-started interest in view by switching the state filter to In progress', async () => {
    jest
      .spyOn(interestService, 'list')
      .mockResolvedValue([makeInterest({ id: 'interest-1', state: 'Backlog' })]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValue(new Set());
    jest
      .spyOn(interestService, 'setState')
      .mockResolvedValueOnce(makeInterest({ id: 'interest-1', state: 'InProgress' }));
    const navigation = { navigate: jest.fn() };

    const { findByText, findAllByText } = await renderScreen(navigation);
    await findByText('Learn violin');

    await act(async () => {
      fireEvent.press((await findAllByText('In progress · All'))[0]);
    });
    await act(async () => {
      fireEvent.press((await findAllByText('Backlog'))[0]);
    });

    await act(async () => {
      fireEvent.press(await findByText('Start'));
    });

    expect(await findByText('Learn violin')).toBeTruthy();
    expect((await findAllByText('In progress · All')).length).toBeGreaterThan(0);
  });

  it('requests archived-only interests when the Archived filter is selected', async () => {
    const listSpy = jest.spyOn(interestService, 'list').mockResolvedValue([]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValue(new Set());
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);
    await findByText('No interests yet');

    await act(async () => {
      fireEvent.press(await findByText('In progress · All'));
    });
    await act(async () => {
      fireEvent.press(await findByText('Archived'));
    });

    expect(listSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ archivedOnly: true }),
    );
    expect(listSpy.mock.calls.some(([filter]) => filter?.includeArchived === true)).toBe(false);
  });

  it('groups rows into type sections using the garden-metaphor display names, with Unplanted last', async () => {
    jest.spyOn(interestService, 'list').mockResolvedValueOnce([
      makeInterest({ id: 'interest-1', title: 'Build shelves', type: 'OneTimeProject' }),
      makeInterest({ id: 'interest-2', title: 'Learn violin', type: 'StructuredLearning' }),
      makeInterest({ id: 'interest-3', title: 'Bake bread', type: null }),
    ]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValueOnce(new Set());
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    expect(await findByText('TRIALS')).toBeTruthy();
    expect(await findByText('TRELLISES')).toBeTruthy();
    expect(await findByText('UNPLANTED')).toBeTruthy();
    expect(await findByText('Build shelves')).toBeTruthy();
    expect(await findByText('Learn violin')).toBeTruthy();
    expect(await findByText('Bake bread')).toBeTruthy();
  });

  it('does not render a section header for a type with no matching interests', async () => {
    jest
      .spyOn(interestService, 'list')
      .mockResolvedValueOnce([
        makeInterest({ id: 'interest-1', title: 'Build shelves', type: 'OneTimeProject' }),
      ]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValueOnce(new Set());
    const navigation = { navigate: jest.fn() };

    const { findByText, queryByText } = await renderScreen(navigation);

    await findByText('Build shelves');
    expect(queryByText('TRELLISES')).toBeNull();
    expect(queryByText('UNPLANTED')).toBeNull();
  });

  it('requests a type filter when a type chip is selected', async () => {
    const listSpy = jest.spyOn(interestService, 'list').mockResolvedValue([]);
    jest.spyOn(constraintService, 'needsEnrichment').mockResolvedValue(new Set());
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);
    await findByText('No interests yet');

    await act(async () => {
      fireEvent.press(await findByText('In progress · All'));
    });
    await act(async () => {
      fireEvent.press(await findByText('Trials'));
    });

    expect(listSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'OneTimeProject' }),
    );
  });
});
