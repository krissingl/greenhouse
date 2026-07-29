import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState, type ReactElement } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { NavigationRow, OptionGroup } from '../components/OptionGroup';
import type { Constraint } from '../domain/constraint';
import type { Interest } from '../domain/interest';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { describeCapability } from './describeCapability';
import {
  COVERED_AXES,
  enrichmentQuestions,
  summarizeAnswer,
  type EnrichmentAxis,
} from './enrichmentQuestions';
import { constraintService } from '../services/ConstraintService';
import { interestService } from '../services/InterestService';
import { useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestDetail'>;

interface ChipDisplay {
  axis: EnrichmentAxis;
  text: string;
  answered: boolean;
}

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function chipDisplayFor(
  axis: EnrichmentAxis,
  interest: Interest,
  constraints: Constraint[],
): ChipDisplay {
  const shortLabel = enrichmentQuestions[axis].shortLabel;

  if (axis === 'Type') {
    if (interest.type) {
      const text = summarizeAnswer('Type', 'Set', interest.type) ?? interest.type;
      return { axis, text, answered: true };
    }
    if (interest.typeSkippedAt) {
      return { axis, text: 'Not sure yet', answered: true };
    }
    return { axis, text: `＋ add ${shortLabel}`, answered: false };
  }

  const constraint = constraints.find((c) => c.dimension === axis);
  if (!constraint || constraint.status === 'Unknown') {
    return { axis, text: `＋ add ${shortLabel}`, answered: false };
  }

  const summary = summarizeAnswer(axis, constraint.status, constraint.value);
  return { axis, text: summary ?? shortLabel, answered: true };
}

export default function InterestDetailScreen({ route, navigation }: Props): ReactElement {
  const theme = useTheme();
  const { interestId } = route.params;
  const [interest, setInterest] = useState<Interest | null | undefined>(undefined);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const isArchived = interest.archivedAt !== null;

  const handleArchiveToggle = async () => {
    try {
      setActionError(null);
      if (isArchived) {
        const updated = await interestService.unarchive(interestId);
        setInterest(updated);
      } else {
        await interestService.archive(interestId);
        navigation.navigate('InterestList');
      }
    } catch {
      setActionError('Could not update this interest. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete this interest?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionError(null);
            await interestService.delete(interestId);
            navigation.navigate('InterestList');
          } catch {
            setActionError('Could not delete this interest. Please try again.');
          }
        },
      },
    ]);
  };

  const capabilityCopy = describeCapability(constraints, interest.type, interest.typeSkippedAt);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={{ color: theme.colors.text, fontSize: theme.typography.h2.size }}>
        {interest.title}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>
        State: {interest.state}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}>
        Type: {interest.type ?? 'not set'}
      </Text>
      <Text style={{ color: theme.colors.textTertiary, marginTop: theme.spacing.sm }}>
        Created: {formatDisplayDate(interest.createdAt)}
      </Text>
      <Text style={{ color: theme.colors.textTertiary }}>
        Updated: {formatDisplayDate(interest.updatedAt)}
      </Text>

      <Text
        style={{
          color: theme.colors.textSecondary,
          marginTop: theme.spacing.md,
          fontStyle: 'italic',
        }}
      >
        {capabilityCopy}
      </Text>

      <View style={styles.chipRow}>
        <OptionGroup>
          {COVERED_AXES.map((axis, index) => {
            const chip = chipDisplayFor(axis, interest, constraints);
            return (
              <NavigationRow
                key={axis}
                label={chip.text}
                emphasis={chip.answered}
                onPress={() =>
                  navigation.navigate('GuidedSetup', { interestId, startDimension: axis })
                }
                isLast={index === COVERED_AXES.length - 1}
              />
            );
          })}
        </OptionGroup>
      </View>

      <Pressable
        onPress={() => navigation.navigate('GuidedSetup', { interestId })}
        style={[styles.button, { backgroundColor: theme.colors.tertiary }]}
      >
        <Text style={{ color: theme.colors.textOnPrimary }}>＋ Tell me more</Text>
      </Pressable>

      {actionError && (
        <Text style={{ color: theme.colors.error, marginTop: theme.spacing.sm }}>
          {actionError}
        </Text>
      )}

      <Pressable
        onPress={() => navigation.navigate('EditInterest', { interestId })}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={{ color: theme.colors.textOnPrimary }}>Edit</Text>
      </Pressable>

      <Pressable
        onPress={handleArchiveToggle}
        style={[styles.button, { backgroundColor: theme.colors.secondary }]}
      >
        <Text style={{ color: theme.colors.textOnPrimary }}>
          {isArchived ? 'Unarchive' : 'Archive'}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleDelete}
        style={[styles.button, { backgroundColor: theme.colors.error }]}
      >
        <Text style={{ color: theme.colors.textOnPrimary }}>Delete</Text>
      </Pressable>
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
  chipRow: {
    marginTop: 12,
  },
});
