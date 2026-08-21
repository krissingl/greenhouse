import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState, type ReactElement } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Note, NoteId } from '../domain/note';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { noteService } from '../services/NoteService';
import { useTheme } from '../theme';
import { formatDisplayDate } from '../utils/formatDisplayDate';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteJournal'>;

export default function NoteJournalScreen({ route }: Props): ReactElement {
  const theme = useTheme();
  const { interestId } = route.params;
  const [notes, setNotes] = useState<Note[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [editingId, setEditingId] = useState<NoteId | null>(null);

  const load = useCallback(() => {
    let cancelled = false;

    noteService
      .listForInterest(interestId)
      .then((result) => {
        if (!cancelled) {
          setNotes(result);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Could not load the journal. Please try again.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [interestId]);

  useFocusEffect(
    useCallback(() => {
      return load();
    }, [load]),
  );

  const resetDraft = () => {
    setDraftTitle('');
    setDraftBody('');
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (draftBody.trim().length === 0) {
      return;
    }
    try {
      setActionError(null);
      await noteService.add(interestId, {
        title: draftTitle.trim().length > 0 ? draftTitle.trim() : undefined,
        body: draftBody,
      });
      resetDraft();
      load();
    } catch {
      setActionError('Could not save this note. Please try again.');
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setDraftTitle(note.title ?? '');
    setDraftBody(note.body);
  };

  const handleSaveEdit = async () => {
    if (!editingId || draftBody.trim().length === 0) {
      return;
    }
    try {
      setActionError(null);
      await noteService.update(editingId, {
        title: draftTitle.trim().length > 0 ? draftTitle.trim() : undefined,
        body: draftBody,
      });
      resetDraft();
      load();
    } catch {
      setActionError('Could not save this note. Please try again.');
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      setActionError(null);
      await noteService.update(note.id, { pinned: !note.pinned });
      load();
    } catch {
      setActionError('Could not update this note. Please try again.');
    }
  };

  const handleDelete = async (note: Note) => {
    try {
      setActionError(null);
      await noteService.remove(note.id);
      load();
    } catch {
      setActionError('Could not delete this note. Please try again.');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {loadError && (
        <Text style={{ color: theme.colors.error, marginBottom: theme.spacing.sm }}>
          {loadError}
        </Text>
      )}
      {actionError && (
        <Text style={{ color: theme.colors.error, marginBottom: theme.spacing.sm }}>
          {actionError}
        </Text>
      )}

      <View style={[styles.form, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TextInput
          value={draftTitle}
          onChangeText={setDraftTitle}
          placeholder="Title (optional)"
          placeholderTextColor={theme.colors.textTertiary}
          style={[styles.titleInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
        />
        <TextInput
          value={draftBody}
          onChangeText={setDraftBody}
          placeholder="Write something you want to remember about this interest…"
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          style={[styles.bodyInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
        />
        <View style={styles.formRow}>
          {editingId && (
            <Pressable onPress={resetDraft} style={styles.cancelButton}>
              <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
            </Pressable>
          )}
          <Pressable
            onPress={editingId ? handleSaveEdit : handleAdd}
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={{ color: theme.colors.textOnPrimary }}>
              {editingId ? 'Save note' : '+ Add note'}
            </Text>
          </Pressable>
        </View>
      </View>

      {notes === undefined && <View />}
      {notes !== undefined && notes.length === 0 && (
        <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.md }}>
          No notes yet — this is your space to jot down anything about this interest.
        </Text>
      )}

      {notes?.map((note) => (
        <View
          key={note.id}
          style={[styles.noteCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <View style={styles.noteHeaderRow}>
            {note.title && (
              <Text style={[styles.noteTitle, { color: theme.colors.text, flex: 1 }]}>{note.title}</Text>
            )}
            {!note.title && <View style={{ flex: 1 }} />}
            <Pressable
              accessibilityLabel={note.pinned ? 'Unpin note' : 'Pin note'}
              onPress={() => handleTogglePin(note)}
              hitSlop={8}
            >
              <Text style={{ color: note.pinned ? theme.colors.secondary : theme.colors.textTertiary }}>
                📌
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Edit note"
              onPress={() => handleStartEdit(note)}
              hitSlop={8}
              style={styles.noteIconSpacing}
            >
              <Text style={{ color: theme.colors.primary }}>✎</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Delete note"
              onPress={() => handleDelete(note)}
              hitSlop={8}
              style={styles.noteIconSpacing}
            >
              <Text style={{ color: theme.colors.error }}>✕</Text>
            </Pressable>
          </View>
          <Text style={{ color: theme.colors.text, marginTop: theme.spacing.xs }}>{note.body}</Text>
          <Text
            style={{ color: theme.colors.textTertiary, fontSize: theme.typography.caption.size, marginTop: theme.spacing.xs }}
          >
            {formatDisplayDate(note.createdAt)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  form: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  titleInput: {
    borderBottomWidth: 1,
    paddingVertical: 6,
    marginBottom: 8,
  },
  bodyInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteTitle: {
    fontWeight: '600',
  },
  noteIconSpacing: {
    marginLeft: 12,
  },
});
