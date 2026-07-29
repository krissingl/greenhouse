import type { Note } from '../../domain/note';
import type { NoteRepository } from '../../repositories/NoteRepository';
import { NoteService } from '../NoteService';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    interestId: 'interest-1',
    title: undefined,
    body: 'rented a violin from the shop on 5th',
    pinned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeMockRepository(): jest.Mocked<NoteRepository> {
  return {
    findForInterest: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<NoteRepository>;
}

describe('NoteService', () => {
  let repository: jest.Mocked<NoteRepository>;
  let service: NoteService;

  beforeEach(() => {
    repository = makeMockRepository();
    service = new NoteService(repository);
  });

  describe('listForInterest', () => {
    it('delegates to repository.findForInterest', async () => {
      const notes = [makeNote()];
      repository.findForInterest.mockResolvedValue(notes);

      const result = await service.listForInterest('interest-1');

      expect(repository.findForInterest).toHaveBeenCalledWith('interest-1');
      expect(result).toEqual(notes);
    });
  });

  describe('add', () => {
    it('rejects an empty body without calling the repository', async () => {
      await expect(service.add('interest-1', { body: '' })).rejects.toThrow();
      expect(repository.insert).not.toHaveBeenCalled();
    });

    it('rejects a whitespace-only body without calling the repository', async () => {
      await expect(service.add('interest-1', { body: '   ' })).rejects.toThrow();
      expect(repository.insert).not.toHaveBeenCalled();
    });

    it('calls the repository with a valid body', async () => {
      const created = makeNote();
      repository.insert.mockResolvedValue(created);

      const result = await service.add('interest-1', { title: 'Shop lead', body: created.body });

      expect(repository.insert).toHaveBeenCalledWith({
        interestId: 'interest-1',
        title: 'Shop lead',
        body: created.body,
      });
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('re-validates the body when the patch includes one', async () => {
      await expect(service.update('note-1', { body: '' })).rejects.toThrow();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('delegates to repository.update with a valid patch', async () => {
      const updated = makeNote({ pinned: true });
      repository.update.mockResolvedValue(updated);

      const result = await service.update('note-1', { pinned: true });

      expect(repository.update).toHaveBeenCalledWith('note-1', { pinned: true });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('delegates to repository.remove', async () => {
      repository.remove.mockResolvedValue(undefined);

      await service.remove('note-1');

      expect(repository.remove).toHaveBeenCalledWith('note-1');
    });
  });
});
