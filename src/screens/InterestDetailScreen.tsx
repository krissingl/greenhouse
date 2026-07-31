import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import InterestStateIcon from '../components/InterestStateIcon';
import { GroupRow, OptionGroup } from '../components/OptionGroup';
import type { Constraint, SupplyItem } from '../domain/constraint';
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
  WeatherSeason: 'Weather',
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
        <Text style={{ color: theme.colors.primary, fontSize: theme.typography.body.size }}>
          {answered ? '✎' : '＋'}
        </Text>
      </Pressable>
    </GroupRow>
  );
}

function SuppliesRow({
  constraint,
  expanded,
  onToggleExpand,
  onEditPress,
  isLast,
  theme,
}: {
  constraint: Constraint | undefined;
  expanded: boolean;
  onToggleExpand: () => void;
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

  const items = (constraint.value as SupplyItem[] | null) ?? [];
  const needItems = items.filter((item) => !item.have);
  const haveItems = items.filter((item) => item.have);
  const summary =
    items.length === 0 ? 'No supplies needed' : `${needItems.length} need it · ${haveItems.length} have it`;

  return (
    <View>
      <GroupRow isLast={isLast && !expanded}>
        <Pressable onPress={onToggleExpand} style={styles.suppliesToggle}>
          <Text style={styles.rowText}>
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Supplies: </Text>
            <Text style={{ color: theme.colors.text }}>{summary}</Text>
          </Text>
          <Text style={{ color: theme.colors.textSecondary, marginRight: 8 }}>
            {expanded ? '▾' : '▸'}
          </Text>
        </Pressable>
        <Pressable accessibilityLabel="Edit Supplies" onPress={onEditPress} hitSlop={8}>
          <Text style={{ color: theme.colors.primary, fontSize: theme.typography.body.size }}>✎</Text>
        </Pressable>
      </GroupRow>
      {expanded && items.length > 0 && (
        <View style={[styles.suppliesList, { borderColor: theme.colors.border }]}>
          {needItems.map((item, index) => (
            <Text key={`need-${index}`} style={{ color: theme.colors.text, paddingVertical: 4 }}>
              ○ {item.name} — need it
            </Text>
          ))}
          {haveItems.map((item, index) => (
            <Text key={`have-${index}`} style={{ color: theme.colors.textSecondary, paddingVertical: 4 }}>
              ● {item.name} — have it
            </Text>
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
          accessibilityLabel="Edit"
          onPress={() => navigation.navigate('EditInterest', { interestId })}
          hitSlop={8}
          style={styles.titleIcon}
        >
          <Text style={{ color: theme.colors.primary, fontSize: theme.typography.title.size }}>✎</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Journal"
          onPress={() => navigation.navigate('NoteJournal', { interestId })}
          hitSlop={8}
          style={styles.titleIcon}
        >
          <Text style={{ color: theme.colors.primary, fontSize: theme.typography.title.size }}>📝</Text>
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
                  constraint={constraints.find((c) => c.dimension === 'Supplies')}
                  expanded={suppliesExpanded}
                  onToggleExpand={() => setSuppliesExpanded((prev) => !prev)}
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
  titleIcon: {
    marginLeft: 12,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
