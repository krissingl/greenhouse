import { useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ConstraintStatus, ConstraintValue, SupplyItem } from '../domain/constraint';
import type { InterestType } from '../domain/interest';
import { enrichmentQuestions, type EnrichmentAxis } from '../screens/enrichmentQuestions';
import { useTheme } from '../theme';

export interface EnrichmentAnswer {
  status: ConstraintStatus;
  value?: ConstraintValue | InterestType;
}

interface EnrichmentCardProps {
  axis: EnrichmentAxis;
  answer: EnrichmentAnswer | null;
  onAnswer: (answer: EnrichmentAnswer) => void;
}

export default function EnrichmentCard({
  axis,
  answer,
  onAnswer,
}: EnrichmentCardProps): ReactElement {
  const theme = useTheme();
  const question = enrichmentQuestions[axis];

  const handleNotSure = () => onAnswer({ status: 'Unknown' });
  const handleDoesNotApply = () => onAnswer({ status: 'None' });

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={{ color: theme.colors.text, fontSize: theme.typography.h3.size }}>
        {question.prompt}
      </Text>

      <View style={styles.optionsRow}>
        {question.variant === 'type' &&
          question.options.map((option) => (
            <ChoiceChip
              key={String(option.value)}
              label={option.label}
              selected={answer?.status === 'Set' && answer.value === option.value}
              onPress={() => onAnswer({ status: 'Set', value: option.value })}
            />
          ))}

        {question.variant === 'chips' &&
          question.options.map((option) => (
            <ChoiceChip
              key={String(option.value)}
              label={option.label}
              selected={answer?.status === 'Set' && answer.value === option.value}
              onPress={() => onAnswer({ status: 'Set', value: option.value })}
            />
          ))}

        {question.variant === 'supplies' && (
          <SuppliesEditor
            value={answer?.status === 'Set' ? (answer.value as SupplyItem[]) : []}
            onChange={(items) => onAnswer({ status: 'Set', value: items })}
          />
        )}

        {question.variant === 'weather' && (
          <WeatherEditor
            value={
              answer?.status === 'Set' ? (answer.value as { matters: true; note?: string }) : null
            }
            onChange={(value) => onAnswer({ status: 'Set', value })}
          />
        )}
      </View>

      <View style={styles.escapeRow}>
        <ChoiceChip
          label="Not sure / later"
          selected={answer?.status === 'Unknown'}
          onPress={handleNotSure}
        />
        {question.variant !== 'type' && (
          <ChoiceChip
            label="None / doesn't apply"
            selected={answer?.status === 'None'}
            onPress={handleDoesNotApply}
          />
        )}
      </View>
    </View>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): ReactElement {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceVariant },
      ]}
    >
      <Text style={{ color: selected ? theme.colors.textOnPrimary : theme.colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SuppliesEditor({
  value,
  onChange,
}: {
  value: SupplyItem[];
  onChange: (items: SupplyItem[]) => void;
}): ReactElement {
  const theme = useTheme();
  const [items, setItems] = useState<SupplyItem[]>(value);

  const commit = (next: SupplyItem[]) => {
    setItems(next);
    onChange(next);
  };

  return (
    <View style={styles.suppliesContainer}>
      {items.map((item, index) => (
        <View key={index} style={styles.supplyRow}>
          <TextInput
            value={item.name}
            onChangeText={(name) => {
              const next = items.slice();
              next[index] = { ...item, name };
              commit(next);
            }}
            placeholder="Item name"
            placeholderTextColor={theme.colors.textTertiary}
            style={[
              styles.supplyInput,
              { color: theme.colors.text, borderColor: theme.colors.border },
            ]}
          />
          <ChoiceChip
            label={item.have ? 'Have it' : 'Need it'}
            selected={item.have}
            onPress={() => {
              const next = items.slice();
              next[index] = { ...item, have: !item.have };
              commit(next);
            }}
          />
          <Pressable
            accessibilityLabel="Remove item"
            onPress={() => commit(items.filter((_, i) => i !== index))}
          >
            <Text style={{ color: theme.colors.error }}>Remove</Text>
          </Pressable>
        </View>
      ))}
      <ChoiceChip
        label="+ Add item"
        selected={false}
        onPress={() => commit([...items, { name: '', have: false }])}
      />
    </View>
  );
}

function WeatherEditor({
  value,
  onChange,
}: {
  value: { matters: true; note?: string } | null;
  onChange: (value: { matters: true; note?: string }) => void;
}): ReactElement {
  const theme = useTheme();
  const [note, setNote] = useState(value?.note ?? '');

  return (
    <View style={styles.suppliesContainer}>
      <ChoiceChip
        label="Yes, it matters"
        selected={value !== null}
        onPress={() => onChange({ matters: true, note })}
      />
      {value !== null && (
        <TextInput
          value={note}
          onChangeText={setNote}
          onBlur={() => onChange({ matters: true, note })}
          placeholder="Anything specific? (optional)"
          placeholderTextColor={theme.colors.textTertiary}
          style={[
            styles.supplyInput,
            { color: theme.colors.text, borderColor: theme.colors.border },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  escapeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  suppliesContainer: {
    width: '100%',
    gap: 8,
  },
  supplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supplyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
