import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { validateTitle, type InterestState } from '../domain/interest';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { interestService } from '../services/InterestService';
import { useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditInterest'>;

const STATES: InterestState[] = ['Backlog', 'InProgress', 'Complete'];

export default function EditInterestScreen({ route, navigation }: Props): ReactElement {
  const theme = useTheme();
  const { interestId } = route.params;
  const [title, setTitle] = useState('');
  const [state, setState] = useState<InterestState>('Backlog');
  const [touched, setTouched] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    interestService
      .get(interestId)
      .then((interest) => {
        if (!cancelled && interest) {
          setTitle(interest.title);
          setState(interest.state);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Could not load this interest. Please try again.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [interestId]);

  const showError = touched && !validateTitle(title);

  const handleSave = async () => {
    setTouched(true);

    if (!validateTitle(title)) {
      return;
    }

    try {
      setSaveError(null);
      await interestService.update(interestId, { title });
      await interestService.setState(interestId, state);
      navigation.goBack();
    } catch {
      setSaveError('Could not save this interest. Please try again.');
    }
  };

  if (loadError) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error, fontSize: theme.typography.body.size }}>
          {loadError}
        </Text>
      </View>
    );
  }

  if (!loaded) {
    return <View style={[styles.container, { backgroundColor: theme.colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        onBlur={() => setTouched(true)}
        style={[
          styles.input,
          {
            color: theme.colors.text,
            borderColor: showError ? theme.colors.error : theme.colors.border,
            fontSize: theme.typography.title.size,
          },
        ]}
      />
      {showError && (
        <Text style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>
          Title can&apos;t be empty.
        </Text>
      )}

      <View style={styles.stateRow}>
        {STATES.map((option) => (
          <Pressable
            key={option}
            onPress={() => setState(option)}
            style={[
              styles.stateOption,
              {
                backgroundColor:
                  state === option ? theme.colors.primary : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Text style={{ color: state === option ? theme.colors.textOnPrimary : theme.colors.text }}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      {saveError && (
        <Text style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>{saveError}</Text>
      )}

      <Pressable
        onPress={handleSave}
        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={{ color: theme.colors.textOnPrimary, fontSize: theme.typography.body.size }}>
          Save
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  stateRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 8,
  },
  stateOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveButton: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
});
