import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionRow, CheckRow, GroupRow, OptionGroup, OptionRow } from './OptionGroup';
import type {
  ConstraintStatus,
  ConstraintValue,
  Season,
  SupplyItem,
  TimeOfDay,
  WeatherCondition,
  WeatherSeasonConstraintValue,
} from '../domain/constraint';
import type { InterestType } from '../domain/interest';
import {
  SEASONS,
  TIMES_OF_DAY,
  WEATHER_CONDITIONS,
  enrichmentQuestions,
  type EnrichmentAxis,
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
  /** WeatherSeason only — the Interest's current due date, offered as a follow-up on the Season/TimeOfDay branches. */
  dueBy?: string | null;
  onDueByChange?: (dueBy: string | null) => void;
}

type WeatherKind = 'Weather' | 'TimeOfDay' | 'Season';

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
  const initialWeather =
    question.variant === 'weather' && answer?.status === 'Set'
      ? (answer.value as WeatherSeasonConstraintValue)
      : null;
  const initialDueBy = dueBy ?? '';

  const [items, setItems] = useState<SupplyItem[]>(initialItems);
  const [weatherKind, setWeatherKind] = useState<WeatherKind | null>(initialWeather?.kind ?? null);
  const [weatherConditions, setWeatherConditions] = useState<WeatherCondition[]>(
    initialWeather?.kind === 'Weather' ? initialWeather.conditions : [],
  );
  const [weatherTimes, setWeatherTimes] = useState<TimeOfDay[]>(
    initialWeather?.kind === 'TimeOfDay' ? initialWeather.times : [],
  );
  const [weatherSeasons, setWeatherSeasons] = useState<Season[]>(
    initialWeather?.kind === 'Season' ? initialWeather.seasons : [],
  );
  const [dueByDraft, setDueByDraft] = useState<string>(initialDueBy);

  // Every exit from this card (Back/Forward, Close, Home, hardware back, or the
  // screen navigating away out from under it) unmounts this component, so an
  // unmount-time flush is the one choke point that reliably covers all of them —
  // draft-holding axes (Supplies/Weather) would otherwise silently lose unsaved
  // edits on any exit path that isn't the explicit Back/Forward handlers.
  const itemsRef = useRef(items);
  const weatherKindRef = useRef(weatherKind);
  const weatherConditionsRef = useRef(weatherConditions);
  const weatherTimesRef = useRef(weatherTimes);
  const weatherSeasonsRef = useRef(weatherSeasons);
  const dueByDraftRef = useRef(dueByDraft);
  const onAnswerRef = useRef(onAnswer);
  const onDueByChangeRef = useRef(onDueByChange);

  useEffect(() => {
    itemsRef.current = items;
    weatherKindRef.current = weatherKind;
    weatherConditionsRef.current = weatherConditions;
    weatherTimesRef.current = weatherTimes;
    weatherSeasonsRef.current = weatherSeasons;
    dueByDraftRef.current = dueByDraft;
    onAnswerRef.current = onAnswer;
    onDueByChangeRef.current = onDueByChange;
  });

  const buildWeatherValue = (
    kind: WeatherKind | null,
    conditions: WeatherCondition[],
    times: TimeOfDay[],
    seasons: Season[],
  ): WeatherSeasonConstraintValue | null => {
    if (kind === 'Weather' && conditions.length > 0) {
      return { kind: 'Weather', conditions };
    }
    if (kind === 'TimeOfDay' && times.length > 0) {
      return { kind: 'TimeOfDay', times };
    }
    if (kind === 'Season' && seasons.length > 0) {
      return { kind: 'Season', seasons };
    }
    return null;
  };

  useEffect(() => {
    return () => {
      if (question.variant === 'supplies') {
        const validItems = itemsRef.current.filter((item) => item.name.trim() !== '');
        if (validItems.length > 0) {
          onAnswerRef.current({ status: 'Set', value: validItems });
        }
      } else if (question.variant === 'weather') {
        const value = buildWeatherValue(
          weatherKindRef.current,
          weatherConditionsRef.current,
          weatherTimesRef.current,
          weatherSeasonsRef.current,
        );
        if (value) {
          onAnswerRef.current({ status: 'Set', value });
        }
        if (onDueByChangeRef.current && dueByDraftRef.current !== initialDueBy) {
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
      : question.variant === 'weather'
        ? buildWeatherValue(weatherKind, weatherConditions, weatherTimes, weatherSeasons) !== null ||
          answer?.status === 'None'
        : answer !== null && answer.status !== 'Unknown';

  const handleClear = () => {
    onAnswer({ status: 'Unknown' });
    setItems([]);
    setWeatherKind(null);
    setWeatherConditions([]);
    setWeatherTimes([]);
    setWeatherSeasons([]);
  };

  const flushDraft = () => {
    if (question.variant === 'supplies') {
      const validItems = items.filter((item) => item.name.trim() !== '');
      if (validItems.length > 0) {
        onAnswer({ status: 'Set', value: validItems });
      }
    } else if (question.variant === 'weather') {
      const value = buildWeatherValue(weatherKind, weatherConditions, weatherTimes, weatherSeasons);
      if (value) {
        onAnswer({ status: 'Set', value });
      }
      if (onDueByChange && dueByDraft !== initialDueBy) {
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

  const showDueByField =
    question.variant === 'weather' && (weatherKind === 'Season' || weatherKind === 'TimeOfDay');

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
          <WeatherSeasonEditor
            kind={weatherKind}
            conditions={weatherConditions}
            times={weatherTimes}
            seasons={weatherSeasons}
            onSelectKind={(kind) => setWeatherKind(kind)}
            onToggleCondition={(condition) =>
              setWeatherConditions((prev) =>
                prev.includes(condition)
                  ? prev.filter((c) => c !== condition)
                  : [...prev, condition],
              )
            }
            onToggleTime={(time) =>
              setWeatherTimes((prev) =>
                prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
              )
            }
            onToggleSeason={(season) =>
              setWeatherSeasons((prev) =>
                prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season],
              )
            }
            showDueBy={showDueByField}
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
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
      }}
    >
      <Pressable onPress={onPress} style={styles.textButton}>
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
        style={[
          styles.supplyCheckbox,
          {
            borderColor: item.have ? theme.colors.primary : theme.colors.border,
            backgroundColor: item.have ? theme.colors.primary : 'transparent',
          },
        ]}
      >
        {item.have && <Text style={{ color: theme.colors.textOnPrimary, fontSize: 13 }}>✓</Text>}
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

function WeatherSeasonEditor({
  kind,
  conditions,
  times,
  seasons,
  onSelectKind,
  onToggleCondition,
  onToggleTime,
  onToggleSeason,
  showDueBy,
  dueByDraft,
  onChangeDueBy,
}: {
  kind: WeatherKind | null;
  conditions: WeatherCondition[];
  times: TimeOfDay[];
  seasons: Season[];
  onSelectKind: (kind: WeatherKind) => void;
  onToggleCondition: (condition: WeatherCondition) => void;
  onToggleTime: (time: TimeOfDay) => void;
  onToggleSeason: (season: Season) => void;
  showDueBy: boolean;
  dueByDraft: string;
  onChangeDueBy: (text: string) => void;
}): ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.groupStack}>
      <OptionGroup>
        <OptionRow label="Weather" selected={kind === 'Weather'} onPress={() => onSelectKind('Weather')} />
        <OptionRow
          label="Time of day"
          selected={kind === 'TimeOfDay'}
          onPress={() => onSelectKind('TimeOfDay')}
        />
        <OptionRow label="Season" selected={kind === 'Season'} onPress={() => onSelectKind('Season')} isLast />
      </OptionGroup>

      {kind === 'Weather' && (
        <OptionGroup>
          {WEATHER_CONDITIONS.map((condition, index) => (
            <CheckRow
              key={condition}
              label={condition}
              checked={conditions.includes(condition)}
              onToggle={() => onToggleCondition(condition)}
              isLast={index === WEATHER_CONDITIONS.length - 1}
            />
          ))}
        </OptionGroup>
      )}

      {kind === 'TimeOfDay' && (
        <OptionGroup>
          {TIMES_OF_DAY.map((time, index) => (
            <CheckRow
              key={time}
              label={time}
              checked={times.includes(time)}
              onToggle={() => onToggleTime(time)}
              isLast={index === TIMES_OF_DAY.length - 1}
            />
          ))}
        </OptionGroup>
      )}

      {kind === 'Season' && (
        <OptionGroup>
          {SEASONS.map((season, index) => (
            <CheckRow
              key={season}
              label={season}
              checked={seasons.includes(season)}
              onToggle={() => onToggleSeason(season)}
              isLast={index === SEASONS.length - 1}
            />
          ))}
        </OptionGroup>
      )}

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
  supplyCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
