import { fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import HomeHeaderButton from '../HomeHeaderButton';

describe('HomeHeaderButton', () => {
  it('resets the stack to InterestList when pressed', async () => {
    const navigation = { reset: jest.fn() };

    const { getByText } = await render(
      (
        <ThemeProvider>
          <HomeHeaderButton
            navigation={navigation as unknown as Parameters<typeof HomeHeaderButton>[0]['navigation']}
          />
        </ThemeProvider>
      ) as ReactElement,
    );

    fireEvent.press(getByText('Home'));

    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'InterestList' }],
    });
  });
});
