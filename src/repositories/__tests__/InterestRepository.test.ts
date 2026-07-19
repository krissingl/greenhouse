import { getDatabase } from '../../db/connection';
import { runMigrations } from '../../db/migrationRunner';
import { InterestRepository } from '../InterestRepository';

describe('InterestRepository', () => {
  let repository: InterestRepository;

  beforeAll(() => {
    runMigrations(getDatabase());
  });

  beforeEach(() => {
    repository = new InterestRepository();
    getDatabase().execSync('DELETE FROM interests;');
  });

  describe('insert', () => {
    it('generates an id and timestamps and defaults state to Backlog', async () => {
      const interest = await repository.insert({ title: 'Learn violin' });

      expect(interest.id).toBeTruthy();
      expect(interest.title).toBe('Learn violin');
      expect(interest.state).toBe('Backlog');
      expect(interest.type).toBeNull();
      expect(interest.archivedAt).toBeNull();
      expect(interest.createdAt).toBeTruthy();
      expect(interest.updatedAt).toBeTruthy();
    });

    it('persists a provided type', async () => {
      const interest = await repository.insert({
        title: 'Cyber cert',
        type: 'StructuredLearning',
      });

      expect(interest.type).toBe('StructuredLearning');
    });

    it('defaults typeSkippedAt to null', async () => {
      const interest = await repository.insert({ title: 'Learn violin' });
      expect(interest.typeSkippedAt).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the matching interest', async () => {
      const created = await repository.insert({ title: 'Learn violin' });
      const found = await repository.findById(created.id);

      expect(found).toEqual(created);
    });

    it('returns null when no row matches', async () => {
      const found = await repository.findById('does-not-exist');
      expect(found).toBeNull();
    });
  });

  describe('query', () => {
    it('filters by state', async () => {
      const a = await repository.insert({ title: 'A' });
      await repository.update(a.id, { state: 'InProgress' });
      await repository.insert({ title: 'B' });

      const results = await repository.query({ state: 'InProgress' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('A');
    });

    it('filters by type', async () => {
      await repository.insert({ title: 'A', type: 'OneTimeProject' });
      await repository.insert({ title: 'B', type: 'StructuredLearning' });

      const results = await repository.query({ type: 'OneTimeProject' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('A');
    });

    it('filters by query, case-insensitively, matching a title substring', async () => {
      await repository.insert({ title: 'Learn Violin' });
      await repository.insert({ title: 'Bake bread' });

      const results = await repository.query({ query: 'violin' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Learn Violin');
    });

    it('excludes archived interests by default', async () => {
      const archived = await repository.insert({ title: 'Archived one' });
      await repository.update(archived.id, { archivedAt: new Date().toISOString() });
      await repository.insert({ title: 'Active one' });

      const results = await repository.query({});

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Active one');
    });

    it('includes archived interests when includeArchived is true', async () => {
      const archived = await repository.insert({ title: 'Archived one' });
      await repository.update(archived.id, { archivedAt: new Date().toISOString() });
      await repository.insert({ title: 'Active one' });

      const results = await repository.query({ includeArchived: true });

      expect(results).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('persists the patch and bumps updated_at', async () => {
      const created = await repository.insert({ title: 'Learn violin' });

      const updated = await repository.update(created.id, { title: 'Learn viola' });

      expect(updated.title).toBe('Learn viola');
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.updatedAt).getTime(),
      );

      const refetched = await repository.findById(created.id);
      expect(refetched?.title).toBe('Learn viola');
    });

    it('leaves createdAt untouched', async () => {
      const created = await repository.insert({ title: 'Learn violin' });

      const updated = await repository.update(created.id, { title: 'Learn viola' });

      expect(updated.createdAt).toBe(created.createdAt);
    });

    it('round-trips typeSkippedAt', async () => {
      const created = await repository.insert({ title: 'Learn violin' });
      const skippedAt = new Date().toISOString();

      const updated = await repository.update(created.id, { typeSkippedAt: skippedAt });
      expect(updated.typeSkippedAt).toBe(skippedAt);

      const refetched = await repository.findById(created.id);
      expect(refetched?.typeSkippedAt).toBe(skippedAt);
    });
  });

  describe('remove', () => {
    it('permanently deletes the row', async () => {
      const created = await repository.insert({ title: 'Learn violin' });

      await repository.remove(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });
});
