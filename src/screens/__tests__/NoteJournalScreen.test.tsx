import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { Note } from '../../domain/note';
import { noteService } from '../../services/NoteService';
import { ThemeProvider } from '../../theme';
import NoteJournalScreen from '../NoteJournalScreen';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    interestId: 'interest-1',
    title: undefined,
    body: 'rented a violin from the shop on 5th',
    pinned: false,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

async function renderScreen(): Promise<ReturnType<typeof render>> {
  const props = {
    navigation: { navigate: jest.fn() },
    route: { key: 'NoteJournal', name: 'NoteJournal', params: { interestId: 'interest-1' } },
  } as unknown as Parameters<typeof NoteJournalScreen>[0];

  return render(
    (
      <ThemeProvider>
        <NavigationContainer>
          <NoteJournalScreen {...props} />
        </NavigationContainer>
      </ThemeProvider>
    ) as ReactElement,
  );
}

describe('NoteJournalScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows an empty-state message when there are no notes', async () => {
    jest.spyOn(noteService, 'listForInterest').mockResolvedValueOnce([]);

    const { findByText } = await renderScreen();

    expect(
      await findByText('No notes yet — this is your space to jot down anything about this interest.'),
    ).toBeTruthy();
  });

  it('renders pinned-first, newest-first ordering as returned by the service', async () => {
    jest
      .spyOn(noteService, 'listForInterest')
      .mockResolvedValueOnce([
        makeNote({ id: 'note-pinned', body: 'pinned note', pinned: true }),
        makeNote({ id: 'note-recent', body: 'recent note' }),
      ]);

    const { findByText } = await renderScreen();

    expect(await findByText('pinned note')).toBeTruthy();
    expect(await findByText('recent note')).toBeTruthy();
  });

  it('adds a note via the form and refreshes the list', async () => {
    jest.spyOn(noteService, 'listForInterest').mockResolvedValue([]);
    const addSpy = jest.spyOn(noteService, 'add').mockResolvedValue(makeNote());

    const { getByPlaceholderText, getByText } = await renderScreen();

    await act(async () => {
      fireEvent.changeText(
        getByPlaceholderText('Write something you want to remember about this interest…'),
        'rented a violin from the shop on 5th',
      );
    });
    await act(async () => {
      fireEvent.press(getByText('+ Add note'));
    });

    expect(addSpy).toHaveBeenCalledWith('interest-1', {
      title: undefined,
      body: 'rented a violin from the shop on 5th',
    });
  });

  it('does not add a note with a blank body', async () => {
    jest.spyOn(noteService, 'listForInterest').mockResolvedValue([]);
    const addSpy = jest.spyOn(noteService, 'add');

    const { getByText } = await renderScreen();

    await act(async () => {
      fireEvent.press(getByText('+ Add note'));
    });

    expect(addSpy).not.toHaveBeenCalled();
  });

  it('toggles pin state via the pin control', async () => {
    jest
      .spyOn(noteService, 'listForInterest')
      .mockResolvedValue([makeNote({ id: 'note-1', pinned: false })]);
    const updateSpy = jest.spyOn(noteService, 'update').mockResolvedValue(makeNote({ pinned: true }));

    const { findByLabelText } = await renderScreen();

    await act(async () => {
      fireEvent.press(await findByLabelText('Pin note'));
    });

    expect(updateSpy).toHaveBeenCalledWith('note-1', { pinned: true });
  });

  it('deletes a note via the delete control', async () => {
    jest.spyOn(noteService, 'listForInterest').mockResolvedValue([makeNote({ id: 'note-1' })]);
    const removeSpy = jest.spyOn(noteService, 'remove').mockResolvedValue(undefined);

    const { findByLabelText } = await renderScreen();

    await act(async () => {
      fireEvent.press(await findByLabelText('Delete note'));
    });

    expect(removeSpy).toHaveBeenCalledWith('note-1');
  });

  it('shows inline feedback when loading fails', async () => {
    jest.spyOn(noteService, 'listForInterest').mockRejectedValueOnce(new Error('boom'));

    const { findByText } = await renderScreen();

    expect(await findByText('Could not load the journal. Please try again.')).toBeTruthy();
  });
});
