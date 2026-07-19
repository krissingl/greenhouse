import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState, type ReactElement } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import InterestListItem from '../components/InterestListItem';
import type { Interest } from '../domain/interest';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { interestService } from '../services/InterestService';
import { useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestList'>;

export default function InterestListScreen({ navigation }: Props): ReactElement {
  const theme = useTheme();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      interestService.list({ includeArchived: showArchived }).then((results) => {
        if (!cancelled) {
          setInterests(results);
        }
      });

      return () => {
        cancelled = true;
      };
    }, [showArchived]),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Pressable onPress={() => setShowArchived((current) => !current)} style={styles.filterToggle}>
        <Text style={{ color: theme.colors.primary, fontSize: theme.typography.bodySmall.size }}>
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Text>
      </Pressable>
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
  emptyContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-end',
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
