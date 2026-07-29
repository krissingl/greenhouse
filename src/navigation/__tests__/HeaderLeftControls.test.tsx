import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import HeaderLeftControls from '../HeaderLeftControls';

describe('HeaderLeftControls', () => {
  it('renders Back and Home together when the screen can go back', async () => {
    const navigation = { reset: jest.fn(), goBack: jest.fn(), canGoBack: () => true };

    const { getByText } = await render(
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

    expect(getByText('‹ Back')).toBeTruthy();
    expect(getByText('Home')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('‹ Back'));
    });
    expect(navigation.goBack).toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByText('Home'));
    });
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'InterestList' }],
    });
  });

  it('omits Back when the screen cannot go back', async () => {
    const navigation = { reset: jest.fn(), goBack: jest.fn(), canGoBack: () => false };

    const { queryByText, getByText } = await render(
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

    expect(queryByText('‹ Back')).toBeNull();
    expect(getByText('Home')).toBeTruthy();
  });
});
