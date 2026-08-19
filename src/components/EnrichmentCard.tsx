import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionRow, CheckRow, Checkbox, GroupRow, OptionGroup, OptionRow } from './OptionGroup';
import type { ConstraintStatus, ConstraintValue, SupplyItem } from '../domain/constraint';
import type { InterestType } from '../domain/interest';
import {
  enrichmentQuestions,
  type EnrichmentAxis,
  type MultiSelectOption,
  type QuestionConfig,
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
  dueBy?: string | null;
  onDueByChange?: (dueBy: string | null) => void;
}

type QuestionVariant = QuestionConfig['variant'];

// EnrichmentAnswer.value is a flat ConstraintValue | InterestType union because one EnrichmentCard
// instance serves every axis generically; only the sibling `question.variant` (itself derived from
// the axis prop) says which shape a given answer's value actually is. This guard centralizes that
// one correlated-but-untyped assumption once, instead of asserting it again at each read site (see
// below for why the 'multi' variant can't use the same approach).
function isSuppliesAnswerValue(
  variant: QuestionVariant,
  value: EnrichmentAnswer['value'],
): value is SupplyItem[] | undefined {
  return variant === 'supplies';
}

// Weather/Season/TimeOfDay each store a homogeneous array of their own option type
// (WeatherCondition[] | Season[] | TimeOfDay[] in ConstraintValue), but this component's local
// `selections`/multi-select answer state is generically typed MultiSelectOption[] — the *union*
// of all three option types — since one EnrichmentCard instance is reused for whichever of the
// three axes it currently renders. A mixed-element-type array is not structurally assignable to a
// union of homogeneous-element-type arrays (TypeScript can't rule out `selections` holding a
// mix), and there is no runtime check that would prove otherwise without inspecting every
// element — so unlike the guard above (which centralizes a real, checkable correlation), these
// two casts trust an invariant the type system cannot check: that enrichmentQuestions.ts never
// pairs a MultiSelectAxis's rendered options with another axis's option type.
function asMultiSelectAnswerValue(value: EnrichmentAnswer['value']): MultiSelectOption[] | undefined {
  return value as MultiSelectOption[] | undefined;
}

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
    question.variant === 'supplies' &&
    answer?.status === 'Set' &&
    isSuppliesAnswerValue(question.variant, answer.value)
      ? (answer.value ?? [])
      : [];
  const initialSelections =
    question.variant === 'multi' && answer?.status === 'Set'
      ? (asMultiSelectAnswerValue(answer.value) ?? [])
      : [];
  const initialDueBy = dueBy ?? '';

  const [items, setItems] = useState<SupplyItem[]>(initialItems);
  const [selections, setSelections] = useState<MultiSelectOption[]>(initialSelections);
  const [dueByDraft, setDueByDraft] = useState<string>(initialDueBy);

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

  // The single save path for this card's draft state (supply items / multi-select options / a
  // due-by date). Always reads from the refs above rather than the state variables directly, so
  // this same function is safe to call both from the unmount-cleanup effect below (which must
  // read whatever was last committed, however stale its own closure is) and from the explicit
  // Back/Forward handlers (where the refs are already in sync with the latest render by the time
  // a user can press a button). One implementation, two call sites — see the flagged decision on
  // ticket #22 for why an unmount flush exists at all.
  const flushDraft = () => {
    if (question.variant === 'supplies') {
      const validItems = itemsRef.current.filter((item) => item.name.trim() !== '');
      if (validItems.length > 0) {
        onAnswerRef.current({ status: 'Set', value: validItems });
      }
    } else if (question.variant === 'multi') {
      if (selectionsRef.current.length > 0) {
        onAnswerRef.current({ status: 'Set', value: asMultiSelectValue(selectionsRef.current) });
      }
      if (offersDueBy && onDueByChangeRef.current && dueByDraftRef.current !== initialDueBy) {
        onDueByChangeRef.current(
          dueByDraftRef.current.trim().length > 0 ? dueByDraftRef.current.trim() : null,
        );
      }
    }
  };

  useEffect(() => {
    return () => {
      flushDraft();
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
                description={option.description}
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
