import type { NavigationProp } from '@react-navigation/native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import HomeHeaderButton from './HomeHeaderButton';
import type { RootStackParamList } from './RootNavigator';
import { useTheme } from '../theme';

interface Props {
  navigation: NavigationProp<RootStackParamList>;
}

/**
 * Custom headerLeft content replaces the platform's default back button
 * entirely, so this renders both the back control and Home side by side —
 * keeping them grouped on the left, away from the emulator's floating
 * toolbar that sits over the top-right corner.
 */
export default function HeaderLeftControls({ navigation }: Props): ReactElement {
  const theme = useTheme();
  const canGoBack = navigation.canGoBack();

  return (
    <View style={styles.row}>
      {canGoBack && (
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={{ color: theme.colors.primary, fontSize: theme.typography.body.size }}>
            ‹ Back
          </Text>
        </Pressable>
      )}
      <HomeHeaderButton navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
