import { act, fireEvent, render } from '@testing-library/react-native';
import { TextInput } from 'react-native';

import { ThemeProvider } from '../../theme';
import EnrichmentCard from '../EnrichmentCard';

describe('EnrichmentCard', () => {
  it('renders the chip options for a given axis', async () => {
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Time"
          answer={null}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByText('5–15 min')).toBeTruthy();
    expect(getByText('15–30 min')).toBeTruthy();
    expect(getByText('30–60 min')).toBeTruthy();
    expect(getByText('1hr+')).toBeTruthy();
    expect(getByText('Varies')).toBeTruthy();
  });

  it('invokes onAnswer with status Set and the matching value on a chip tap', async () => {
    const onAnswer = jest.fn();
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Time"
          answer={null}
          onAnswer={onAnswer}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText('15–30 min'));
    });

    expect(onAnswer).toHaveBeenCalledWith({ status: 'Set', value: '15-30' });
  });

  it('invokes onAnswer with status None on "Doesn\'t apply" for a non-Type axis', async () => {
    const onAnswer = jest.fn();
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Location"
          answer={null}
          onAnswer={onAnswer}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText("None / doesn't apply"));
    });

    expect(onAnswer).toHaveBeenCalledWith({ status: 'None' });
  });

  it('does not render a "Doesn\'t apply" escape hatch for the Type axis', async () => {
    const { queryByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Type"
          answer={null}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(queryByText("None / doesn't apply")).toBeNull();
  });

  it('always renders Back and a Forward control', async () => {
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Time"
          answer={null}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByText('Back')).toBeTruthy();
    expect(getByText('Skip')).toBeTruthy();
  });

  it('labels Forward as "Skip" with no answer and folds "not sure" into it', async () => {
    const onAnswer = jest.fn();
    const onForward = jest.fn();
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Time"
          answer={null}
          onAnswer={onAnswer}
          onBack={jest.fn()}
          onForward={onForward}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText('Skip'));
    });

    expect(onAnswer).toHaveBeenCalledWith({ status: 'Unknown' });
    expect(onForward).toHaveBeenCalled();
  });

  it('labels Forward as "Next" once an answer is selected, and does not re-fire Unknown', async () => {
    const onAnswer = jest.fn();
    const onForward = jest.fn();
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Time"
          answer={{ status: 'Set', value: '15-30' }}
          onAnswer={onAnswer}
          onBack={jest.fn()}
          onForward={onForward}
        />
      </ThemeProvider>,
    );

    expect(getByText('Next')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Next'));
    });

    expect(onAnswer).not.toHaveBeenCalled();
    expect(onForward).toHaveBeenCalled();
  });

  it('pressing Back never fires an implicit Unknown answer', async () => {
    const onAnswer = jest.fn();
    const onBack = jest.fn();
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Time"
          answer={null}
          onAnswer={onAnswer}
          onBack={onBack}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText('Back'));
    });

    expect(onAnswer).not.toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });

  it('shows a "Clear answer" control once answered, which resets to Unknown', async () => {
    const onAnswer = jest.fn();
    const { getByText, queryByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Time"
          answer={{ status: 'Set', value: '15-30' }}
          onAnswer={onAnswer}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(queryByText('Clear answer')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Clear answer'));
    });

    expect(onAnswer).toHaveBeenCalledWith({ status: 'Unknown' });
  });

  it('supports adding multiple supply items without navigating away', async () => {
    const onAnswer = jest.fn();
    const onForward = jest.fn();
    const { getByText, getAllByPlaceholderText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Supplies"
          answer={null}
          onAnswer={onAnswer}
          onBack={jest.fn()}
          onForward={onForward}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText('+ Add item'));
    });
    await act(async () => {
      fireEvent.press(getByText('+ Add item'));
    });

    expect(getAllByPlaceholderText('Item name')).toHaveLength(2);
    expect(onAnswer).not.toHaveBeenCalled();
    expect(onForward).not.toHaveBeenCalled();
  });

  it('rejects blank supply items when moving forward', async () => {
    const onAnswer = jest.fn();
    const onForward = jest.fn();
    const { getByText, getByPlaceholderText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Supplies"
          answer={null}
          onAnswer={onAnswer}
          onBack={jest.fn()}
          onForward={onForward}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText('+ Add item'));
    });

    // Blank item: Forward should treat this as "no answer" (Skip), not persist a blank item.
    expect(getByText('Skip')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Skip'));
    });

    expect(onAnswer).toHaveBeenCalledWith({ status: 'Unknown' });
    expect(onForward).toHaveBeenCalled();

    onAnswer.mockClear();

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Item name'), 'Paint brush');
    });

    expect(getByText('Next')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Next'));
    });

    expect(onAnswer).toHaveBeenCalledWith({
      status: 'Set',
      value: [{ name: 'Paint brush', have: false }],
    });
  });

  it('typing in the supply item name field does not navigate forward', async () => {
    const onForward = jest.fn();
    const { getByText, getByPlaceholderText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Supplies"
          answer={null}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={onForward}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText('+ Add item'));
    });
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Item name'), 'Rope');
    });

    expect(onForward).not.toHaveBeenCalled();
  });

  it('lets the weather note be typed before advancing (does not auto-navigate on selecting "Yes, it matters")', async () => {
    const onAnswer = jest.fn();
    const onForward = jest.fn();
    const { getByText, getByPlaceholderText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="WeatherSeason"
          answer={null}
          onAnswer={onAnswer}
          onBack={jest.fn()}
          onForward={onForward}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText('Yes, it matters'));
    });

    expect(onForward).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.changeText(
        getByPlaceholderText('What matters — heat, cold, rain, a season? (optional)'),
        'Too cold below freezing',
      );
    });

    expect(onForward).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByText('Next'));
    });

    expect(onAnswer).toHaveBeenCalledWith({
      status: 'Set',
      value: { matters: true, note: 'Too cold below freezing' },
    });
    expect(onForward).toHaveBeenCalled();
  });

  it('renders a real on/off switch for supply items, showing only the active label', async () => {
    const { getByText, getAllByPlaceholderText, getByRole } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Supplies"
          answer={{ status: 'Set', value: [{ name: 'Paint brush', have: false }] }}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getAllByPlaceholderText('Item name')).toHaveLength(1);
    expect(getByText('Need it')).toBeTruthy();
    expect(() => getByText('Have it')).toThrow();

    const toggle = getByRole('switch');
    await act(async () => {
      fireEvent(toggle, 'valueChange', true);
    });

    expect(getByText('Have it')).toBeTruthy();
    expect(() => getByText('Need it')).toThrow();
  });

  it('preserves the "Remove item" accessibility label on the trashcan control', async () => {
    const { getByLabelText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Supplies"
          answer={{ status: 'Set', value: [{ name: 'Paint brush', have: false }] }}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByLabelText('Remove item')).toBeTruthy();
  });

  it('focuses the newly-added supply item input', async () => {
    const focusSpy = jest.spyOn(TextInput.prototype, 'focus');
    const { getByText, getAllByPlaceholderText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Supplies"
          answer={null}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText('+ Add item'));
    });

    expect(getAllByPlaceholderText('Item name')).toHaveLength(1);
    expect(focusSpy).toHaveBeenCalled();

    focusSpy.mockClear();

    await act(async () => {
      fireEvent.press(getByText('+ Add item'));
    });

    expect(getAllByPlaceholderText('Item name')).toHaveLength(2);
    expect(focusSpy).toHaveBeenCalled();
  });

  it('renders single-select axis options as a bordered group of rows with a radio indicator', async () => {
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Time"
          answer={{ status: 'Set', value: '15-30' }}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByText('5–15 min')).toBeTruthy();
    expect(getByText('15–30 min')).toBeTruthy();
  });
});
