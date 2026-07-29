import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { ActionRow, GroupRow, OptionGroup, OptionRow } from './OptionGroup';
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

  // Every exit from this card (Back/Forward, Close, Home, hardware back, or the
  // screen navigating away out from under it) unmounts this component, so an
  // unmount-time flush is the one choke point that reliably covers all of them —
  // draft-holding axes (Supplies/Weather) would otherwise silently lose unsaved
  // edits on any exit path that isn't the explicit Back/Forward handlers.
  const itemsRef = useRef(items);
  const weatherMattersRef = useRef(weatherMatters);
  const weatherNoteRef = useRef(weatherNote);
  const onAnswerRef = useRef(onAnswer);

  useEffect(() => {
    itemsRef.current = items;
    weatherMattersRef.current = weatherMatters;
    weatherNoteRef.current = weatherNote;
    onAnswerRef.current = onAnswer;
  });

  useEffect(() => {
    return () => {
      if (question.variant === 'supplies') {
        const validItems = itemsRef.current.filter((item) => item.name.trim() !== '');
        if (validItems.length > 0) {
          onAnswerRef.current({ status: 'Set', value: validItems });
        }
      } else if (question.variant === 'weather' && weatherMattersRef.current) {
        onAnswerRef.current({
          status: 'Set',
          value: { matters: true, note: weatherNoteRef.current || undefined },
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <View style={styles.groupStack}>
        {(question.variant === 'type' || question.variant === 'chips') && (
          <OptionGroup>
            {question.options.map((option, index) => (
              <OptionRow
                key={String(option.value)}
                label={option.label}
                selected={answer?.status === 'Set' && answer.value === option.value}
                onPress={() => onAnswer({ status: 'Set', value: option.value })}
                isLast={index === question.options.length - 1}
              />
            ))}
          </OptionGroup>
        )}

        {question.variant === 'supplies' && (
          <SuppliesEditor items={items} onChangeItems={setItems} />
        )}

        {question.variant === 'weather' && (
          <WeatherEditor
            matters={weatherMatters}
            note={weatherNote}
            onToggleMatters={() => setWeatherMatters(true)}
            onChangeNote={setWeatherNote}
          />
        )}

        {question.variant !== 'type' && (
          <OptionGroup>
            <OptionRow
              label="None / doesn't apply"
              selected={answer?.status === 'None'}
              onPress={handleDoesNotApply}
              isLast
            />
          </OptionGroup>
        )}
      </View>

      {hasAnswer && (
        <Pressable onPress={handleClear} style={styles.textButton}>
          <Text style={{ color: theme.colors.textSecondary }}>Clear answer</Text>
        </Pressable>
      )}

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

function SuppliesEditor({
  items,
  onChangeItems,
}: {
  items: SupplyItem[];
  onChangeItems: (items: SupplyItem[]) => void;
}): ReactElement {
  const theme = useTheme();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const previousLengthRef = useRef(items.length);

  useEffect(() => {
    if (items.length > previousLengthRef.current) {
      inputRefs.current[items.length - 1]?.focus();
    }
    previousLengthRef.current = items.length;
  }, [items.length]);

  return (
    <OptionGroup>
      {items.map((item, index) => (
        <GroupRow key={index} isLast={false}>
          <TextInput
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
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
          <Text style={{ color: theme.colors.textSecondary }}>
            {item.have ? 'Have it' : 'Need it'}
          </Text>
          <Switch
            value={item.have}
            onValueChange={(have) => {
              const next = items.slice();
              next[index] = { ...item, have };
              onChangeItems(next);
            }}
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
          />
          <Pressable
            accessibilityLabel="Remove item"
            onPress={() => onChangeItems(items.filter((_, i) => i !== index))}
            hitSlop={8}
          >
            <Text style={{ color: theme.colors.error, fontSize: theme.typography.title.size }}>
              🗑
            </Text>
          </Pressable>
        </GroupRow>
      ))}
      <ActionRow
        label="+ Add item"
        onPress={() => onChangeItems([...items, { name: '', have: false }])}
        isLast
      />
    </OptionGroup>
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
    <OptionGroup>
      <OptionRow
        label="Yes, it matters"
        selected={matters}
        onPress={onToggleMatters}
        isLast={!matters}
      />
      {matters && (
        <GroupRow isLast>
          <TextInput
            value={note}
            onChangeText={onChangeNote}
            placeholder="What matters — heat, cold, rain, a season? (optional)"
            placeholderTextColor={theme.colors.textTertiary}
            style={[
              styles.weatherNoteInput,
              { color: theme.colors.text, borderColor: theme.colors.border },
            ]}
          />
        </GroupRow>
      )}
    </OptionGroup>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
  },
  groupStack: {
    marginTop: 12,
    gap: 12,
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
    marginTop: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  supplyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weatherNoteInput: {
    alignSelf: 'stretch',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
