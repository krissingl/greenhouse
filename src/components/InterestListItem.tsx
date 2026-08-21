import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { displayLabel, type Interest } from '../domain/interest';
import { useTheme } from '../theme';

interface InterestListItemProps {
  interest: Interest;
  onPress: () => void;
  onStart?: () => void;
}

export default function InterestListItem({
  interest,
  onPress,
  onStart,
}: InterestListItemProps): ReactElement {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { borderBottomColor: theme.colors.divider, backgroundColor: theme.colors.surface },
      ]}
    >
      <Pressable onPress={onPress} style={styles.mainArea}>
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
          {displayLabel(interest.state)}
        </Text>
      </Pressable>

      {interest.state === 'Backlog' && onStart && (
        <Pressable
          onPress={onStart}
          style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.textOnPrimary, fontSize: theme.typography.caption.size }}>
            Start
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mainArea: {
    flex: 1,
  },
  startButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
});
