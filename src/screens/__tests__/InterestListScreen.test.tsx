import { NavigationContainer } from '@react-navigation/native';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { interestService } from '../../services/InterestService';
import { ThemeProvider } from '../../theme';
import InterestListScreen from '../InterestListScreen';

async function renderScreen(navigation: {
  navigate: jest.Mock;
}): Promise<ReturnType<typeof render>> {
  const props = {
    navigation,
    route: { key: 'InterestList', name: 'InterestList' },
  } as unknown as Parameters<typeof InterestListScreen>[0];

  return render(
    <ThemeProvider>
      <NavigationContainer>
        <InterestListScreen {...props} />
      </NavigationContainer>
    </ThemeProvider> as ReactElement,
  );
}

describe('InterestListScreen', () => {
  it('shows inline feedback when loading interests fails', async () => {
    jest.spyOn(interestService, 'list').mockRejectedValueOnce(new Error('boom'));
    const navigation = { navigate: jest.fn() };

    const { findByText } = await renderScreen(navigation);

    expect(await findByText('Could not load interests. Please try again.')).toBeTruthy();
  });
});
