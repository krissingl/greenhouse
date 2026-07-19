import { assertValidTitle } from '../domain/interest';
import type { Interest, InterestFilter, InterestId, InterestState, NewInterest } from '../domain/interest';
import { InterestRepository } from '../repositories/InterestRepository';

export class InterestService {
  constructor(private readonly repository: InterestRepository = new InterestRepository()) {}

  async create(newInterest: NewInterest): Promise<Interest> {
    assertValidTitle(newInterest.title);
    return this.repository.insert(newInterest);
  }

  async get(id: InterestId): Promise<Interest | null> {
    return this.repository.findById(id);
  }

  async list(filter: InterestFilter = {}): Promise<Interest[]> {
    return this.repository.query({
      ...filter,
      includeArchived: filter.includeArchived ?? false,
    });
  }

  async update(id: InterestId, patch: Partial<Interest>): Promise<Interest> {
    if (patch.title !== undefined) {
      assertValidTitle(patch.title);
    }
    return this.repository.update(id, patch);
  }

  async setState(id: InterestId, state: InterestState): Promise<Interest> {
    return this.repository.update(id, { state });
  }

  async archive(id: InterestId): Promise<Interest> {
    return this.repository.update(id, { archivedAt: new Date().toISOString() });
  }

  async unarchive(id: InterestId): Promise<Interest> {
    return this.repository.update(id, { archivedAt: null });
  }

  async delete(id: InterestId): Promise<void> {
    return this.repository.remove(id);
  }
}

export const interestService = new InterestService();
