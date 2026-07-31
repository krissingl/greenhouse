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
  'Weather',
  'Season',
  'TimeOfDay',
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

function makeFullyAnsweredConstraints(): Constraint[] {
  return makeConstraints({
    Time: { status: 'Set', value: '15-30' },
    Supplies: { status: 'None' },
    Location: { status: 'Set', value: 'Home' },
    Social: { status: 'Set', value: 'Solo' },
    Weather: { status: 'None' },
    Season: { status: 'None' },
    TimeOfDay: { status: 'None' },
  });
}

function makeNavigation(): { navigate: jest.Mock; setOptions: jest.Mock } {
  return { navigate: jest.fn(), setOptions: jest.fn() };
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
    const navigation = makeNavigation();

    const { findByText, queryByText } = await renderScreen(navigation);

    await act(async () => {
      fireEvent.press(await findByText('Start'));
    });

    expect(interestService.setState).toHaveBeenCalledWith('interest-1', 'InProgress');
    expect(await findByText('In progress')).toBeTruthy();
    expect(queryByText('Start')).toBeNull();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('hides the Start button for an interest that is not Backlog', async () => {
    jest
      .spyOn(interestService, 'get')
      .mockResolvedValueOnce({ ...INTEREST, state: 'InProgress' });
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = makeNavigation();

    const { findByText, queryByText } = await renderScreen(navigation);

    await findByText('Learn violin');
    expect(queryByText('Start')).toBeNull();
  });

  it('shows inline feedback and does not navigate away when starting fails', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    jest.spyOn(interestService, 'setState').mockRejectedValueOnce(new Error('boom'));
    const navigation = makeNavigation();

    const { findByText } = await renderScreen(navigation);

    await act(async () => {
      fireEvent.press(await findByText('Start'));
    });

    expect(await findByText('Could not start this interest. Please try again.')).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalledWith('InterestList');
  });

  it('does not render a native page title, Archive, or Delete on Interest Detail', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = makeNavigation();

    const { findByText, queryByText } = await renderScreen(navigation);

    await findByText('Learn violin');
    expect(queryByText('Interest')).toBeNull();
    expect(queryByText('Archive')).toBeNull();
    expect(queryByText('Delete')).toBeNull();
  });

  it('shows inline feedback when loading the interest fails', async () => {
    jest.spyOn(interestService, 'get').mockRejectedValueOnce(new Error('boom'));
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = makeNavigation();

    const { findByText } = await renderScreen(navigation);

    expect(await findByText('Could not load this interest. Please try again.')).toBeTruthy();
  });

  it('shows inline feedback when loading constraints fails', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockRejectedValueOnce(new Error('boom'));
    const navigation = makeNavigation();

    const { findByText } = await renderScreen(navigation);

    expect(await findByText('Could not load this interest. Please try again.')).toBeTruthy();
  });

  it('renders a labelled row for a never-touched axis, reading "Not set"', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = makeNavigation();

    const { findByText } = await renderScreen(navigation);

    expect(await findByText(/Time:\s*Not set/)).toBeTruthy();
    expect(await findByText(/Type:\s*Not set/)).toBeTruthy();
  });

  it('renders a labelled row summarizing a Set answer', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest
      .spyOn(constraintService, 'listForInterest')
      .mockResolvedValueOnce(makeConstraints({ Time: { status: 'Set', value: '15-30' } }));
    const navigation = makeNavigation();

    const { findByText } = await renderScreen(navigation);

    expect(await findByText(/Time:\s*15–30 min/)).toBeTruthy();
  });

  it('renders a labelled row for a None answer, distinguishing which axis', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest
      .spyOn(constraintService, 'listForInterest')
      .mockResolvedValueOnce(makeConstraints({ Location: { status: 'None' } }));
    const navigation = makeNavigation();

    const { findByText } = await renderScreen(navigation);

    expect(await findByText(/Location:\s*Doesn't apply/)).toBeTruthy();
  });

  it('renders a distinct row for a deliberately-skipped Type', async () => {
    jest
      .spyOn(interestService, 'get')
      .mockResolvedValueOnce({ ...INTEREST, typeSkippedAt: '2026-07-02T00:00:00.000Z' });
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = makeNavigation();

    const { findByText, queryByText } = await renderScreen(navigation);

    expect(await findByText(/Type:\s*Not sure yet/)).toBeTruthy();
    expect(queryByText(/Type:\s*Not set/)).toBeNull();
  });

  it('navigates to GuidedSetupScreen with the tapped row axis as startDimension via the edit icon', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = makeNavigation();

    const { findByLabelText } = await renderScreen(navigation);

    fireEvent.press(await findByLabelText('Add Time'));

    expect(navigation.navigate).toHaveBeenCalledWith('GuidedSetup', {
      interestId: 'interest-1',
      startDimension: 'Time',
    });
  });

  it('shows "＋ Tell me more" when an axis is unanswered and hides it once all axes are answered', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = makeNavigation();

    const { findByText } = await renderScreen(navigation);
    expect(await findByText('＋ Tell me more')).toBeTruthy();
  });

  it('hides "＋ Tell me more" entirely when every axis is answered', async () => {
    jest
      .spyOn(interestService, 'get')
      .mockResolvedValueOnce({ ...INTEREST, type: 'OneTimeProject' });
    jest
      .spyOn(constraintService, 'listForInterest')
      .mockResolvedValueOnce(makeFullyAnsweredConstraints());
    const navigation = makeNavigation();

    const { findByText, queryByText } = await renderScreen(navigation);
    await findByText('Learn violin');

    expect(queryByText('＋ Tell me more')).toBeNull();
  });

  it('navigates to GuidedSetupScreen with no startDimension from "＋ Tell me more"', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = makeNavigation();

    const { findByText } = await renderScreen(navigation);

    fireEvent.press(await findByText('＋ Tell me more'));

    expect(navigation.navigate).toHaveBeenCalledWith('GuidedSetup', {
      interestId: 'interest-1',
    });
  });

  it('summarizes Supplies as a missing count and expands to a checkbox list without have/need labels', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(
      makeConstraints({
        Supplies: {
          status: 'Set',
          value: [
            { name: 'Canvas', have: true },
            { name: 'Paint brush', have: false },
          ],
        },
      }),
    );
    const navigation = makeNavigation();

    const { findByText, findAllByRole, queryByText } = await renderScreen(navigation);

    expect(await findByText(/Supplies:\s*1 Missing/)).toBeTruthy();
    expect(queryByText(/need it/)).toBeNull();
    expect(queryByText(/have it/)).toBeNull();
    expect(queryByText('Paint brush')).toBeNull();

    await act(async () => {
      fireEvent.press(await findByText(/Supplies:\s*1 Missing/));
    });

    expect(await findByText('Paint brush')).toBeTruthy();
    expect(await findByText('Canvas')).toBeTruthy();
    expect(queryByText(/need it/)).toBeNull();
    expect(queryByText(/have it/)).toBeNull();

    const checkboxes = await findAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0].props.accessibilityState).toMatchObject({ checked: true });
    expect(checkboxes[1].props.accessibilityState).toMatchObject({ checked: false });
  });

  it('summarizes Supplies with nothing outstanding rather than "0 Missing"', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(
      makeConstraints({
        Supplies: { status: 'Set', value: [{ name: 'Canvas', have: true }] },
      }),
    );
    const navigation = makeNavigation();

    const { findByText, queryByText } = await renderScreen(navigation);

    expect(await findByText(/Supplies:\s*All on hand/)).toBeTruthy();
    expect(queryByText(/0 Missing/)).toBeNull();
  });

  it('persists a supply checkbox toggle through ConstraintService.answer', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(
      makeConstraints({
        Supplies: {
          status: 'Set',
          value: [
            { name: 'Canvas', have: true },
            { name: 'Paint brush', have: false },
          ],
        },
      }),
    );
    const answer = jest.spyOn(constraintService, 'answer').mockResolvedValueOnce({
      id: 'constraint-Supplies',
      interestId: INTEREST.id,
      dimension: 'Supplies',
      status: 'Set',
      value: [
        { name: 'Canvas', have: true },
        { name: 'Paint brush', have: true },
      ],
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-02T00:00:00.000Z',
    });
    const navigation = makeNavigation();

    const { findByText, findAllByRole } = await renderScreen(navigation);

    await act(async () => {
      fireEvent.press(await findByText(/Supplies:\s*1 Missing/));
    });

    await act(async () => {
      fireEvent.press((await findAllByRole('checkbox'))[1]);
    });

    expect(answer).toHaveBeenCalledWith('interest-1', 'Supplies', {
      status: 'Set',
      value: [
        { name: 'Canvas', have: true },
        { name: 'Paint brush', have: true },
      ],
    });
    expect(await findByText(/Supplies:\s*All on hand/)).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('shows inline feedback and restores the checkbox when persisting a supply toggle fails', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(
      makeConstraints({
        Supplies: { status: 'Set', value: [{ name: 'Paint brush', have: false }] },
      }),
    );
    jest.spyOn(constraintService, 'answer').mockRejectedValueOnce(new Error('boom'));
    const navigation = makeNavigation();

    const { findByText, findAllByRole } = await renderScreen(navigation);

    await act(async () => {
      fireEvent.press(await findByText(/Supplies:\s*1 Missing/));
    });

    await act(async () => {
      fireEvent.press((await findAllByRole('checkbox'))[0]);
    });

    expect(await findByText('Could not update supplies. Please try again.')).toBeTruthy();
    expect(await findByText(/Supplies:\s*1 Missing/)).toBeTruthy();
    expect((await findAllByRole('checkbox'))[0].props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it('exposes the Supplies disclosure control with an expanded state', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(
      makeConstraints({
        Supplies: { status: 'Set', value: [{ name: 'Paint brush', have: false }] },
      }),
    );
    const navigation = makeNavigation();

    const { findByLabelText } = await renderScreen(navigation);

    await act(async () => {
      fireEvent.press(await findByLabelText('Expand supplies'));
    });

    expect(await findByLabelText('Collapse supplies')).toBeTruthy();
  });

  it('navigates to Edit via the title-row edit icon', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = makeNavigation();

    const { findByLabelText } = await renderScreen(navigation);

    fireEvent.press(await findByLabelText('Edit'));

    expect(navigation.navigate).toHaveBeenCalledWith('EditInterest', { interestId: 'interest-1' });
  });

  it('navigates to the journal via the notepad icon', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValueOnce(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = makeNavigation();

    const { findByLabelText } = await renderScreen(navigation);

    fireEvent.press(await findByLabelText('Journal'));

    expect(navigation.navigate).toHaveBeenCalledWith('NoteJournal', { interestId: 'interest-1' });
  });

  it('renders no capability microcopy card', async () => {
    jest.spyOn(interestService, 'get').mockResolvedValue(INTEREST);
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValue(makeConstraints());
    const navigation = makeNavigation();

    const { findByText, queryByLabelText, queryByText } = await renderScreen(navigation);
    await findByText('Learn violin');

    expect(queryByLabelText('Dismiss tip')).toBeNull();
    expect(queryByText(/I can suggest this/)).toBeNull();
    expect(queryByText(/I can only find this/)).toBeNull();
    expect(queryByText(/I know a little about this/)).toBeNull();
  });

  it('puts the state icon in the header title slot and keeps the state label in the body', async () => {
    jest
      .spyOn(interestService, 'get')
      .mockResolvedValueOnce({ ...INTEREST, state: 'InProgress' });
    jest.spyOn(constraintService, 'listForInterest').mockResolvedValueOnce(makeConstraints());
    const navigation = makeNavigation();

    const { findByText, queryByLabelText } = await renderScreen(navigation);
    await findByText('Learn violin');

    expect(queryByLabelText('State: In progress')).toBeNull();
    expect(await findByText('In progress')).toBeTruthy();

    const headerTitle = navigation.setOptions.mock.calls
      .map(([options]) => (options as { headerTitle?: () => ReactElement }).headerTitle)
      .filter((title): title is () => ReactElement => title !== undefined)
      .at(-1);
    expect(headerTitle).toBeDefined();

    const header = await render(
      (<ThemeProvider>{headerTitle!()}</ThemeProvider>) as ReactElement,
    );
    expect(header.getByLabelText('State: In progress')).toBeTruthy();
  });
});
