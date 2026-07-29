import { fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import HomeHeaderButton from '../HomeHeaderButton';

describe('HomeHeaderButton', () => {
  it('resets the stack to InterestList when pressed', async () => {
    const navigation = { reset: jest.fn() };

    const { getByLabelText } = await render(
      (
        <ThemeProvider>
          <HomeHeaderButton
            navigation={navigation as unknown as Parameters<typeof HomeHeaderButton>[0]['navigation']}
          />
        </ThemeProvider>
      ) as ReactElement,
    );

    fireEvent.press(getByLabelText('Home'));

    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'InterestList' }],
    });
  });

  it('renders as an icon, not the word "Home"', async () => {
    const navigation = { reset: jest.fn() };

    const { queryByText, getByLabelText } = await render(
      (
        <ThemeProvider>
          <HomeHeaderButton
            navigation={navigation as unknown as Parameters<typeof HomeHeaderButton>[0]['navigation']}
          />
        </ThemeProvider>
      ) as ReactElement,
    );

    expect(getByLabelText('Home')).toBeTruthy();
    expect(queryByText('Home')).toBeNull();
  });
});
