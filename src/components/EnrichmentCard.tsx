import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionRow, CheckRow, Checkbox, GroupRow, OptionGroup, OptionRow } from './OptionGroup';
import type { ConstraintStatus, ConstraintValue, SupplyItem } from '../domain/constraint';
import type { InterestType } from '../domain/interest';
import {
  enrichmentQuestions,
  type EnrichmentAxis,
  type MultiSelectOption,
} from '../screens/enrichmentQuestions';
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
  /** The Interest's current due date, offered as a follow-up on the Season and TimeOfDay cards. */
  dueBy?: string | null;
  onDueByChange?: (dueBy: string | null) => void;
}

// A multi-select card is bound to exactly one of Weather/Season/TimeOfDay, so its
// selections are homogeneous — but TypeScript only sees the union element type,
// which is not assignable to any single one of ConstraintValue's array members.
function asMultiSelectValue(selections: MultiSelectOption[]): ConstraintValue {
  return selections as ConstraintValue;
}

export default function EnrichmentCard({
  axis,
  answer,
  onAnswer,
  onBack,
  onForward,
  dueBy,
  onDueByChange,
}: EnrichmentCardProps): ReactElement {
  const theme = useTheme();
  const question = enrichmentQuestions[axis];

  const initialItems =
    question.variant === 'supplies' && answer?.status === 'Set' ? (answer.value as SupplyItem[]) : [];
  const initialSelections =
    question.variant === 'multi' && answer?.status === 'Set'
      ? (answer.value as MultiSelectOption[])
      : [];
  const initialDueBy = dueBy ?? '';

  const [items, setItems] = useState<SupplyItem[]>(initialItems);
  const [selections, setSelections] = useState<MultiSelectOption[]>(initialSelections);
  const [dueByDraft, setDueByDraft] = useState<string>(initialDueBy);

  // Every exit from this card (Back/Forward, Close, Home, hardware back, or the
  // screen navigating away out from under it) unmounts this component, so an
  // unmount-time flush is the one choke point that reliably covers all of them —
  // draft-holding axes (Supplies/Weather) would otherwise silently lose unsaved
  // edits on any exit path that isn't the explicit Back/Forward handlers.
  const itemsRef = useRef(items);
  const selectionsRef = useRef(selections);
  const dueByDraftRef = useRef(dueByDraft);
  const onAnswerRef = useRef(onAnswer);
  const onDueByChangeRef = useRef(onDueByChange);

  useEffect(() => {
    itemsRef.current = items;
    selectionsRef.current = selections;
    dueByDraftRef.current = dueByDraft;
    onAnswerRef.current = onAnswer;
    onDueByChangeRef.current = onDueByChange;
  });

  const offersDueBy = question.variant === 'multi' && question.offersDueBy;

  useEffect(() => {
    return () => {
      if (question.variant === 'supplies') {
        const validItems = itemsRef.current.filter((item) => item.name.trim() !== '');
        if (validItems.length > 0) {
          onAnswerRef.current({ status: 'Set', value: validItems });
        }
      } else if (question.variant === 'multi') {
        if (selectionsRef.current.length > 0) {
          onAnswerRef.current({ status: 'Set', value: asMultiSelectValue(selectionsRef.current) });
        }
        if (
          offersDueBy &&
          onDueByChangeRef.current &&
          dueByDraftRef.current !== initialDueBy
        ) {
          onDueByChangeRef.current(
            dueByDraftRef.current.trim().length > 0 ? dueByDraftRef.current.trim() : null,
          );
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDoesNotApply = () => onAnswer({ status: 'None' });

  const hasAnswer =
    question.variant === 'supplies'
      ? items.some((item) => item.name.trim() !== '')
      : question.variant === 'multi'
        ? selections.length > 0 || answer?.status === 'None'
        : answer !== null && answer.status !== 'Unknown';

  const handleClear = () => {
    onAnswer({ status: 'Unknown' });
    setItems([]);
    setSelections([]);
  };

  const flushDraft = () => {
    if (question.variant === 'supplies') {
      const validItems = items.filter((item) => item.name.trim() !== '');
      if (validItems.length > 0) {
        onAnswer({ status: 'Set', value: validItems });
      }
    } else if (question.variant === 'multi') {
      if (selections.length > 0) {
        onAnswer({ status: 'Set', value: asMultiSelectValue(selections) });
      }
      if (offersDueBy && onDueByChange && dueByDraft !== initialDueBy) {
        onDueByChange(dueByDraft.trim().length > 0 ? dueByDraft.trim() : null);
      }
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

        {question.variant === 'multi' && (
          <MultiSelectEditor
            options={question.options}
            selected={selections}
            onToggle={(option) =>
              setSelections((prev) =>
                prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
              )
            }
            showDueBy={question.offersDueBy}
            dueByDraft={dueByDraft}
            onChangeDueBy={setDueByDraft}
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

      {hasAnswer && <ClearAnswerButton onPress={handleClear} />}

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

function ClearAnswerButton({ onPress }: { onPress: () => void }): ReactElement {
  const theme = useTheme();
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: theme.animation.fast,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={{
        alignSelf: 'flex-start',
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Clear answer"
        onPress={onPress}
        style={styles.textButton}
      >
        <Text style={{ color: theme.colors.textSecondary }}>Clear answer</Text>
      </Pressable>
    </Animated.View>
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

  const indexed = items.map((item, index) => ({ item, index }));
  const needIt = indexed.filter(({ item }) => !item.have);
  const haveIt = indexed.filter(({ item }) => item.have);

  const renderRow = (
    { item, index }: { item: SupplyItem; index: number },
    isLast: boolean,
  ): ReactElement => (
    <GroupRow key={index} isLast={isLast}>
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
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="Have it"
        accessibilityState={{ checked: item.have }}
        onPress={() => {
          const next = items.slice();
          next[index] = { ...item, have: !item.have };
          onChangeItems(next);
        }}
        hitSlop={8}
      >
        <Checkbox checked={item.have} />
      </Pressable>
      <Pressable
        accessibilityLabel="Remove item"
        onPress={() => onChangeItems(items.filter((_, i) => i !== index))}
        hitSlop={8}
      >
        <Text style={{ color: theme.colors.error, fontSize: theme.typography.bodySmall.size }}>
          ✕
        </Text>
      </Pressable>
    </GroupRow>
  );

  return (
    <View style={styles.groupStack}>
      {needIt.length > 0 && (
        <View>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Need it</Text>
          <OptionGroup>
            {needIt.map((entry, i) => renderRow(entry, i === needIt.length - 1))}
          </OptionGroup>
        </View>
      )}
      {haveIt.length > 0 && (
        <View>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Have it</Text>
          <OptionGroup>
            {haveIt.map((entry, i) => renderRow(entry, i === haveIt.length - 1))}
          </OptionGroup>
        </View>
      )}
      <OptionGroup>
        <ActionRow label="+ Add item" onPress={() => onChangeItems([...items, { name: '', have: false }])} isLast />
      </OptionGroup>
    </View>
  );
}

function MultiSelectEditor({
  options,
  selected,
  onToggle,
  showDueBy,
  dueByDraft,
  onChangeDueBy,
}: {
  options: MultiSelectOption[];
  selected: MultiSelectOption[];
  onToggle: (option: MultiSelectOption) => void;
  showDueBy: boolean;
  dueByDraft: string;
  onChangeDueBy: (text: string) => void;
}): ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.groupStack}>
      <OptionGroup>
        {options.map((option, index) => (
          <CheckRow
            key={option}
            label={option}
            checked={selected.includes(option)}
            onToggle={() => onToggle(option)}
            isLast={index === options.length - 1}
          />
        ))}
      </OptionGroup>

      {showDueBy && (
        <OptionGroup>
          <GroupRow isLast>
            <TextInput
              value={dueByDraft}
              onChangeText={onChangeDueBy}
              placeholder="Due by — optional (e.g. 2026-10-31)"
              placeholderTextColor={theme.colors.textTertiary}
              style={[
                styles.dueByInput,
                { color: theme.colors.text, borderColor: theme.colors.border },
              ]}
            />
          </GroupRow>
        </OptionGroup>
      )}
    </View>
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
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  supplyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dueByInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
