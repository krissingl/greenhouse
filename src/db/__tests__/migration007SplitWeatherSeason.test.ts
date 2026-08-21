import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { migrations } from '../migrations';
import { runMigrations } from '../migrationRunner';

interface ConstraintRow {
  id: string;
  interest_id: string;
  dimension: string;
  status: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

const CREATED_AT = '2026-07-01T00:00:00.000Z';
const UPDATED_AT = '2026-07-02T00:00:00.000Z';

/** Builds a database at the schema revision immediately before migration 007. */
function databaseBeforeSplit(): SQLiteDatabase {
  const db = openDatabaseSync('migration-007-test.db');
  db.execSync('PRAGMA foreign_keys = ON;');

  for (const migration of migrations.filter((m) => m.id < 7)) {
    db.withTransactionSync(() => {
      migration.up(db);
      db.runSync('INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?);', [
        migration.id,
        migration.name,
        CREATED_AT,
      ]);
    });
  }

  db.runSync(
    `INSERT INTO interests (id, title, state, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?);`,
    ['interest-1', 'Night sky photography', 'Backlog', CREATED_AT, CREATED_AT],
  );

  return db;
}

function insertConstraint(
  db: SQLiteDatabase,
  row: Pick<ConstraintRow, 'id' | 'dimension' | 'status' | 'value'>,
): void {
  db.runSync(
    `INSERT INTO constraints (id, interest_id, dimension, status, value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [row.id, 'interest-1', row.dimension, row.status, row.value, CREATED_AT, UPDATED_AT],
  );
}

function readConstraints(db: SQLiteDatabase): ConstraintRow[] {
  return db.getAllSync<ConstraintRow>('SELECT * FROM constraints ORDER BY dimension;');
}

describe('migration 007 — split WeatherSeason into Weather/Season/TimeOfDay', () => {
  it('applies cleanly on top of the existing migration set', () => {
    const db = databaseBeforeSplit();

    runMigrations(db);

    const rows = db.getAllSync<{ id: number; name: string }>(
      'SELECT id, name FROM schema_migrations ORDER BY id;',
    );
    expect(rows).toHaveLength(7);
    expect(rows[6]).toMatchObject({ id: 7, name: 'split_weather_season_dimensions' });
  });

  it('no longer accepts WeatherSeason as a dimension, and accepts the three new ones', () => {
    const db = databaseBeforeSplit();
    runMigrations(db);

    expect(() =>
      insertConstraint(db, { id: 'legacy', dimension: 'WeatherSeason', status: 'None', value: null }),
    ).toThrow();

    expect(() => {
      insertConstraint(db, { id: 'w', dimension: 'Weather', status: 'None', value: null });
      insertConstraint(db, { id: 's', dimension: 'Season', status: 'None', value: null });
      insertConstraint(db, { id: 't', dimension: 'TimeOfDay', status: 'None', value: null });
    }).not.toThrow();
  });

  it("moves a kind: 'Weather' row onto the Weather dimension with the wrapper stripped", () => {
    const db = databaseBeforeSplit();
    insertConstraint(db, {
      id: 'ws-1',
      dimension: 'WeatherSeason',
      status: 'Set',
      value: JSON.stringify({ kind: 'Weather', conditions: ['Sunny', 'Overcast'] }),
    });

    runMigrations(db);

    const rows = readConstraints(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'ws-1',
      interest_id: 'interest-1',
      dimension: 'Weather',
      status: 'Set',
      created_at: CREATED_AT,
    });
    expect(JSON.parse(rows[0].value as string)).toEqual(['Sunny', 'Overcast']);
  });

  it("moves a kind: 'Season' row onto the Season dimension with the wrapper stripped", () => {
    const db = databaseBeforeSplit();
    insertConstraint(db, {
      id: 'ws-2',
      dimension: 'WeatherSeason',
      status: 'Set',
      value: JSON.stringify({ kind: 'Season', seasons: ['Fall'] }),
    });

    runMigrations(db);

    const rows = readConstraints(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'ws-2', dimension: 'Season', status: 'Set' });
    expect(JSON.parse(rows[0].value as string)).toEqual(['Fall']);
  });

  it("moves a kind: 'TimeOfDay' row onto the TimeOfDay dimension with the wrapper stripped", () => {
    const db = databaseBeforeSplit();
    insertConstraint(db, {
      id: 'ws-3',
      dimension: 'WeatherSeason',
      status: 'Set',
      value: JSON.stringify({ kind: 'TimeOfDay', times: ['Night'] }),
    });

    runMigrations(db);

    const rows = readConstraints(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'ws-3', dimension: 'TimeOfDay', status: 'Set' });
    expect(JSON.parse(rows[0].value as string)).toEqual(['Night']);
  });

  it('drops a legacy { matters, note? } row rather than guessing at a conversion', () => {
    const db = databaseBeforeSplit();
    insertConstraint(db, {
      id: 'ws-legacy',
      dimension: 'WeatherSeason',
      status: 'Set',
      value: JSON.stringify({ matters: true, note: 'This is a fall craft' }),
    });

    runMigrations(db);

    expect(readConstraints(db)).toHaveLength(0);
  });

  it('drops an unanswered WeatherSeason row and fans a "doesn\'t apply" row out to all three axes', () => {
    const db = databaseBeforeSplit();
    insertConstraint(db, {
      id: 'ws-unknown',
      dimension: 'WeatherSeason',
      status: 'Unknown',
      value: null,
    });

    runMigrations(db);
    expect(readConstraints(db)).toHaveLength(0);

    const other = databaseBeforeSplit();
    insertConstraint(other, {
      id: 'ws-none',
      dimension: 'WeatherSeason',
      status: 'None',
      value: null,
    });

    runMigrations(other);

    const rows = readConstraints(other);
    expect(rows.map((row) => row.dimension)).toEqual(['Season', 'TimeOfDay', 'Weather']);
    expect(rows.every((row) => row.status === 'None' && row.value === null)).toBe(true);
    expect(rows.every((row) => row.created_at === CREATED_AT)).toBe(true);
  });

  it('carries non-WeatherSeason rows across untouched', () => {
    const db = databaseBeforeSplit();
    insertConstraint(db, {
      id: 'time-1',
      dimension: 'Time',
      status: 'Set',
      value: JSON.stringify('15-30'),
    });
    insertConstraint(db, { id: 'social-1', dimension: 'Social', status: 'None', value: null });

    runMigrations(db);

    const rows = readConstraints(db);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === 'time-1')).toMatchObject({
      dimension: 'Time',
      status: 'Set',
      value: JSON.stringify('15-30'),
      created_at: CREATED_AT,
      updated_at: UPDATED_AT,
    });
    expect(rows.find((row) => row.id === 'social-1')).toMatchObject({
      dimension: 'Social',
      status: 'None',
      value: null,
    });
  });

  it('preserves UNIQUE (interest_id, dimension) and the cascade to interests', () => {
    const db = databaseBeforeSplit();
    runMigrations(db);

    insertConstraint(db, { id: 'w-1', dimension: 'Weather', status: 'None', value: null });
    expect(() =>
      insertConstraint(db, { id: 'w-2', dimension: 'Weather', status: 'None', value: null }),
    ).toThrow();

    db.runSync('DELETE FROM interests WHERE id = ?;', ['interest-1']);
    expect(readConstraints(db)).toHaveLength(0);
  });

  it('is idempotent — a double-run neither fails nor duplicates applied-migration records', () => {
    const db = databaseBeforeSplit();
    insertConstraint(db, {
      id: 'ws-4',
      dimension: 'WeatherSeason',
      status: 'Set',
      value: JSON.stringify({ kind: 'TimeOfDay', times: ['Night'] }),
    });

    expect(() => {
      runMigrations(db);
      runMigrations(db);
    }).not.toThrow();

    const applied = db.getAllSync<{ id: number }>('SELECT id FROM schema_migrations WHERE id = 7;');
    expect(applied).toHaveLength(1);

    const rows = readConstraints(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'ws-4', dimension: 'TimeOfDay' });
  });
});
