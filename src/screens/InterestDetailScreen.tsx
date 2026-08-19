import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import InterestStateIcon from '../components/InterestStateIcon';
import { CheckRow, GroupRow, OptionGroup } from '../components/OptionGroup';
import { findConstraint, type Constraint, type SupplyItem } from '../domain/constraint';
import { displayLabel, type Interest } from '../domain/interest';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { COVERED_AXES, summarizeAnswer, type EnrichmentAxis } from './enrichmentQuestions';
import { constraintService } from '../services/ConstraintService';
import { interestService } from '../services/InterestService';
import { useTheme, type Theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestDetail'>;

const AXIS_LABELS: Record<EnrichmentAxis, string> = {
  Type: 'Type',
  Time: 'Time',
  Supplies: 'Supplies',
  Location: 'Location',
  Social: 'Social',
  Weather: 'Weather',
  Season: 'Season',
  TimeOfDay: 'Time of day',
};

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDueDate(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

interface RowInfo {
  label: string;
  valueText: string;
  answered: boolean;
}

function rowInfoFor(axis: EnrichmentAxis, interest: Interest, constraints: Constraint[]): RowInfo {
  const label = AXIS_LABELS[axis];

  if (axis === 'Type') {
    if (interest.type) {
      return { label, valueText: summarizeAnswer('Type', 'Set', interest.type) ?? interest.type, answered: true };
    }
    if (interest.typeSkippedAt) {
      return { label, valueText: 'Not sure yet', answered: true };
    }
    return { label, valueText: 'Not set', answered: false };
  }

  const constraint = constraints.find((c) => c.dimension === axis);
  if (!constraint || constraint.status === 'Unknown') {
    return { label, valueText: 'Not set', answered: false };
  }

  const summary = summarizeAnswer(axis, constraint.status, constraint.value);
  return { label, valueText: summary ?? label, answered: true };
}

function isAxisAnswered(axis: EnrichmentAxis, interest: Interest, constraints: Constraint[]): boolean {
  if (axis === 'Type') {
    return interest.type !== null || interest.typeSkippedAt !== null;
  }
  const constraint = constraints.find((c) => c.dimension === axis);
  return constraint !== undefined && constraint.status !== 'Unknown';
}

function RowActionIcon({ answered, theme }: { answered: boolean; theme: Theme }): ReactElement {
  return (
    <Feather
      name={answered ? 'edit-2' : 'plus'}
      size={theme.typography.title.size}
      color={theme.colors.primary}
    />
  );
}

function AnswerRow({
  label,
  valueText,
  answered,
  onEditPress,
  isLast,
  theme,
}: RowInfo & { onEditPress: () => void; isLast: boolean; theme: Theme }): ReactElement {
  return (
    <GroupRow isLast={isLast}>
      <Text style={styles.rowText}>
        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{label}: </Text>
        <Text style={{ color: answered ? theme.colors.text : theme.colors.textTertiary }}>
          {valueText}
        </Text>
      </Text>
      <Pressable
        accessibilityLabel={answered ? `Edit ${label}` : `Add ${label}`}
        onPress={onEditPress}
        hitSlop={8}
      >
        <RowActionIcon answered={answered} theme={theme} />
      </Pressable>
    </GroupRow>
  );
}

function suppliesSummary(items: SupplyItem[]): { text: string; missing: number } {
  if (items.length === 0) {
    return { text: 'No supplies needed', missing: 0 };
  }
  const missing = items.filter((item) => !item.have).length;
  return { text: missing === 0 ? 'All on hand' : `${missing} Missing`, missing };
}

function SuppliesRow({
  constraint,
  expanded,
  onToggleExpand,
  onToggleItem,
  onEditPress,
  isLast,
  theme,
}: {
  constraint: Constraint<'Supplies'> | undefined;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleItem: (index: number) => void;
  onEditPress: () => void;
  isLast: boolean;
  theme: Theme;
}): ReactElement {
  if (!constraint || constraint.status === 'Unknown') {
    return (
      <AnswerRow
        label="Supplies"
        valueText="Not set"
        answered={false}
        onEditPress={onEditPress}
        isLast={isLast}
        theme={theme}
      />
    );
  }

  if (constraint.status === 'None') {
    return (
      <AnswerRow
        label="Supplies"
        valueText="Doesn't apply"
        answered
        onEditPress={onEditPress}
        isLast={isLast}
        theme={theme}
      />
    );
  }

  const items = constraint.value ?? [];
  const summary = suppliesSummary(items);

  return (
    <View>
      <GroupRow isLast={isLast && !expanded}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse supplies' : 'Expand supplies'}
          accessibilityState={{ expanded }}
          onPress={onToggleExpand}
          style={styles.suppliesToggle}
        >
          <Text style={styles.rowText}>
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Supplies: </Text>
            <Text
              style={{
                color: summary.missing > 0 ? theme.colors.error : theme.colors.textSecondary,
              }}
            >
              {summary.text}
            </Text>
          </Text>
          <Text style={[styles.disclosure, { color: theme.colors.text }]}>
            {expanded ? '▼' : '▶'}
          </Text>
        </Pressable>
        <Pressable accessibilityLabel="Edit Supplies" onPress={onEditPress} hitSlop={8}>
          <RowActionIcon answered theme={theme} />
        </Pressable>
      </GroupRow>
      {expanded && items.length > 0 && (
        <View style={[styles.suppliesList, { borderColor: theme.colors.border }]}>
          {items.map((item, index) => (
            <CheckRow
              key={index}
              label={item.name}
              checked={item.have}
              onToggle={() => onToggleItem(index)}
              isLast={index === items.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function InterestDetailScreen({ route, navigation }: Props): ReactElement {
  const theme = useTheme();
  const { interestId } = route.params;
  const [interest, setInterest] = useState<Interest | null | undefined>(undefined);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [suppliesExpanded, setSuppliesExpanded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      Promise.all([interestService.get(interestId), constraintService.listForInterest(interestId)])
        .then(([interestResult, constraintResult]) => {
          if (!cancelled) {
            setInterest(interestResult);
            setConstraints(constraintResult);
            setLoadError(null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoadError('Could not load this interest. Please try again.');
          }
        });

      return () => {
        cancelled = true;
      };
    }, [interestId]),
  );

  const state = interest ? interest.state : null;
  useEffect(() => {
    navigation.setOptions({
      headerTitle: state ? () => <InterestStateIcon state={state} /> : undefined,
    });
  }, [navigation, state]);

  if (loadError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error, fontSize: theme.typography.body.size }}>
          {loadError}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('InterestList')}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.textOnPrimary }}>Back to list</Text>
        </Pressable>
      </View>
    );
  }

  if (interest === undefined) {
    return <View style={[styles.container, { backgroundColor: theme.colors.background }]} />;
  }

  if (interest === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text, fontSize: theme.typography.body.size }}>
          This interest could not be found.
        </Text>
        <Pressable
          onPress={() => navigation.navigate('InterestList')}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.textOnPrimary }}>Back to list</Text>
        </Pressable>
      </View>
    );
  }

  const handleStart = async () => {
    try {
      setActionError(null);
      const updated = await interestService.setState(interestId, 'InProgress');
      setInterest(updated);
    } catch {
      setActionError('Could not start this interest. Please try again.');
    }
  };

  const handleToggleSupply = async (index: number) => {
    const supplies = findConstraint(constraints, 'Supplies');
    if (!supplies || supplies.status !== 'Set') {
      return;
    }

    const items = supplies.value ?? [];
    const nextItems = items.map((item, i) => (i === index ? { ...item, have: !item.have } : item));
    const previous = constraints;

    setActionError(null);
    setConstraints((current) =>
      current.map((c) => (c.dimension === 'Supplies' ? { ...c, value: nextItems } : c)),
    );

    try {
      await constraintService.answer(interestId, 'Supplies', { status: 'Set', value: nextItems });
    } catch {
      setConstraints(previous);
      setActionError('Could not update supplies. Please try again.');
    }
  };

  const allAxesAnswered = COVERED_AXES.every((axis) => isAxisAnswered(axis, interest, constraints));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.titleRow}>
        <View style={styles.titleTextGroup}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.h2.size }}>
            {interest.title}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.bodySmall.size }}>
            {displayLabel(interest.state)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit"
          onPress={() => navigation.navigate('EditInterest', { interestId })}
          hitSlop={8}
          style={styles.titleAction}
        >
          <Text
            style={[
              styles.titleActionLabel,
              { color: theme.colors.primary, fontSize: theme.typography.bodySmall.size },
            ]}
          >
            Edit
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Journal"
          onPress={() => navigation.navigate('NoteJournal', { interestId })}
          hitSlop={8}
          style={styles.titleAction}
        >
          <Text
            style={[
              styles.titleActionLabel,
              { color: theme.colors.primary, fontSize: theme.typography.bodySmall.size },
            ]}
          >
            Journal
          </Text>
        </Pressable>
      </View>

      <Text style={{ color: theme.colors.textTertiary, marginTop: theme.spacing.sm }}>
        Created: {formatDisplayDate(interest.createdAt)}
      </Text>
      <Text style={{ color: theme.colors.textTertiary }}>
        Updated: {formatDisplayDate(interest.updatedAt)}
      </Text>
      {interest.dueBy && (
        <Text style={{ color: theme.colors.textTertiary }}>Due by: {formatDueDate(interest.dueBy)}</Text>
      )}

      {actionError && (
        <Text style={{ color: theme.colors.error, marginTop: theme.spacing.sm }}>
          {actionError}
        </Text>
      )}

      {interest.state === 'Backlog' && (
        <Pressable
          onPress={handleStart}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.textOnPrimary }}>Start</Text>
        </Pressable>
      )}

      <View style={styles.answerGroup}>
        <OptionGroup>
          {COVERED_AXES.map((axis, index) => {
            const isLast = index === COVERED_AXES.length - 1;
            if (axis === 'Supplies') {
              return (
                <SuppliesRow
                  key={axis}
                  constraint={findConstraint(constraints, 'Supplies')}
                  expanded={suppliesExpanded}
                  onToggleExpand={() => setSuppliesExpanded((prev) => !prev)}
                  onToggleItem={handleToggleSupply}
                  onEditPress={() =>
                    navigation.navigate('GuidedSetup', { interestId, startDimension: axis })
                  }
                  isLast={isLast}
                  theme={theme}
                />
              );
            }
            const info = rowInfoFor(axis, interest, constraints);
            return (
              <AnswerRow
                key={axis}
                {...info}
                onEditPress={() =>
                  navigation.navigate('GuidedSetup', { interestId, startDimension: axis })
                }
                isLast={isLast}
                theme={theme}
              />
            );
          })}
        </OptionGroup>

        {!allAxesAnswered && (
          <Pressable
            onPress={() => navigation.navigate('GuidedSetup', { interestId })}
            style={[styles.button, styles.tellMeMoreButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={{ color: theme.colors.textOnPrimary }}>＋ Tell me more</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  button: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTextGroup: {
    flex: 1,
  },
  titleAction: {
    marginLeft: 16,
  },
  titleActionLabel: {
    fontWeight: '600',
  },
  answerGroup: {
    marginTop: 20,
  },
  tellMeMoreButton: {
    marginTop: 12,
  },
  rowText: {
    flex: 1,
  },
  suppliesToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suppliesList: {
    marginTop: -1,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  disclosure: {
    marginRight: 8,
    fontSize: 12,
    lineHeight: 16,
  },
});
