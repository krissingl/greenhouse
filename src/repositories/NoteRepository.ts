import * as Crypto from 'expo-crypto';

import type { InterestId } from '../domain/interest';
import type { NewNote, Note, NoteId } from '../domain/note';
import { BaseRepository } from './BaseRepository';

interface NoteRow {
  id: string;
  interest_id: string;
  title: string | null;
  body: string;
  pinned: number;
  created_at: string;
  updated_at: string;
}

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    interestId: row.interest_id,
    title: row.title ?? undefined,
    body: row.body,
    pinned: row.pinned === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class NoteRepository extends BaseRepository {
  async findForInterest(interestId: InterestId): Promise<Note[]> {
    return this.withConnection((db) => {
      const rows = db.getAllSync<NoteRow>(
        `SELECT * FROM notes WHERE interest_id = ? ORDER BY pinned DESC, created_at DESC, rowid DESC;`,
        [interestId],
      );
      return rows.map(rowToNote);
    });
  }

  async insert(newNote: NewNote): Promise<Note> {
    return this.withConnection((db) => {
      const now = new Date().toISOString();
      const id = Crypto.randomUUID();
      const title = newNote.title ?? null;
      const pinned = newNote.pinned ?? false;

      db.runSync(
        `INSERT INTO notes (id, interest_id, title, body, pinned, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [id, newNote.interestId, title, newNote.body, pinned ? 1 : 0, now, now],
      );

      return {
        id,
        interestId: newNote.interestId,
        title: title ?? undefined,
        body: newNote.body,
        pinned,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  async update(id: NoteId, patch: Partial<Pick<Note, 'title' | 'body' | 'pinned'>>): Promise<Note> {
    return this.withConnection((db) => {
      const existingRow = db.getFirstSync<NoteRow>('SELECT * FROM notes WHERE id = ?;', [id]);

      if (!existingRow) {
        throw new Error(`Note not found: ${id}`);
      }

      const existing = rowToNote(existingRow);
      const updated: Note = {
        ...existing,
        ...patch,
        id: existing.id,
        updatedAt: new Date().toISOString(),
      };

      db.runSync(
        `UPDATE notes
         SET title = ?, body = ?, pinned = ?, updated_at = ?
         WHERE id = ?;`,
        [updated.title ?? null, updated.body, updated.pinned ? 1 : 0, updated.updatedAt, updated.id],
      );

      return updated;
    });
  }

  async remove(id: NoteId): Promise<void> {
    return this.withConnection((db) => {
      db.runSync('DELETE FROM notes WHERE id = ?;', [id]);
    });
  }
}
