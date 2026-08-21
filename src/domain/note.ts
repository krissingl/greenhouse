import type { InterestId } from './interest';

export type NoteId = string;

export interface Note {
  id: NoteId;
  interestId: InterestId;
  title?: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NewNote = {
  interestId: InterestId;
  body: string;
} & Partial<Pick<Note, 'title' | 'pinned'>>;

export function validateNoteBody(body: string): boolean {
  return body.trim().length > 0;
}

export function assertValidNoteBody(body: string): void {
  if (!validateNoteBody(body)) {
    throw new Error('Note body must not be empty or whitespace-only.');
  }
}
