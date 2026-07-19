import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { validateTitle } from '../domain/interest';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { interestService } from '../services/InterestService';
import { useTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateInterest'>;

export default function CreateInterestScreen({ navigation }: Props): ReactElement {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [touched, setTouched] = useState(false);

  const isValid = validateTitle(title);
  const showError = touched && !isValid;

  const handleSave = async () => {
    setTouched(true);

    if (!validateTitle(title)) {
      return;
    }

    await interestService.create({ title });
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        onBlur={() => setTouched(true)}
        placeholder="What do you want in your life?"
        placeholderTextColor={theme.colors.textTertiary}
        autoFocus
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
  saveButton: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
});
