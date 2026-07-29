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
    expect(rows[1]).toMatchObject({ id: 2, name: 'create_interests' });

    const tableRow = db.getFirstSync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'interests';",
    );
    expect(tableRow).not.toBeNull();
  });

  it('applies migrations 003 and 004 cleanly on top of 001/002, in order', () => {
    const db = getDatabase();
    runMigrations(db);

    const rows = db.getAllSync<{ id: number; name: string }>(
      'SELECT id, name FROM schema_migrations ORDER BY id;',
    );
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows[2]).toMatchObject({ id: 3, name: 'create_constraints' });
    expect(rows[3]).toMatchObject({ id: 4, name: 'add_type_skipped_at_to_interests' });

    const constraintsTableRow = db.getFirstSync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'constraints';",
    );
    expect(constraintsTableRow).not.toBeNull();

    const columns = db.getAllSync<{ name: string }>('PRAGMA table_info(interests);');
    expect(columns.some((column) => column.name === 'type_skipped_at')).toBe(true);
  });

  it('is idempotent — running the full migration set twice does not fail or duplicate records', () => {
    const db = getDatabase();

    expect(() => {
      runMigrations(db);
      runMigrations(db);
    }).not.toThrow();

    const rows = db.getAllSync<{ id: number }>('SELECT id FROM schema_migrations;');
    expect(rows).toHaveLength(6);
  });

  it('applies migrations 005 and 006 cleanly, adding due_by and creating notes', () => {
    const db = getDatabase();
    runMigrations(db);

    const rows = db.getAllSync<{ id: number; name: string }>(
      'SELECT id, name FROM schema_migrations ORDER BY id;',
    );
    expect(rows).toHaveLength(6);
    expect(rows[4]).toMatchObject({ id: 5, name: 'add_due_by_to_interests' });
    expect(rows[5]).toMatchObject({ id: 6, name: 'create_notes' });

    const columns = db.getAllSync<{ name: string }>('PRAGMA table_info(interests);');
    expect(columns.some((column) => column.name === 'due_by')).toBe(true);

    const notesTableRow = db.getFirstSync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'notes';",
    );
    expect(notesTableRow).not.toBeNull();
  });
});
