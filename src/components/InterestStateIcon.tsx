import type { ReactElement } from 'react';
import { Text } from 'react-native';

import { displayLabel, type InterestState } from '../domain/interest';
import { useTheme } from '../theme';

const STATE_GLYPH: Record<InterestState, string> = {
  Backlog: '🌰',
  InProgress: '🌱',
  Complete: '🌳',
};

interface Props {
  state: InterestState;
}

export default function InterestStateIcon({ state }: Props): ReactElement {
  const theme = useTheme();

  return (
    <Text
      accessibilityLabel={`State: ${displayLabel(state)}`}
      style={{ fontSize: theme.typography.h3.size }}
    >
      {STATE_GLYPH[state]}
    </Text>
  );
}
