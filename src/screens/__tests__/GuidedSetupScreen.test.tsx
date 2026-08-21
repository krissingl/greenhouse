import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type {
  Constraint,
  ConstraintDimension,
  ConstraintStatus,
  ConstraintValue,
} from '../../domain/constraint';
import type { Interest } from '../../domain/interest';
import { constraintService } from '../../services/ConstraintService';
import { interestService } from '../../services/InterestService';
import { ThemeProvider } from '../../theme';
import GuidedSetupScreen from '../GuidedSetupScreen';

const DIMENSIONS: ConstraintDimension[] = [
  'Time',
  'Supplies',
  'Location',
  'Social',
  'Weather',
  'Season',
  'TimeOfDay',
  'EnergyFocus',
];

function makeInterest(overrides: Partial<Interest> = {}): Interest {
  return {
    id: 'interest-1',
    title: 'Learn violin',
    type: 'UnstructuredLearning',
    state: 'Backlog',
    archivedAt: null,
    typeSkippedAt: null,
    dueBy: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeConstraints(
  overrides: Partial<
    Record<ConstraintDimension, { status: ConstraintStatus; value?: ConstraintValue }>
  > = {},
): Constraint[] {
  return DIMENSIONS.map((dimension) => {
    const override = overrides[dimension];
    return {
      id: `constraint-${dimension}`,
      interestId: 'interest-1',
      dimension,
      status: override?.status ?? 'Unknown',
      value: override?.value ?? null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    };
  });
}

async function renderScreen(
  navigation: { navigate: jest.Mock; replace: jest.Mock },
  params: { interestId: string; startDimension?: 'Type' | ConstraintDimension },
): Promise<ReturnType<typeof render>> {
  const props = {
    navigation,
    route: { key: 'GuidedSetup', name: 'GuidedSetup', params },
  } as unknown as Parameters<typeof GuidedSetupScreen>[0];

  return render(
    (
      <ThemeProvider>
        <NavigationContainer>
          <GuidedSetupScreen {...props} />
        </NavigationContainer>
      </ThemeProvider>
    ) as ReactElement,
  );
}

describe('GuidedSetupScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('single-card mode: answering the given axis autosaves without navigating, and Forward returns to InterestDetail', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValue(makeInterest());
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValue(makeConstraints());
    jest.spyOn(constraintService, 'answer').mockResolvedValue({
      id: 'constraint-Time',
      interestId: 'interest-1',
      dimension: 'Time',
      status: 'Set',
      value: '15-30',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    });
    const navigation = { navigate: jest.fn(), replace: jest.fn() };

    const { findByText } = await renderScreen(navigation, {
      interestId: 'interest-1',
      startDimension: 'Time',
    });

    await act(async () => {
      fireEvent.press(await findByText('15–30 min'));
    });

    expect(constraintService.answer).toHaveBeenCalledWith('interest-1', 'Time', {
      status: 'Set',
      value: '15-30',
    });
    expect(navigation.replace).not.toHaveBeenCalledWith('InterestDetail', {
      interestId: 'interest-1',
    });

    await act(async () => {
      fireEvent.press(await findByText('Next'));
    });

    expect(navigation.replace).toHaveBeenCalledWith('InterestDetail', {
      interestId: 'interest-1',
    });
  });

  it('single-card mode: Back always returns to InterestDetail without an implicit answer', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValue(makeInterest());
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValue(makeConstraints());
    const answerSpy = jest.spyOn(constraintService, 'answer');
    const navigation = { navigate: jest.fn(), replace: jest.fn() };

    const { findByText } = await renderScreen(navigation, {
      interestId: 'interest-1',
      startDimension: 'Time',
    });

    await act(async () => {
      fireEvent.press(await findByText('Back'));
    });

    expect(answerSpy).not.toHaveBeenCalled();
    expect(navigation.replace).toHaveBeenCalledWith('InterestDetail', {
      interestId: 'interest-1',
    });
  });

  it('sequential mode: Forward with no selection folds "not sure" into Skip and advances to the next card', async () => {
    jest
      .spyOn(interestService, 'get')
      .mockResolvedValue(makeInterest({ type: null, typeSkippedAt: null }));
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValue(
      makeConstraints({
        Supplies: { status: 'None' },
        Location: { status: 'Set', value: 'Home' },
        Social: { status: 'Set', value: 'Solo' },
        Weather: { status: 'None' },
        Season: { status: 'None' },
        TimeOfDay: { status: 'None' },
      }),
    );
    jest
      .spyOn(interestService, 'skipType')
      .mockResolvedValue(makeInterest({ type: null, typeSkippedAt: '2026-07-02T00:00:00.000Z' }));
    const navigation = { navigate: jest.fn(), replace: jest.fn() };

    const { findByText } = await renderScreen(navigation, { interestId: 'interest-1' });

    await findByText('What kind of interest is this?');

    await act(async () => {
      fireEvent.press(await findByText('Skip'));
    });

    expect(interestService.skipType).toHaveBeenCalledWith('interest-1');
    expect(await findByText('How long does a session take?')).toBeTruthy();
  });

  it('sequential mode: skips a dimension already Set or None', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValue(makeInterest());
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValue(
      makeConstraints({
        Time: { status: 'Set', value: '15-30' },
        Supplies: { status: 'None' },
      }),
    );
    const navigation = { navigate: jest.fn(), replace: jest.fn() };

    const { findByText } = await renderScreen(navigation, { interestId: 'interest-1' });

    expect(await findByText('Where can you do this?')).toBeTruthy();
  });

  it('sequential mode: offers Weather, Season and TimeOfDay as three separate cards', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValue(makeInterest());
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValue(
      makeConstraints({
        Time: { status: 'Set', value: '15-30' },
        Supplies: { status: 'None' },
        Location: { status: 'Set', value: 'Home' },
        Social: { status: 'Set', value: 'Solo' },
      }),
    );
    jest.spyOn(constraintService, 'answer').mockImplementation(async (interestId, dimension) => ({
      id: `constraint-${dimension}`,
      interestId,
      dimension,
      status: 'Unknown',
      value: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    }));
    const navigation = { navigate: jest.fn(), replace: jest.fn() };

    const { findByText } = await renderScreen(navigation, { interestId: 'interest-1' });

    expect(await findByText('Does the weather matter?')).toBeTruthy();

    await act(async () => {
      fireEvent.press(await findByText('Skip'));
    });
    expect(await findByText('Is this tied to a season?')).toBeTruthy();

    await act(async () => {
      fireEvent.press(await findByText('Skip'));
    });
    expect(await findByText('Does the time of day matter?')).toBeTruthy();
  });

  it('sequential mode: skips Type when typeSkippedAt is already set', async () => {
    jest
      .spyOn(interestService, 'get')
      .mockResolvedValue(makeInterest({ type: null, typeSkippedAt: '2026-07-02T00:00:00.000Z' }));
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValue(makeConstraints());
    const navigation = { navigate: jest.fn(), replace: jest.fn() };

    const { findByText } = await renderScreen(navigation, { interestId: 'interest-1' });

    expect(await findByText('How long does a session take?')).toBeTruthy();
  });

  it('sequential mode: "Save & Continue Later" is always visible and exits to InterestDetail without discarding the saved answer', async () => {
    jest
      .spyOn(interestService, 'get')
      .mockResolvedValue(makeInterest({ type: null, typeSkippedAt: null }));
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValue(makeConstraints());
    jest
      .spyOn(interestService, 'update')
      .mockResolvedValue(makeInterest({ type: 'UnstructuredLearning', typeSkippedAt: null }));
    const navigation = { navigate: jest.fn(), replace: jest.fn() };

    const { getByText, findByText } = await renderScreen(navigation, {
      interestId: 'interest-1',
    });

    await findByText('What kind of interest is this?');

    await act(async () => {
      fireEvent.press(await findByText('Evergreens'));
    });

    expect(interestService.update).toHaveBeenCalledWith('interest-1', {
      type: 'UnstructuredLearning',
      typeSkippedAt: null,
    });

    await act(async () => {
      fireEvent.press(getByText('Save & Continue Later'));
    });

    expect(navigation.replace).toHaveBeenCalledWith('InterestDetail', {
      interestId: 'interest-1',
    });
  });

  it('renders inline feedback rather than crashing when a service call fails', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValue(makeInterest());
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValue(makeConstraints());
    jest.spyOn(constraintService, 'answer').mockRejectedValue(new Error('boom'));
    const navigation = { navigate: jest.fn(), replace: jest.fn() };

    const { findByText } = await renderScreen(navigation, {
      interestId: 'interest-1',
      startDimension: 'Time',
    });

    await act(async () => {
      fireEvent.press(await findByText('15–30 min'));
    });

    expect(await findByText('Could not save your answer. Please try again.')).toBeTruthy();
    expect(navigation.replace).not.toHaveBeenCalledWith('InterestDetail', {
      interestId: 'interest-1',
    });
  });
});
