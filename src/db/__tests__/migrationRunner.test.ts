import { getDatabase } from '../connection';
import { runMigrations } from '../migrationRunner';

describe('runMigrations', () => {
  it('applies the baseline migration and creates the schema_migrations table', () => {
    const db = getDatabase();
    runMigrations(db);

    const rows = db.getAllSync<{ id: number; name: string }>(
      'SELECT id, name FROM schema_migrations ORDER BY id;',
    );
    expect(rows[0]).toMatchObject({ id: 1, name: 'create_schema_migrations' });
  });

  it('applies migration 002 cleanly on top of 001, creating the interests table', () => {
    const db = getDatabase();
    runMigrations(db);

    const rows = db.getAllSync<{ id: number; name: string }>(
      'SELECT id, name FROM schema_migrations ORDER BY id;',
    );
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ id: 2, name: 'create_interests' });

    const tableRow = db.getFirstSync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'interests';",
    );
    expect(tableRow).not.toBeNull();
  });

  it('is idempotent — running the full migration set twice does not fail or duplicate records', () => {
    const db = getDatabase();

    expect(() => {
      runMigrations(db);
      runMigrations(db);
    }).not.toThrow();

    const rows = db.getAllSync<{ id: number }>('SELECT id FROM schema_migrations;');
    expect(rows).toHaveLength(2);
  });
});
