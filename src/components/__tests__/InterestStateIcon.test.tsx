import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { InterestState } from '../../domain/interest';
import { ThemeProvider } from '../../theme';
import InterestStateIcon from '../InterestStateIcon';

function renderIcon(state: InterestState) {
  return render(
    (
      <ThemeProvider>
        <InterestStateIcon state={state} />
      </ThemeProvider>
    ) as ReactElement,
  );
}

describe('InterestStateIcon', () => {
  it.each([
    ['Backlog', '🌰', 'State: Backlog'],
    ['InProgress', '🌱', 'State: In progress'],
    ['Complete', '🌳', 'State: Complete'],
  ] as [InterestState, string, string][])(
    'renders the %s glyph with an accessible state label',
    async (state, glyph, label) => {
      const { getByLabelText } = await renderIcon(state);

      expect(getByLabelText(label)).toBeTruthy();
      expect(getByLabelText(label).props.children).toBe(glyph);
    },
  );
});
