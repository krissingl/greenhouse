import type { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type Theme } from '../theme';

/**
 * Shared "bordered group of hairline-divided rows" visual language used by the
 * enrichment questionnaire (EnrichmentCard) and the Interest Detail answer row —
 * the de-pilled replacement for the earlier rounded chip styling.
 */
export function OptionGroup({ children }: { children: ReactNode }): ReactElement {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.group,
        { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
      ]}
    >
      {children}
    </View>
  );
}

function rowBorderStyle(theme: Theme, isLast: boolean): StyleProp<ViewStyle> {
  return isLast
    ? null
    : { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.divider };
}

interface GroupRowProps {
  children: ReactNode;
  isLast?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GroupRow({ children, isLast = false, style }: GroupRowProps): ReactElement {
  const theme = useTheme();

  return <View style={[styles.row, rowBorderStyle(theme, isLast), style]}>{children}</View>;
}

interface OptionRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
}

export function OptionRow({
  label,
  selected,
  onPress,
  isLast = false,
}: OptionRowProps): ReactElement {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.row, rowBorderStyle(theme, isLast)]}>
      <Text style={[styles.rowLabel, { color: theme.colors.text }]}>{label}</Text>
      <View
        style={[
          styles.radioOuter,
          { borderColor: selected ? theme.colors.primary : theme.colors.border },
        ]}
      >
        {selected && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />}
      </View>
    </Pressable>
  );
}

export function Checkbox({ checked }: { checked: boolean }): ReactElement {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.checkboxOuter,
        {
          borderColor: checked ? theme.colors.primary : theme.colors.border,
          backgroundColor: checked ? theme.colors.primary : 'transparent',
        },
      ]}
    >
      {checked && (
        <Text style={[styles.checkboxMark, { color: theme.colors.textOnPrimary }]}>✓</Text>
      )}
    </View>
  );
}

interface CheckRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  isLast?: boolean;
}

export function CheckRow({ label, checked, onToggle, isLast = false }: CheckRowProps): ReactElement {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.row, rowBorderStyle(theme, isLast)]}
    >
      <Text style={[styles.rowLabel, { color: theme.colors.text }]}>{label}</Text>
      <Checkbox checked={checked} />
    </Pressable>
  );
}

interface NavigationRowProps {
  label: string;
  emphasis?: boolean;
  onPress: () => void;
  isLast?: boolean;
}

export function NavigationRow({
  label,
  emphasis = true,
  onPress,
  isLast = false,
}: NavigationRowProps): ReactElement {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.row, rowBorderStyle(theme, isLast)]}>
      <Text
        style={[
          styles.rowLabel,
          { color: emphasis ? theme.colors.text : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
      <Text style={{ color: theme.colors.textTertiary, fontSize: theme.typography.body.size }}>
        ›
      </Text>
    </Pressable>
  );
}

interface ActionRowProps {
  label: string;
  onPress: () => void;
  isLast?: boolean;
}

export function ActionRow({ label, onPress, isLast = false }: ActionRowProps): ReactElement {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, styles.actionRow, rowBorderStyle(theme, isLast)]}
    >
      <Text style={{ color: theme.colors.primary, fontSize: theme.typography.body.size }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionRow: {
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMark: {
    fontSize: 12,
    lineHeight: 16,
    width: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
