import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Constraint,
  ConstraintDimension,
  ConstraintStatus,
  ConstraintValue,
} from '../domain/constraint';
import type { InterestId } from '../domain/interest';
import { BaseRepository } from './BaseRepository';

interface ConstraintRow {
  id: string;
  interest_id: string;
  dimension: string;
  status: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

function rowToConstraint(row: ConstraintRow): Constraint {
  return {
    id: row.id,
    interestId: row.interest_id,
    dimension: row.dimension as ConstraintDimension,
    status: row.status as ConstraintStatus,
    // JSON.parse erases to `any`/`unknown` regardless of the column's dimension, so this cast
    // is the JSON deserialization boundary itself — the one place a dimension-typed Constraint
    // can't be produced without trusting the stored shape. Every other ConstraintValue cast in
    // this codebase is a call site that already knows its dimension at compile time.
    value: row.value !== null ? (JSON.parse(row.value) as ConstraintValue) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ConstraintRepository extends BaseRepository {
  async findForInterest(interestId: InterestId): Promise<Constraint[]> {
    return this.withConnection((db) => {
      const rows = db.getAllSync<ConstraintRow>(
        'SELECT * FROM constraints WHERE interest_id = ?;',
        [interestId],
      );
      return rows.map(rowToConstraint);
    });
  }

  async replaceForInterest(interestId: InterestId, constraints: Constraint[]): Promise<void> {
    return this.withConnection((db) => {
      const now = new Date().toISOString();

      for (const constraint of constraints) {
        this.upsertOne(db, interestId, constraint, now);
      }
    });
  }

  async findFullyAnsweredInterestIds(
    interestIds: InterestId[],
    dimensions: ConstraintDimension[],
  ): Promise<Set<InterestId>> {
    return this.withConnection((db) => {
      if (interestIds.length === 0 || dimensions.length === 0) {
        return new Set<InterestId>();
      }

      const interestPlaceholders = interestIds.map(() => '?').join(', ');
      const dimensionPlaceholders = dimensions.map(() => '?').join(', ');

      const rows = db.getAllSync<{ interest_id: string; answered_count: number }>(
        `SELECT interest_id, COUNT(*) AS answered_count
         FROM constraints
         WHERE interest_id IN (${interestPlaceholders})
           AND dimension IN (${dimensionPlaceholders})
           AND status IN ('Set', 'None')
         GROUP BY interest_id;`,
        [...interestIds, ...dimensions],
      );

      const fullyAnswered = new Set<InterestId>();
      for (const row of rows) {
        if (row.answered_count >= dimensions.length) {
          fullyAnswered.add(row.interest_id);
        }
      }

      return fullyAnswered;
    });
  }

  private upsertOne(
    db: SQLiteDatabase,
    interestId: InterestId,
    constraint: Constraint,
    now: string,
  ): void {
    const existingRow = db.getFirstSync<ConstraintRow>(
      'SELECT * FROM constraints WHERE interest_id = ? AND dimension = ?;',
      [interestId, constraint.dimension],
    );

    const encodedValue = constraint.value !== null ? JSON.stringify(constraint.value) : null;

    if (existingRow) {
      db.runSync(
        `UPDATE constraints
         SET status = ?, value = ?, updated_at = ?
         WHERE id = ?;`,
        [constraint.status, encodedValue, now, existingRow.id],
      );
      return;
    }

    const id = Crypto.randomUUID();
    db.runSync(
      `INSERT INTO constraints (id, interest_id, dimension, status, value, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [id, interestId, constraint.dimension, constraint.status, encodedValue, now, now],
    );
  }
}
