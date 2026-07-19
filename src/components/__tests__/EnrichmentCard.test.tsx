import { fireEvent, render } from '@testing-library/react-native';

import { ThemeProvider } from '../../theme';
import EnrichmentCard from '../EnrichmentCard';

describe('EnrichmentCard', () => {
  it('renders the chip options for a given axis', async () => {
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard axis="Time" answer={null} onAnswer={jest.fn()} />
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
        <EnrichmentCard axis="Time" answer={null} onAnswer={onAnswer} />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('15–30 min'));

    expect(onAnswer).toHaveBeenCalledWith({ status: 'Set', value: '15-30' });
  });

  it('invokes onAnswer with status Unknown on "Not sure"', async () => {
    const onAnswer = jest.fn();
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard axis="Time" answer={null} onAnswer={onAnswer} />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('Not sure / later'));

    expect(onAnswer).toHaveBeenCalledWith({ status: 'Unknown' });
  });

  it('invokes onAnswer with status None on "Doesn\'t apply" for a non-Type axis', async () => {
    const onAnswer = jest.fn();
    const { getByText } = await render(
      <ThemeProvider>
        <EnrichmentCard axis="Location" answer={null} onAnswer={onAnswer} />
      </ThemeProvider>,
    );

    fireEvent.press(getByText("None / doesn't apply"));

    expect(onAnswer).toHaveBeenCalledWith({ status: 'None' });
  });

  it('does not render a "Doesn\'t apply" escape hatch for the Type axis', async () => {
    const { queryByText } = await render(
      <ThemeProvider>
        <EnrichmentCard axis="Type" answer={null} onAnswer={jest.fn()} />
      </ThemeProvider>,
    );

    expect(queryByText("None / doesn't apply")).toBeNull();
  });
});
