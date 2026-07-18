import { getDatabase } from '../connection';
import { runMigrations } from '../migrationRunner';

describe('runMigrations', () => {
  it('applies the baseline migration and creates the schema_migrations table', () => {
    const db = getDatabase();
    runMigrations(db);

    const rows = db.getAllSync<{ id: number; name: string }>(
      'SELECT id, name FROM schema_migrations;',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 1, name: 'create_schema_migrations' });
  });

  it('is idempotent — running it twice does not fail or duplicate records', () => {
    const db = getDatabase();

    expect(() => {
      runMigrations(db);
      runMigrations(db);
    }).not.toThrow();

    const rows = db.getAllSync<{ id: number }>('SELECT id FROM schema_migrations;');
    expect(rows).toHaveLength(1);
  });
});
