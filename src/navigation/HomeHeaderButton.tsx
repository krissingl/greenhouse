import type { NavigationProp } from '@react-navigation/native';
import type { ReactElement } from 'react';
import { Pressable, Text } from 'react-native';

import { useTheme } from '../theme';
import type { RootStackParamList } from './RootNavigator';

interface Props {
  navigation: NavigationProp<RootStackParamList>;
}

export default function HomeHeaderButton({ navigation }: Props): ReactElement {
  const theme = useTheme();

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'InterestList' }] });
  };

  return (
    <Pressable onPress={goHome} hitSlop={8} accessibilityRole="button" accessibilityLabel="Home">
      <Text style={{ color: theme.colors.primary, fontSize: theme.typography.title.size }}>⌂</Text>
    </Pressable>
  );
}
