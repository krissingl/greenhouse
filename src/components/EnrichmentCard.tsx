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
  onBack: () => void;
  onForward: () => void;
}

type WeatherValue = { matters: true; note?: string };

export default function EnrichmentCard({
  axis,
  answer,
  onAnswer,
  onBack,
  onForward,
}: EnrichmentCardProps): ReactElement {
  const theme = useTheme();
  const question = enrichmentQuestions[axis];

  const initialItems =
    question.variant === 'supplies' && answer?.status === 'Set' ? (answer.value as SupplyItem[]) : [];
  const initialWeather =
    question.variant === 'weather' && answer?.status === 'Set'
      ? (answer.value as WeatherValue)
      : null;

  const [items, setItems] = useState<SupplyItem[]>(initialItems);
  const [weatherMatters, setWeatherMatters] = useState<boolean>(initialWeather !== null);
  const [weatherNote, setWeatherNote] = useState<string>(initialWeather?.note ?? '');

  const handleDoesNotApply = () => onAnswer({ status: 'None' });

  const hasAnswer =
    question.variant === 'supplies'
      ? items.some((item) => item.name.trim() !== '')
      : question.variant === 'weather'
        ? weatherMatters || answer?.status === 'None'
        : answer !== null && answer.status !== 'Unknown';

  const handleClear = () => {
    onAnswer({ status: 'Unknown' });
    setItems([]);
    setWeatherMatters(false);
    setWeatherNote('');
  };

  const flushDraft = () => {
    if (question.variant === 'supplies') {
      const validItems = items.filter((item) => item.name.trim() !== '');
      if (validItems.length > 0) {
        onAnswer({ status: 'Set', value: validItems });
      }
    } else if (question.variant === 'weather' && weatherMatters) {
      onAnswer({ status: 'Set', value: { matters: true, note: weatherNote || undefined } });
    }
  };

  const handleBack = () => {
    if (hasAnswer) {
      flushDraft();
    }
    onBack();
  };

  const handleForward = () => {
    if (!hasAnswer) {
      onAnswer({ status: 'Unknown' });
    } else {
      flushDraft();
    }
    onForward();
  };

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
            items={items}
            onChangeItems={setItems}
          />
        )}

        {question.variant === 'weather' && (
          <WeatherEditor
            matters={weatherMatters}
            note={weatherNote}
            onToggleMatters={() => setWeatherMatters(true)}
            onChangeNote={setWeatherNote}
          />
        )}
      </View>

      <View style={styles.escapeRow}>
        {question.variant !== 'type' && (
          <ChoiceChip
            label="None / doesn't apply"
            selected={answer?.status === 'None'}
            onPress={handleDoesNotApply}
          />
        )}
        {hasAnswer && (
          <Pressable onPress={handleClear} style={styles.textButton}>
            <Text style={{ color: theme.colors.textSecondary }}>Clear answer</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.navRow}>
        <Pressable
          onPress={handleBack}
          style={[styles.navButton, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <Text style={{ color: theme.colors.text }}>Back</Text>
        </Pressable>
        <Pressable
          onPress={handleForward}
          style={[styles.navButton, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.textOnPrimary }}>
            {hasAnswer ? 'Next' : 'Skip'}
          </Text>
        </Pressable>
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
  items,
  onChangeItems,
}: {
  items: SupplyItem[];
  onChangeItems: (items: SupplyItem[]) => void;
}): ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.suppliesContainer}>
      {items.map((item, index) => (
        <View key={index} style={styles.supplyRow}>
          <TextInput
            value={item.name}
            onChangeText={(name) => {
              const next = items.slice();
              next[index] = { ...item, name };
              onChangeItems(next);
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
              onChangeItems(next);
            }}
          />
          <Pressable
            accessibilityLabel="Remove item"
            onPress={() => onChangeItems(items.filter((_, i) => i !== index))}
          >
            <Text style={{ color: theme.colors.error }}>Remove</Text>
          </Pressable>
        </View>
      ))}
      <ChoiceChip
        label="+ Add item"
        selected={false}
        onPress={() => onChangeItems([...items, { name: '', have: false }])}
      />
    </View>
  );
}

function WeatherEditor({
  matters,
  note,
  onToggleMatters,
  onChangeNote,
}: {
  matters: boolean;
  note: string;
  onToggleMatters: () => void;
  onChangeNote: (note: string) => void;
}): ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.suppliesContainer}>
      <ChoiceChip label="Yes, it matters" selected={matters} onPress={onToggleMatters} />
      {matters && (
        <TextInput
          value={note}
          onChangeText={onChangeNote}
          placeholder="What matters — heat, cold, rain, a season? (optional)"
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
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  textButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
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
