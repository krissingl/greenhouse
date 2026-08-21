import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import HeaderLeftControls from '../HeaderLeftControls';

function renderControls(navigation: {
  reset: jest.Mock;
  goBack: jest.Mock;
  canGoBack: () => boolean;
}) {
  return render(
    (
      <ThemeProvider>
        <HeaderLeftControls
          navigation={
            navigation as unknown as Parameters<typeof HeaderLeftControls>[0]['navigation']
          }
        />
      </ThemeProvider>
    ) as ReactElement,
  );
}

describe('HeaderLeftControls', () => {
  it('renders Back ahead of Home and goes back when Back is pressed', async () => {
    const navigation = { reset: jest.fn(), goBack: jest.fn(), canGoBack: () => true };

    const { getByLabelText } = await renderControls(navigation);

    expect(getByLabelText('Back')).toBeTruthy();
    expect(getByLabelText('Home')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByLabelText('Back'));
    });

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  it('still resets to the list when Home is pressed', async () => {
    const navigation = { reset: jest.fn(), goBack: jest.fn(), canGoBack: () => true };

    const { getByLabelText } = await renderControls(navigation);

    await act(async () => {
      fireEvent.press(getByLabelText('Home'));
    });

    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'InterestList' }],
    });
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('omits Back when there is nothing to go back to', async () => {
    const navigation = { reset: jest.fn(), goBack: jest.fn(), canGoBack: () => false };

    const { getByLabelText, queryByLabelText } = await renderControls(navigation);

    expect(queryByLabelText('Back')).toBeNull();
    expect(getByLabelText('Home')).toBeTruthy();
  });
});
