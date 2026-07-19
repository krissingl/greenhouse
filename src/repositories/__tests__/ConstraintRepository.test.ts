import type { Constraint } from '../../domain/constraint';
import { getDatabase } from '../../db/connection';
import { runMigrations } from '../../db/migrationRunner';
import { ConstraintRepository } from '../ConstraintRepository';
import { InterestRepository } from '../InterestRepository';

function makeConstraint(overrides: Partial<Constraint> = {}): Constraint {
  return {
    id: 'ignored-id',
    interestId: 'ignored-interest-id',
    dimension: 'Time',
    status: 'Set',
    value: '15-30',
    createdAt: 'ignored-created-at',
    updatedAt: 'ignored-updated-at',
    ...overrides,
  };
}

describe('ConstraintRepository', () => {
  let repository: ConstraintRepository;
  let interestRepository: InterestRepository;

  beforeAll(() => {
    runMigrations(getDatabase());
  });

  beforeEach(() => {
    repository = new ConstraintRepository();
    interestRepository = new InterestRepository();
    getDatabase().execSync('DELETE FROM constraints;');
    getDatabase().execSync('DELETE FROM interests;');
  });

  describe('replaceForInterest', () => {
    it('inserts a new row on first answer, generating id/createdAt server-side', async () => {
      const interest = await interestRepository.insert({ title: 'Learn violin' });

      await repository.replaceForInterest(interest.id, [
        makeConstraint({ interestId: interest.id, dimension: 'Time', value: '15-30' }),
      ]);

      const [stored] = await repository.findForInterest(interest.id);
      expect(stored.id).not.toBe('ignored-id');
      expect(stored.createdAt).not.toBe('ignored-created-at');
      expect(stored.dimension).toBe('Time');
      expect(stored.status).toBe('Set');
      expect(stored.value).toBe('15-30');
    });

    it('updates in place on re-answer, preserving id/createdAt', async () => {
      const interest = await interestRepository.insert({ title: 'Learn violin' });

      await repository.replaceForInterest(interest.id, [
        makeConstraint({ interestId: interest.id, dimension: 'Time', value: '15-30' }),
      ]);
      const [first] = await repository.findForInterest(interest.id);

      await repository.replaceForInterest(interest.id, [
        makeConstraint({ interestId: interest.id, dimension: 'Time', value: '30-60' }),
      ]);
      const [second] = await repository.findForInterest(interest.id);

      expect(second.id).toBe(first.id);
      expect(second.createdAt).toBe(first.createdAt);
      expect(second.value).toBe('30-60');
    });

    it('leaves sibling dimensions untouched when answering one dimension', async () => {
      const interest = await interestRepository.insert({ title: 'Learn violin' });

      await repository.replaceForInterest(interest.id, [
        makeConstraint({ interestId: interest.id, dimension: 'Time', value: '15-30' }),
        makeConstraint({ interestId: interest.id, dimension: 'Location', value: 'Home' }),
      ]);

      await repository.replaceForInterest(interest.id, [
        makeConstraint({ interestId: interest.id, dimension: 'Time', value: '30-60' }),
      ]);

      const stored = await repository.findForInterest(interest.id);
      const location = stored.find((c) => c.dimension === 'Location');
      expect(location?.value).toBe('Home');
    });
  });

  describe('cascade delete', () => {
    it('removes constraint rows when the parent interest is deleted', async () => {
      const interest = await interestRepository.insert({ title: 'Learn violin' });
      await repository.replaceForInterest(interest.id, [
        makeConstraint({ interestId: interest.id, dimension: 'Time', value: '15-30' }),
      ]);

      await interestRepository.remove(interest.id);

      const stored = await repository.findForInterest(interest.id);
      expect(stored).toHaveLength(0);
    });
  });

  describe('findFullyAnsweredInterestIds', () => {
    it('returns only interests answered on every given dimension', async () => {
      const fullyAnswered = await interestRepository.insert({ title: 'Fully answered' });
      const partiallyAnswered = await interestRepository.insert({ title: 'Partially answered' });
      const unanswered = await interestRepository.insert({ title: 'Unanswered' });

      await repository.replaceForInterest(fullyAnswered.id, [
        makeConstraint({ interestId: fullyAnswered.id, dimension: 'Time', value: '15-30' }),
        makeConstraint({
          interestId: fullyAnswered.id,
          dimension: 'Location',
          status: 'None',
          value: null,
        }),
      ]);
      await repository.replaceForInterest(partiallyAnswered.id, [
        makeConstraint({ interestId: partiallyAnswered.id, dimension: 'Time', value: '15-30' }),
      ]);

      const result = await repository.findFullyAnsweredInterestIds(
        [fullyAnswered.id, partiallyAnswered.id, unanswered.id],
        ['Time', 'Location'],
      );

      expect(result).toEqual(new Set([fullyAnswered.id]));
    });
  });
});
