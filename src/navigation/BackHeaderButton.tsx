import type { NavigationProp } from '@react-navigation/native';
import type { ReactElement } from 'react';
import { Pressable, Text } from 'react-native';

import { useTheme } from '../theme';
import type { RootStackParamList } from './RootNavigator';

interface Props {
  navigation: NavigationProp<RootStackParamList>;
}

export default function BackHeaderButton({ navigation }: Props): ReactElement {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <Text style={{ color: theme.colors.primary, fontSize: theme.typography.h3.size }}>‹</Text>
    </Pressable>
  );
}
