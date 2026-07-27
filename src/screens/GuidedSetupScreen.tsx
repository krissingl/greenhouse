import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import EnrichmentCard, { type EnrichmentAnswer } from '../components/EnrichmentCard';
import type { Constraint, ConstraintValue } from '../domain/constraint';
import type { Interest, InterestType } from '../domain/interest';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { COVERED_AXES, type EnrichmentAxis } from '../screens/enrichmentQuestions';
import { constraintService } from '../services/ConstraintService';
import { interestService } from '../services/InterestService';
import { useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'GuidedSetup'>;

function isAxisUnanswered(
  axis: EnrichmentAxis,
  interest: Interest,
  constraints: Constraint[],
): boolean {
  if (axis === 'Type') {
    return interest.type === null && interest.typeSkippedAt === null;
  }
  const constraint = constraints.find((c) => c.dimension === axis);
  return constraint === undefined || constraint.status === 'Unknown';
}

function currentAnswerFor(
  axis: EnrichmentAxis,
  interest: Interest,
  constraints: Constraint[],
): EnrichmentAnswer | null {
  if (axis === 'Type') {
    if (interest.type) {
      return { status: 'Set', value: interest.type };
    }
    if (interest.typeSkippedAt) {
      return { status: 'Unknown' };
    }
    return null;
  }

  const constraint = constraints.find((c) => c.dimension === axis);
  if (!constraint || constraint.status === 'Unknown') {
    return null;
  }
  return { status: constraint.status, value: constraint.value ?? undefined };
}

export default function GuidedSetupScreen({ route, navigation }: Props): ReactElement {
  const theme = useTheme();
  const { interestId, startDimension } = route.params;
  const [interest, setInterest] = useState<Interest | null | undefined>(undefined);
  const [constraints, setConstraints] = useState<Constraint[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
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
  }, [interestId]);

  const handleClose = () => navigation.navigate('InterestDetail', { interestId });

  // Single-card mode edits exactly the requested axis; sequential mode pages through
  // every covered axis, so Back/Forward have somewhere to go.
  const sequence: EnrichmentAxis[] = startDimension ? [startDimension] : COVERED_AXES;

  const initialIndex: number | null = startDimension
    ? 0
    : interest && constraints
      ? COVERED_AXES.findIndex((axis) => isAxisUnanswered(axis, interest, constraints))
      : null;

  const effectiveIndex = index !== null ? index : initialIndex;

  useEffect(() => {
    if (!startDimension && index === null && interest && constraints && initialIndex === -1) {
      navigation.navigate('InterestDetail', { interestId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDimension, interest, constraints, initialIndex, index]);

  const axisToRender: EnrichmentAxis | null =
    effectiveIndex !== null && effectiveIndex >= 0 ? sequence[effectiveIndex] : null;

  const handleAnswer = async (axis: EnrichmentAxis, answer: EnrichmentAnswer) => {
    try {
      setActionError(null);

      if (axis === 'Type') {
        if (answer.status === 'Set') {
          const updated = await interestService.update(interestId, {
            type: answer.value as InterestType,
            typeSkippedAt: null,
          });
          setInterest(updated);
        } else {
          const updated = await interestService.skipType(interestId);
          setInterest(updated);
        }
      } else {
        const updatedConstraint = await constraintService.answer(interestId, axis, {
          status: answer.status,
          value: answer.value as ConstraintValue | undefined,
        });
        setConstraints((prev) =>
          prev ? prev.map((c) => (c.dimension === axis ? updatedConstraint : c)) : prev,
        );
      }
    } catch {
      setActionError('Could not save your answer. Please try again.');
    }
  };

  const handleBack = () => {
    if (effectiveIndex === null || effectiveIndex < 0) {
      return;
    }
    if (effectiveIndex === 0) {
      navigation.navigate('InterestDetail', { interestId });
    } else {
      setIndex(effectiveIndex - 1);
    }
  };

  const handleForward = () => {
    if (effectiveIndex === null || effectiveIndex < 0) {
      return;
    }
    if (effectiveIndex === sequence.length - 1) {
      navigation.navigate('InterestDetail', { interestId });
    } else {
      setIndex(effectiveIndex + 1);
    }
  };

  if (loadError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error, fontSize: theme.typography.body.size }}>
          {loadError}
        </Text>
        <Pressable
          onPress={handleClose}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.textOnPrimary }}>Close</Text>
        </Pressable>
      </View>
    );
  }

  if (interest === undefined || constraints === undefined) {
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Pressable onPress={handleClose} style={styles.closeButton}>
        <Text style={{ color: theme.colors.textSecondary }}>Close</Text>
      </Pressable>

      {actionError && (
        <Text style={{ color: theme.colors.error, marginBottom: theme.spacing.sm }}>
          {actionError}
        </Text>
      )}

      {axisToRender && (
        <EnrichmentCard
          key={axisToRender}
          axis={axisToRender}
          answer={currentAnswerFor(axisToRender, interest, constraints)}
          onAnswer={(answer) => handleAnswer(axisToRender, answer)}
          onBack={handleBack}
          onForward={handleForward}
        />
      )}
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
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
});
