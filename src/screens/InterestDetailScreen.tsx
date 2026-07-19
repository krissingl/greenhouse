import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState, type ReactElement } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Interest } from '../domain/interest';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { interestService } from '../services/InterestService';
import { useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InterestDetail'>;

export default function InterestDetailScreen({ route, navigation }: Props): ReactElement {
  const theme = useTheme();
  const { interestId } = route.params;
  const [interest, setInterest] = useState<Interest | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      interestService.get(interestId).then((result) => {
        if (!cancelled) {
          setInterest(result);
        }
      });

      return () => {
        cancelled = true;
      };
    }, [interestId]),
  );

  if (interest === undefined) {
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

  const isArchived = interest.archivedAt !== null;

  const handleArchiveToggle = async () => {
    if (isArchived) {
      const updated = await interestService.unarchive(interestId);
      setInterest(updated);
    } else {
      await interestService.archive(interestId);
      navigation.navigate('InterestList');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete this interest?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await interestService.delete(interestId);
          navigation.navigate('InterestList');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={{ color: theme.colors.text, fontSize: theme.typography.h2.size }}>
        {interest.title}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>
        State: {interest.state}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}>
        Type: {interest.type ?? 'not set'}
      </Text>
      <Text style={{ color: theme.colors.textTertiary, marginTop: theme.spacing.sm }}>
        Created: {interest.createdAt}
      </Text>
      <Text style={{ color: theme.colors.textTertiary }}>Updated: {interest.updatedAt}</Text>

      <Pressable
        onPress={() => navigation.navigate('EditInterest', { interestId })}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={{ color: theme.colors.textOnPrimary }}>Edit</Text>
      </Pressable>

      <Pressable
        onPress={handleArchiveToggle}
        style={[styles.button, { backgroundColor: theme.colors.secondary }]}
      >
        <Text style={{ color: theme.colors.textOnPrimary }}>
          {isArchived ? 'Unarchive' : 'Archive'}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleDelete}
        style={[styles.button, { backgroundColor: theme.colors.error }]}
      >
        <Text style={{ color: theme.colors.textOnPrimary }}>Delete</Text>
      </Pressable>
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
});
