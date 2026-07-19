import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import InterestListItem from '../components/InterestListItem';
import type { Interest, InterestFilter } from '../domain/interest';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { interestService } from '../services/InterestService';
import { useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestList'>;

type StateFilterOption = 'Backlog' | 'InProgress' | 'Complete' | 'All' | 'Archived';

const STATE_FILTER_OPTIONS: StateFilterOption[] = [
  'All',
  'Backlog',
  'InProgress',
  'Complete',
  'Archived',
];

const SEARCH_DEBOUNCE_MS = 300;

function buildFilter(stateFilter: StateFilterOption, debouncedQuery: string): InterestFilter {
  const filter: InterestFilter = {};

  if (debouncedQuery.trim().length > 0) {
    filter.query = debouncedQuery.trim();
  }

  if (stateFilter === 'Archived') {
    filter.includeArchived = true;
  } else if (stateFilter !== 'All') {
    filter.state = stateFilter;
  }

  return filter;
}

export default function InterestListScreen({ navigation }: Props): ReactElement {
  const theme = useTheme();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilterOption>('All');
  const [loadError, setLoadError] = useState<string | null>(null);

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
        .list(buildFilter(stateFilter, debouncedQuery))
        .then((results) => {
          if (!cancelled) {
            setInterests(results);
            setLoadError(null);
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
    }, [stateFilter, debouncedQuery]),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TextInput
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder="Search interests"
        placeholderTextColor={theme.colors.textTertiary}
        style={[
          styles.searchInput,
          { color: theme.colors.text, borderColor: theme.colors.border },
        ]}
      />
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
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
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
      <FlatList
        data={interests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={interests.length === 0 ? styles.emptyContent : undefined}
        renderItem={({ item }) => (
          <InterestListItem
            interest={item}
            onPress={() => navigation.navigate('InterestDetail', { interestId: item.id })}
          />
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
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
