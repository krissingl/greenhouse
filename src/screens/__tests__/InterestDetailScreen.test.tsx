import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { Constraint, ConstraintDimension } from '../../domain/constraint';
import type { Interest } from '../../domain/interest';
import { constraintService } from '../../services/ConstraintService';
import { interestService } from '../../services/InterestService';
import { ThemeProvider } from '../../theme';
import InterestDetailScreen from '../InterestDetailScreen';

const DIMENSIONS: ConstraintDimension[] = [
  'Time',
  'Supplies',
  'Location',
  'Social',
  'WeatherSeason',
  'EnergyFocus',
];

const INTEREST: Interest = {
  id: 'interest-1',
  title: 'Learn violin',
  type: null,
  state: 'Backlog',
  archivedAt: null,
  typeSkippedAt: null,
  dueBy: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

function makeConstraints(
  overrides: Partial<Record<ConstraintDimension, Partial<Constraint>>> = {},
): Constraint[] {
  return DIMENSIONS.map((dimension) => ({
    id: `constraint-${dimension}`,
    interestId: INTEREST.id,
    dimension,
    status: 'Unknown',
    value: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides[dimension],
  }));
}

async function renderScreen(navigation: {
  navigate: jest.Mock;
}): Promise<ReturnType<typeof render>> {
  const props = {
    navigation,
    route: { key: 'InterestDetail', name: 'InterestDetail', params: { interestId: INTEREST.id } },
  } as unknown as Parameters<typeof InterestDetailScreen>[0];

  return render(
    (
      <ThemeProvider>
        <NavigationContainer>
          <InterestDetailScreen {...props} />
        </NavigationContainer>
      </ThemeProvider>
    ) as ReactElement,
  );
}

describe('InterestDetailScreen', () => {
  it('shows the Start button for a Backlog interest and transitions it to InProgress in place', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    jest
      .spyOn(interestService, 'setState')
      .mockResolvedValueOnce({ ...INTEREST, state: 'InProgress' });
    const navigation = { navigate: jest.fn() };

    const { findByText, queryByText } = await renderScreen(navigation);

    await act(async () => {
      fireEvent.press(await findByText('Start'));
    });

    expect(interestService.setState).toHaveBeenCalledWith('interest-1', 'InProgress');
    expect(await findByText('State: In progress')).toBeTruthy();
    expect(queryByText('Start')).toBeNull();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('hides the Start button for an interest that is not Backlog', async () => {
    jest
      .spyOn(interestService, 'get')
      .mockResolvedValueOnce({ ...INTEREST, state: 'InProgress' });
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = { navigate: jest.fn() };

    const { findByText, queryByText } = await renderScreen(navigation);

    await findByText('Learn violin');
    expect(queryByText('Start')).toBeNull();
  });

  it('shows inline feedback and does not navigate away when starting fails', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    jest.spyOn(interestService, 'setState').mockRejectedValueOnce(new Error('boom'));
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    await act(async () => {
      fireEvent.press(await findByText('Start'));
    });

    expect(await findByText('Could not start this interest. Please try again.')).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalledWith('InterestList');
  });

  it('does not render Archive/Delete on Interest Detail', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = { navigate: jest.fn() };

    const { findByText, queryByText } = await renderScreen(navigation);

    await findByText('Learn violin');
    expect(queryByText('Archive')).toBeNull();
    expect(queryByText('Delete')).toBeNull();
  });

  it('shows inline feedback when loading the interest fails', async () => {
    jest.spyOn(interestService, 'get').mockRejectedValueOnce(new Error('boom'));
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    expect(await findByText('Could not load this interest. Please try again.')).toBeTruthy();
  });

  it('shows inline feedback when loading constraints fails', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockRejectedValueOnce(new Error('boom'));
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    expect(await findByText('Could not load this interest. Please try again.')).toBeTruthy();
  });

  it('renders a soft invitation chip for a never-touched axis', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    expect(await findByText('＋ add time')).toBeTruthy();
    expect(await findByText('＋ add type')).toBeTruthy();
  });

  it('renders a filled chip summarizing a Set answer', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest
      .spyOn(constraintService, 'listForInterest')
      .mockResolvedValueOnce(makeConstraints({ Time: { status: 'Set', value: '15-30' } }));
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    expect(await findByText('15–30 min')).toBeTruthy();
  });

  it('renders a filled chip for a None answer', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest
      .spyOn(constraintService, 'listForInterest')
      .mockResolvedValueOnce(makeConstraints({ Location: { status: 'None' } }));
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    expect(await findByText("Doesn't apply")).toBeTruthy();
  });

  it('renders a distinct answered-looking chip for a deliberately-skipped Type', async () => {
    jest
      .spyOn(interestService, 'get')
      .mockResolvedValueOnce({ ...INTEREST, typeSkippedAt: '2026-07-02T00:00:00.000Z' });
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = { navigate: jest.fn() };

    const { findByText, queryByText } = await renderScreen(navigation);

    expect(await findByText('Not sure yet')).toBeTruthy();
    expect(queryByText('＋ add type')).toBeNull();
  });

  it('navigates to GuidedSetupScreen with the tapped chip axis as startDimension', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    fireEvent.press(await findByText('＋ add time'));

    expect(navigation.navigate).toHaveBeenCalledWith('GuidedSetup', {
      interestId: 'interest-1',
      startDimension: 'Time',
    });
  });

  it('navigates to GuidedSetupScreen with no startDimension from "＋ Tell me more"', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    fireEvent.press(await findByText('＋ Tell me more'));

    expect(navigation.navigate).toHaveBeenCalledWith('GuidedSetup', {
      interestId: 'interest-1',
    });
  });
});
