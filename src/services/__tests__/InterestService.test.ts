import type { Interest, InterestFilter, NewInterest } from '../../domain/interest';
import type { InterestRepository } from '../../repositories/InterestRepository';
import { InterestService } from '../InterestService';

function makeInterest(overrides: Partial<Interest> = {}): Interest {
  return {
    id: 'interest-1',
    title: 'Learn violin',
    type: null,
    state: 'Backlog',
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeMockRepository(): jest.Mocked<InterestRepository> {
  return {
    insert: jest.fn(),
    findById: jest.fn(),
    query: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<InterestRepository>;
}

describe('InterestService', () => {
  let repository: jest.Mocked<InterestRepository>;
  let service: InterestService;

  beforeEach(() => {
    repository = makeMockRepository();
    service = new InterestService(repository);
  });

  describe('create', () => {
    it('rejects an empty title without calling the repository', async () => {
      await expect(service.create({ title: '' } as NewInterest)).rejects.toThrow();
      expect(repository.insert).not.toHaveBeenCalled();
    });

    it('rejects a whitespace-only title without calling the repository', async () => {
      await expect(service.create({ title: '   ' })).rejects.toThrow();
      expect(repository.insert).not.toHaveBeenCalled();
    });

    it('calls the repository with a valid title', async () => {
      const created = makeInterest();
      repository.insert.mockResolvedValue(created);

      const result = await service.create({ title: 'Learn violin' });

      expect(repository.insert).toHaveBeenCalledWith({ title: 'Learn violin' });
      expect(result).toEqual(created);
    });
  });

  describe('get', () => {
    it('delegates to repository.findById', async () => {
      const found = makeInterest();
      repository.findById.mockResolvedValue(found);

      const result = await service.get('interest-1');

      expect(repository.findById).toHaveBeenCalledWith('interest-1');
      expect(result).toEqual(found);
    });
  });

  describe('list', () => {
    it('defaults includeArchived to false when omitted', async () => {
      repository.query.mockResolvedValue([]);

      await service.list();

      expect(repository.query).toHaveBeenCalledWith({ includeArchived: false });
    });

    it('preserves an explicit includeArchived value', async () => {
      repository.query.mockResolvedValue([]);

      const filter: InterestFilter = { includeArchived: true, state: 'Backlog' };
      await service.list(filter);

      expect(repository.query).toHaveBeenCalledWith({
        state: 'Backlog',
        includeArchived: true,
      });
    });
  });

  describe('update', () => {
    it('re-validates the title when the patch includes one', async () => {
      await expect(service.update('interest-1', { title: '' })).rejects.toThrow();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('delegates to repository.update with a valid patch', async () => {
      const updated = makeInterest({ title: 'Learn viola' });
      repository.update.mockResolvedValue(updated);

      const result = await service.update('interest-1', { title: 'Learn viola' });

      expect(repository.update).toHaveBeenCalledWith('interest-1', { title: 'Learn viola' });
      expect(result).toEqual(updated);
    });

    it('does not require a title in the patch', async () => {
      const updated = makeInterest({ state: 'InProgress' });
      repository.update.mockResolvedValue(updated);

      await service.update('interest-1', { state: 'InProgress' });

      expect(repository.update).toHaveBeenCalledWith('interest-1', { state: 'InProgress' });
    });
  });

  describe('setState', () => {
    it('calls repository.update with only the state field', async () => {
      const updated = makeInterest({ state: 'Complete' });
      repository.update.mockResolvedValue(updated);

      await service.setState('interest-1', 'Complete');

      expect(repository.update).toHaveBeenCalledWith('interest-1', { state: 'Complete' });
    });
  });

  describe('archive', () => {
    it('calls repository.update with an archivedAt timestamp', async () => {
      const updated = makeInterest({ archivedAt: '2026-01-02T00:00:00.000Z' });
      repository.update.mockResolvedValue(updated);

      await service.archive('interest-1');

      expect(repository.update).toHaveBeenCalledWith(
        'interest-1',
        expect.objectContaining({ archivedAt: expect.any(String) }),
      );
    });
  });

  describe('unarchive', () => {
    it('calls repository.update clearing archivedAt', async () => {
      const updated = makeInterest({ archivedAt: null });
      repository.update.mockResolvedValue(updated);

      await service.unarchive('interest-1');

      expect(repository.update).toHaveBeenCalledWith('interest-1', { archivedAt: null });
    });
  });

  describe('delete', () => {
    it('delegates to repository.remove', async () => {
      repository.remove.mockResolvedValue(undefined);

      await service.delete('interest-1');

      expect(repository.remove).toHaveBeenCalledWith('interest-1');
    });
  });
});
