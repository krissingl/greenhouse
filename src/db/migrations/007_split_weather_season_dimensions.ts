import type { SQLiteDatabase } from 'expo-sqlite';

import type { Migration } from './types';

interface LegacyConstraintRow {
  id: string;
  interest_id: string;
  dimension: string;
  status: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

const NEW_DIMENSIONS = ['Weather', 'Season', 'TimeOfDay'] as const;

type NewDimension = (typeof NEW_DIMENSIONS)[number];

interface RewrittenRow {
  id: string;
  interestId: string;
  dimension: string;
  status: string;
  value: string | null;
  createdAt: string;
  updatedAt: string;
}

function stripKindWrapper(parsed: Record<string, unknown>): {
  dimension: NewDimension;
  value: unknown;
} | null {
  const kind = parsed.kind;
  if (kind === 'Weather') {
    return { dimension: 'Weather', value: parsed.conditions ?? [] };
  }
  if (kind === 'Season') {
    return { dimension: 'Season', value: parsed.seasons ?? [] };
  }
  if (kind === 'TimeOfDay') {
    return { dimension: 'TimeOfDay', value: parsed.times ?? [] };
  }
  return null;
}

function parseValue(raw: string | null): Record<string, unknown> | null {
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function rewriteWeatherSeasonRow(row: LegacyConstraintRow): RewrittenRow[] {
  const parsed = parseValue(row.value);

  if (parsed !== null) {
    const split = stripKindWrapper(parsed);
    if (split === null) {
      // Pre-structured `{ matters, note? }` prose: no queryable data to carry over.
      return [];
    }
    return [
      {
        id: row.id,
        interestId: row.interest_id,
        dimension: split.dimension,
        status: row.status,
        value: JSON.stringify(split.value),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    ];
  }

  if (row.status === 'None') {
    // "Weather or time of year doesn't matter" answered all three axes at once,
    // so it fans out rather than reverting to unanswered.
    return NEW_DIMENSIONS.map((dimension) => ({
      id: `${row.id}-${dimension}`,
      interestId: row.interest_id,
      dimension,
      status: 'None',
      value: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  return [];
}

function rewriteRow(row: LegacyConstraintRow): RewrittenRow[] {
  if (row.dimension === 'WeatherSeason') {
    return rewriteWeatherSeasonRow(row);
  }
  return [
    {
      id: row.id,
      interestId: row.interest_id,
      dimension: row.dimension,
      status: row.status,
      value: row.value,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  ];
}

export const migration007SplitWeatherSeasonDimensions: Migration = {
  id: 7,
  name: 'split_weather_season_dimensions',
  up: (db: SQLiteDatabase) => {
    db.execSync(`
      DROP TABLE IF EXISTS constraints_new;

      CREATE TABLE constraints_new (
        id TEXT PRIMARY KEY,
        interest_id TEXT NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
        dimension TEXT NOT NULL CHECK (dimension IN ('Time', 'Supplies', 'Location', 'Social', 'Weather', 'Season', 'TimeOfDay', 'EnergyFocus')),
        status TEXT NOT NULL CHECK (status IN ('Unknown', 'None', 'Set')),
        value TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (interest_id, dimension)
      );
    `);

    const rows = db.getAllSync<LegacyConstraintRow>('SELECT * FROM constraints;');

    for (const row of rows) {
      for (const rewritten of rewriteRow(row)) {
        db.runSync(
          `INSERT INTO constraints_new (id, interest_id, dimension, status, value, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            rewritten.id,
            rewritten.interestId,
            rewritten.dimension,
            rewritten.status,
            rewritten.value,
            rewritten.createdAt,
            rewritten.updatedAt,
          ],
        );
      }
    }

    db.execSync(`
      DROP TABLE constraints;
      ALTER TABLE constraints_new RENAME TO constraints;
    `);
  },
};
