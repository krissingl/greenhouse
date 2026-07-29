import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import InterestListItem from '../components/InterestListItem';
import type { ConstraintDimension } from '../domain/constraint';
import {
  displayLabel,
  type Interest,
  type InterestFilter,
  type InterestId,
  type InterestState,
  type InterestType,
} from '../domain/interest';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { COVERED_AXES, type EnrichmentAxis } from './enrichmentQuestions';
import { constraintService } from '../services/ConstraintService';
import { interestService } from '../services/InterestService';
import { useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestList'>;

const COVERED_DIMENSIONS: ConstraintDimension[] = COVERED_AXES.filter(
  (axis): axis is Exclude<EnrichmentAxis, 'Type'> => axis !== 'Type',
);

type StateFilterOption = 'Backlog' | 'InProgress' | 'Complete' | 'All' | 'Archived';

const STATE_FILTER_OPTIONS: StateFilterOption[] = [
  'All',
  'Backlog',
  'InProgress',
  'Complete',
  'Archived',
];

function stateFilterLabel(option: StateFilterOption): string {
  if (option === 'All' || option === 'Archived') {
    return option;
  }
  return displayLabel(option as InterestState);
}

type TypeFilterOption = 'All' | InterestType;

const TYPE_FILTER_OPTIONS: TypeFilterOption[] = [
  'All',
  'OneTimeProject',
  'StructuredLearning',
  'UnstructuredLearning',
];

function typeFilterLabel(option: TypeFilterOption): string {
  return option === 'All' ? option : displayLabel(option);
}

const TYPE_SECTION_ORDER: InterestType[] = [
  'OneTimeProject',
  'StructuredLearning',
  'UnstructuredLearning',
];

const NO_TYPE_SECTION_TITLE = 'Unplanted';

interface InterestSection {
  title: string;
  data: Interest[];
}

function groupByType(interests: Interest[]): InterestSection[] {
  const sections: InterestSection[] = [];

  for (const type of TYPE_SECTION_ORDER) {
    const data = interests.filter((interest) => interest.type === type);
    if (data.length > 0) {
      sections.push({ title: displayLabel(type), data });
    }
  }

  const untyped = interests.filter((interest) => interest.type === null);
  if (untyped.length > 0) {
    sections.push({ title: NO_TYPE_SECTION_TITLE, data: untyped });
  }

  return sections;
}

const SEARCH_DEBOUNCE_MS = 300;

function buildFilter(
  stateFilter: StateFilterOption,
  typeFilter: TypeFilterOption,
  debouncedQuery: string,
): InterestFilter {
  const filter: InterestFilter = {};

  if (debouncedQuery.trim().length > 0) {
    filter.query = debouncedQuery.trim();
  }

  if (stateFilter === 'Archived') {
    filter.archivedOnly = true;
  } else if (stateFilter !== 'All') {
    filter.state = stateFilter;
  }

  if (typeFilter !== 'All') {
    filter.type = typeFilter;
  }

  return filter;
}

export default function InterestListScreen({ navigation }: Props): ReactElement {
  const theme = useTheme();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilterOption>('InProgress');
  const [typeFilter, setTypeFilter] = useState<TypeFilterOption>('All');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [needsEnrichmentIds, setNeedsEnrichmentIds] = useState<Set<InterestId>>(new Set());
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      interestService
        .list(buildFilter(stateFilter, typeFilter, debouncedQuery))
        .then(async (results) => {
          if (cancelled) {
            return;
          }
          setInterests(results);
          setLoadError(null);

          const typeUnanswered = results
            .filter((interest) => interest.type === null && interest.typeSkippedAt === null)
            .map((interest) => interest.id);

          try {
            const dimensionUnanswered = await constraintService.needsEnrichment(
              results.map((interest) => interest.id),
              COVERED_DIMENSIONS,
            );
            if (!cancelled) {
              setNeedsEnrichmentIds(new Set([...typeUnanswered, ...dimensionUnanswered]));
            }
          } catch {
            if (!cancelled) {
              setNeedsEnrichmentIds(new Set());
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoadError('Could not load interests. Please try again.');
          }
        });

      return () => {
        cancelled = true;
      };
    }, [stateFilter, typeFilter, debouncedQuery]),
  );

  const handleBannerPress = () => {
    const targetId = interests.find((interest) => needsEnrichmentIds.has(interest.id))?.id;
    if (targetId) {
      navigation.navigate('InterestDetail', { interestId: targetId });
    }
  };

  const handleStart = async (id: InterestId) => {
    try {
      setActionError(null);
      const updated = await interestService.setState(id, 'InProgress');
      setInterests((prev) => prev.map((interest) => (interest.id === id ? updated : interest)));
      // Switching the filter to In progress (rather than leaving it as-is) keeps
      // the just-started interest in view alongside other active work, instead
      // of it vanishing because it no longer matches whatever filter was active.
      setStateFilter('InProgress');
    } catch {
      setActionError('Could not start this interest. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TextInput
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder="Search interests"
        placeholderTextColor={theme.colors.textTertiary}
        style={[styles.searchInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
      />
      <Pressable
        onPress={() => setFiltersExpanded((prev) => !prev)}
        style={[styles.filterSummaryBar, { borderColor: theme.colors.border }]}
      >
        <Text style={{ color: theme.colors.text, fontSize: theme.typography.bodySmall.size }}>
          {stateFilterLabel(stateFilter)} · {typeFilterLabel(typeFilter)}
        </Text>
        <Text style={{ color: theme.colors.textSecondary }}>{filtersExpanded ? '▾' : '▸'}</Text>
      </Pressable>
      {filtersExpanded && (
        <>
          <View style={styles.filterRow}>
            {STATE_FILTER_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setStateFilter(option)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      stateFilter === option ? theme.colors.primary : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <Text
                  style={{
                    color: stateFilter === option ? theme.colors.textOnPrimary : theme.colors.text,
                    fontSize: theme.typography.caption.size,
                  }}
                >
                  {stateFilterLabel(option)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.filterRow}>
            {TYPE_FILTER_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setTypeFilter(option)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      typeFilter === option ? theme.colors.primary : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <Text
                  style={{
                    color: typeFilter === option ? theme.colors.textOnPrimary : theme.colors.text,
                    fontSize: theme.typography.caption.size,
                  }}
                >
                  {typeFilterLabel(option)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      {loadError && (
        <Text
          style={{
            color: theme.colors.error,
            fontSize: theme.typography.caption.size,
            marginHorizontal: 16,
            marginTop: 8,
          }}
        >
          {loadError}
        </Text>
      )}
      {actionError && (
        <Text
          style={{
            color: theme.colors.error,
            fontSize: theme.typography.caption.size,
            marginHorizontal: 16,
            marginTop: 8,
          }}
        >
          {actionError}
        </Text>
      )}
      {!bannerDismissed && needsEnrichmentIds.size > 0 && (
        <View style={[styles.banner, { backgroundColor: theme.colors.primaryContainer }]}>
          <Pressable style={styles.bannerText} onPress={handleBannerPress}>
            <Text style={{ color: theme.colors.text }}>
              Got a minute? {needsEnrichmentIds.size} seeds could tell me more
            </Text>
          </Pressable>
          <Pressable accessibilityLabel="Dismiss" onPress={() => setBannerDismissed(true)}>
            <Text style={{ color: theme.colors.textSecondary }}>✕</Text>
          </Pressable>
        </View>
      )}
      <SectionList
        sections={groupByType(interests)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={interests.length === 0 ? styles.emptyContent : undefined}
        renderItem={({ item }) => (
          <InterestListItem
            interest={item}
            onPress={() => navigation.navigate('InterestDetail', { interestId: item.id })}
            onStart={() => handleStart(item.id)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.caption.size,
                fontWeight: theme.typography.caption.weight,
              }}
            >
              {section.title.toUpperCase()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.body.size,
              textAlign: 'center',
            }}
          >
            No interests yet
          </Text>
        }
      />
      <Pressable
        accessibilityLabel="Add interest"
        onPress={() => navigation.navigate('CreateInterest')}
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={{ color: theme.colors.textOnPrimary, fontSize: theme.typography.h2.size }}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bannerText: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  emptyContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
