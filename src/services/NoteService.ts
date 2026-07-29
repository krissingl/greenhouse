import { assertValidNoteBody } from '../domain/note';
import type { Note, NoteId } from '../domain/note';
import type { InterestId } from '../domain/interest';
import { NoteRepository } from '../repositories/NoteRepository';

export class NoteService {
  constructor(private readonly repository: NoteRepository = new NoteRepository()) {}

  async listForInterest(interestId: InterestId): Promise<Note[]> {
    return this.repository.findForInterest(interestId);
  }

  async add(interestId: InterestId, input: { title?: string; body: string }): Promise<Note> {
    assertValidNoteBody(input.body);
    return this.repository.insert({ interestId, title: input.title, body: input.body });
  }

  async update(noteId: NoteId, patch: Partial<Pick<Note, 'title' | 'body' | 'pinned'>>): Promise<Note> {
    if (patch.body !== undefined) {
      assertValidNoteBody(patch.body);
    }
    return this.repository.update(noteId, patch);
  }

  async remove(noteId: NoteId): Promise<void> {
    return this.repository.remove(noteId);
  }
}

export const noteService = new NoteService();
