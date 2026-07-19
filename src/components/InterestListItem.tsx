import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Interest } from '../domain/interest';
import { useTheme } from '../theme';

interface InterestListItemProps {
  interest: Interest;
  onPress: () => void;
}

export default function InterestListItem({
  interest,
  onPress,
}: InterestListItemProps): ReactElement {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        { borderBottomColor: theme.colors.divider, backgroundColor: theme.colors.surface },
      ]}
    >
      <View>
        <Text style={{ color: theme.colors.text, fontSize: theme.typography.body.size }}>
          {interest.title}
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.caption.size,
            marginTop: theme.spacing.xs,
          }}
        >
          {interest.state}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
