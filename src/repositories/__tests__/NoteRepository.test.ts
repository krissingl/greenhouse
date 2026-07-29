import { getDatabase } from '../../db/connection';
import { runMigrations } from '../../db/migrationRunner';
import { InterestRepository } from '../InterestRepository';
import { NoteRepository } from '../NoteRepository';

describe('NoteRepository', () => {
  let repository: NoteRepository;
  let interestRepository: InterestRepository;

  beforeAll(() => {
    runMigrations(getDatabase());
  });

  beforeEach(() => {
    repository = new NoteRepository();
    interestRepository = new InterestRepository();
    getDatabase().execSync('DELETE FROM notes;');
    getDatabase().execSync('DELETE FROM interests;');
  });

  describe('insert', () => {
    it('generates an id and timestamps, defaulting title and pinned', async () => {
      const interest = await interestRepository.insert({ title: 'Learn violin' });

      const note = await repository.insert({
        interestId: interest.id,
        body: 'rented a violin from the shop on 5th',
      });

      expect(note.id).toBeTruthy();
      expect(note.interestId).toBe(interest.id);
      expect(note.title).toBeUndefined();
      expect(note.body).toBe('rented a violin from the shop on 5th');
      expect(note.pinned).toBe(false);
      expect(note.createdAt).toBeTruthy();
      expect(note.updatedAt).toBeTruthy();
    });

    it('persists a provided title and pinned flag', async () => {
      const interest = await interestRepository.insert({ title: 'Learn violin' });

      const note = await repository.insert({
        interestId: interest.id,
        title: 'Shop lead',
        body: 'teacher nearby has a waitlist',
        pinned: true,
      });

      expect(note.title).toBe('Shop lead');
      expect(note.pinned).toBe(true);
    });
  });

  describe('findForInterest', () => {
    it('orders pinned first, then newest-first', async () => {
      const interest = await interestRepository.insert({ title: 'Learn violin' });

      const first = await repository.insert({ interestId: interest.id, body: 'first note' });
      const second = await repository.insert({ interestId: interest.id, body: 'second note' });
      const third = await repository.insert({
        interestId: interest.id,
        body: 'pinned note',
        pinned: true,
      });

      const found = await repository.findForInterest(interest.id);

      expect(found.map((note) => note.id)).toEqual([third.id, second.id, first.id]);
    });

    it('returns an empty array for an interest with no notes', async () => {
      const interest = await interestRepository.insert({ title: 'Learn violin' });
      const found = await repository.findForInterest(interest.id);
      expect(found).toEqual([]);
    });
  });

  describe('update', () => {
    it('persists the patch and bumps updated_at', async () => {
      const interest = await interestRepository.insert({ title: 'Learn violin' });
      const created = await repository.insert({ interestId: interest.id, body: 'original' });

      const updated = await repository.update(created.id, { body: 'revised', pinned: true });

      expect(updated.body).toBe('revised');
      expect(updated.pinned).toBe(true);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.updatedAt).getTime(),
      );
    });
  });

  describe('remove', () => {
    it('permanently deletes the row', async () => {
      const interest = await interestRepository.insert({ title: 'Learn violin' });
      const created = await repository.insert({ interestId: interest.id, body: 'a note' });

      await repository.remove(created.id);

      const found = await repository.findForInterest(interest.id);
      expect(found).toEqual([]);
    });
  });

  describe('cascade delete', () => {
    it('removes note rows when the parent interest is deleted', async () => {
      const interest = await interestRepository.insert({ title: 'Learn violin' });
      await repository.insert({ interestId: interest.id, body: 'a note' });

      await interestRepository.remove(interest.id);

      const found = await repository.findForInterest(interest.id);
      expect(found).toHaveLength(0);
    });
  });
});
