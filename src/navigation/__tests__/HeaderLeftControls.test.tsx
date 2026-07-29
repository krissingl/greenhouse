import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '../../theme';
import HeaderLeftControls from '../HeaderLeftControls';

describe('HeaderLeftControls', () => {
  it('renders only the Home icon — no Back control, regardless of navigation history', async () => {
    const navigation = { reset: jest.fn(), goBack: jest.fn(), canGoBack: () => true };

    const { getByLabelText, queryByText } = await render(
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
    expect(getByLabelText('Home')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByLabelText('Home'));
    });
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'InterestList' }],
    });
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
