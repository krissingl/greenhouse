import * as Crypto from 'expo-crypto';

import type {
  Interest,
  InterestFilter,
  InterestPatch,
  InterestState,
  InterestType,
  NewInterest,
} from '../domain/interest';
import { BaseRepository } from './BaseRepository';

interface InterestRow {
  id: string;
  title: string;
  type: string | null;
  state: string;
  archived_at: string | null;
  type_skipped_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToInterest(row: InterestRow): Interest {
  return {
    id: row.id,
    title: row.title,
    type: row.type as InterestType | null,
    state: row.state as InterestState,
    archivedAt: row.archived_at,
    typeSkippedAt: row.type_skipped_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class InterestRepository extends BaseRepository {
  async insert(newInterest: NewInterest): Promise<Interest> {
    return this.withConnection((db) => {
      const now = new Date().toISOString();
      const id = Crypto.randomUUID();
      const type = newInterest.type ?? null;

      db.runSync(
        `INSERT INTO interests (id, title, type, state, archived_at, type_skipped_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [id, newInterest.title, type, 'Backlog', null, null, now, now],
      );

      return {
        id,
        title: newInterest.title,
        type,
        state: 'Backlog',
        archivedAt: null,
        typeSkippedAt: null,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  async findById(id: string): Promise<Interest | null> {
    return this.withConnection((db) => {
      const row = db.getFirstSync<InterestRow>('SELECT * FROM interests WHERE id = ?;', [id]);
      return row ? rowToInterest(row) : null;
    });
  }

  async query(filter: InterestFilter = {}): Promise<Interest[]> {
    return this.withConnection((db) => {
      const conditions: string[] = [];
      const params: (string | number)[] = [];

      if (filter.state) {
        conditions.push('state = ?');
        params.push(filter.state);
      }

      if (filter.type) {
        conditions.push('type = ?');
        params.push(filter.type);
      }

      if (filter.query) {
        conditions.push('title LIKE ? COLLATE NOCASE');
        params.push(`%${filter.query}%`);
      }

      if (!filter.includeArchived) {
        conditions.push('archived_at IS NULL');
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = db.getAllSync<InterestRow>(
        `SELECT * FROM interests ${whereClause} ORDER BY created_at DESC;`,
        params,
      );

      return rows.map(rowToInterest);
    });
  }

  async update(id: string, patch: InterestPatch): Promise<Interest> {
    return this.withConnection((db) => {
      const existingRow = db.getFirstSync<InterestRow>('SELECT * FROM interests WHERE id = ?;', [
        id,
      ]);

      if (!existingRow) {
        throw new Error(`Interest not found: ${id}`);
      }

      const existing = rowToInterest(existingRow);
      const updated: Interest = {
        ...existing,
        ...patch,
        id: existing.id,
        updatedAt: new Date().toISOString(),
      };

      db.runSync(
        `UPDATE interests
         SET title = ?, type = ?, state = ?, archived_at = ?, type_skipped_at = ?, updated_at = ?
         WHERE id = ?;`,
        [
          updated.title,
          updated.type,
          updated.state,
          updated.archivedAt,
          updated.typeSkippedAt,
          updated.updatedAt,
          updated.id,
        ],
      );

      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    return this.withConnection((db) => {
      db.runSync('DELETE FROM interests WHERE id = ?;', [id]);
    });
  }
}
