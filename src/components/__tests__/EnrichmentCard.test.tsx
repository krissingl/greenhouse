import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet, TextInput } from 'react-native';

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

  it('keeps the "Clear answer" touch target on the control instead of the whole row', async () => {
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

    const control = getByLabelText('Clear answer');
    expect(StyleSheet.flatten(control.props.style)).toMatchObject({ alignSelf: 'flex-start' });
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

  it('produces a flat multi-select value on the Weather card, with no kind wrapper', async () => {
    const onAnswer = jest.fn();
    const onForward = jest.fn();
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Weather"
          answer={null}
          onAnswer={onAnswer}
          onBack={jest.fn()}
          onForward={onForward}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText('Sunny'));
    });
    await act(async () => {
      fireEvent.press(getByText('Overcast'));
    });

    expect(onForward).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByText('Next'));
    });

    expect(onAnswer).toHaveBeenCalledWith({ status: 'Set', value: ['Sunny', 'Overcast'] });
    expect(onForward).toHaveBeenCalled();
  });

  it('offers each multi-select axis only its own options', async () => {
    const { getByText, queryByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="TimeOfDay"
          answer={null}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByText('Does the time of day matter?')).toBeTruthy();
    expect(getByText('Night')).toBeTruthy();
    expect(queryByText('Sunny')).toBeNull();
    expect(queryByText('Fall')).toBeNull();
  });

  it('offers a due-by field on the Season and TimeOfDay cards, not on Weather', async () => {
    const { queryByPlaceholderText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Weather"
          answer={null}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );
    expect(queryByPlaceholderText(/Due by/)).toBeNull();

    const season = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Season"
          answer={null}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );
    expect(season.queryByPlaceholderText(/Due by/)).toBeTruthy();

    const timeOfDay = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="TimeOfDay"
          answer={null}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );
    expect(timeOfDay.queryByPlaceholderText(/Due by/)).toBeTruthy();
  });

  it('captures a due-by date on the Season card and flushes it via onDueByChange', async () => {
    const onAnswer = jest.fn();
    const onDueByChange = jest.fn();
    const onForward = jest.fn();
    const { getByText, getByPlaceholderText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Season"
          answer={null}
          onAnswer={onAnswer}
          onBack={jest.fn()}
          onForward={onForward}
          dueBy={null}
          onDueByChange={onDueByChange}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText('Fall'));
    });
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText(/Due by/), '2026-10-31');
    });

    await act(async () => {
      fireEvent.press(getByText('Next'));
    });

    expect(onAnswer).toHaveBeenCalledWith({ status: 'Set', value: ['Fall'] });
    expect(onDueByChange).toHaveBeenCalledWith('2026-10-31');
    expect(onForward).toHaveBeenCalled();
  });

  it('restores an existing multi-select answer as pre-checked options', async () => {
    const onAnswer = jest.fn();
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Weather"
          answer={{ status: 'Set', value: ['Sunny'] }}
          onAnswer={onAnswer}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.press(getByText('Dry'));
    });
    await act(async () => {
      fireEvent.press(getByText('Next'));
    });

    expect(onAnswer).toHaveBeenCalledWith({ status: 'Set', value: ['Sunny', 'Dry'] });
  });

  it('renders a checkbox per supply item, sorting Need it above Have it and re-sorting on toggle', async () => {
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

    const toggle = getByRole('checkbox');
    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(getByText('Have it')).toBeTruthy();
    expect(() => getByText('Need it')).toThrow();
  });

  it('keeps a Need it item and a Have it item in their own sections at once', async () => {
    const { getByText, getAllByRole } = await render(
      <ThemeProvider>
        <EnrichmentCard
          axis="Supplies"
          answer={{
            status: 'Set',
            value: [
              { name: 'Paint brush', have: false },
              { name: 'Canvas', have: true },
            ],
          }}
          onAnswer={jest.fn()}
          onBack={jest.fn()}
          onForward={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByText('Need it')).toBeTruthy();
    expect(getByText('Have it')).toBeTruthy();
    expect(getAllByRole('checkbox')).toHaveLength(2);
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
