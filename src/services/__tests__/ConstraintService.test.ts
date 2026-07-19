import type { Constraint } from '../../domain/constraint';
import type { ConstraintRepository } from '../../repositories/ConstraintRepository';
import { ConstraintService } from '../ConstraintService';

function makeConstraint(overrides: Partial<Constraint> = {}): Constraint {
  return {
    id: 'constraint-1',
    interestId: 'interest-1',
    dimension: 'Time',
    status: 'Set',
    value: '15-30',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeMockRepository(): jest.Mocked<ConstraintRepository> {
  return {
    findForInterest: jest.fn(),
    replaceForInterest: jest.fn(),
    findFullyAnsweredInterestIds: jest.fn(),
  } as unknown as jest.Mocked<ConstraintRepository>;
}

describe('ConstraintService', () => {
  let repository: jest.Mocked<ConstraintRepository>;
  let service: ConstraintService;

  beforeEach(() => {
    repository = makeMockRepository();
    service = new ConstraintService(repository);
  });

  describe('listForInterest', () => {
    it('fills in Unknown for dimensions with no stored row', async () => {
      repository.findForInterest.mockResolvedValue([]);

      const result = await service.listForInterest('interest-1');

      expect(result).toHaveLength(6);
      expect(result.every((c) => c.status === 'Unknown' && c.value === null)).toBe(true);
      expect(result.map((c) => c.dimension)).toEqual([
        'Time',
        'Supplies',
        'Location',
        'Social',
        'WeatherSeason',
        'EnergyFocus',
      ]);
    });

    it('returns exactly six entries, using stored rows where present', async () => {
      const stored = makeConstraint({ dimension: 'Time', status: 'Set', value: '15-30' });
      repository.findForInterest.mockResolvedValue([stored]);

      const result = await service.listForInterest('interest-1');

      expect(result).toHaveLength(6);
      const timeEntry = result.find((c) => c.dimension === 'Time');
      expect(timeEntry).toEqual(stored);
      const locationEntry = result.find((c) => c.dimension === 'Location');
      expect(locationEntry?.status).toBe('Unknown');
    });
  });

  describe('answer', () => {
    it('rejects an invalid answer without calling the repository', async () => {
      await expect(
        service.answer('interest-1', 'Time', { status: 'Set' }),
      ).rejects.toThrow();
      expect(repository.replaceForInterest).not.toHaveBeenCalled();
    });

    it('delegates to repository.replaceForInterest on a valid answer', async () => {
      repository.findForInterest.mockResolvedValue([
        makeConstraint({ dimension: 'Time', status: 'Set', value: '15-30' }),
      ]);

      await service.answer('interest-1', 'Time', { status: 'Set', value: '15-30' });

      expect(repository.replaceForInterest).toHaveBeenCalledWith(
        'interest-1',
        expect.arrayContaining([
          expect.objectContaining({ dimension: 'Time', status: 'Set', value: '15-30' }),
        ]),
      );
    });
  });

  describe('needsEnrichment', () => {
    it('returns the complement of the fully-answered set', async () => {
      repository.findFullyAnsweredInterestIds.mockResolvedValue(new Set(['interest-1']));

      const result = await service.needsEnrichment(
        ['interest-1', 'interest-2', 'interest-3'],
        ['Time', 'Location'],
      );

      expect(result).toEqual(new Set(['interest-2', 'interest-3']));
    });
  });
});
