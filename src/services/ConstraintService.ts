import { assertValidConstraintAnswer, findConstraint } from '../domain/constraint';
import type {
  Constraint,
  ConstraintDimension,
  ConstraintStatus,
  ConstraintValueByDimension,
} from '../domain/constraint';
import type { InterestId } from '../domain/interest';
import { ConstraintRepository } from '../repositories/ConstraintRepository';

const ALL_DIMENSIONS: ConstraintDimension[] = [
  'Time',
  'Supplies',
  'Location',
  'Social',
  'Weather',
  'Season',
  'TimeOfDay',
  'EnergyFocus',
];

function synthesizeUnknown(interestId: InterestId, dimension: ConstraintDimension): Constraint {
  return {
    id: '',
    interestId,
    dimension,
    status: 'Unknown',
    value: null,
    createdAt: '',
    updatedAt: '',
  };
}

export class ConstraintService {
  constructor(private readonly repository: ConstraintRepository = new ConstraintRepository()) {}

  async listForInterest(interestId: InterestId): Promise<Constraint[]> {
    const stored = await this.repository.findForInterest(interestId);
    const byDimension = new Map(stored.map((constraint) => [constraint.dimension, constraint]));

    return ALL_DIMENSIONS.map(
      (dimension) => byDimension.get(dimension) ?? synthesizeUnknown(interestId, dimension),
    );
  }

  async answer<D extends ConstraintDimension>(
    interestId: InterestId,
    dimension: D,
    input: { status: ConstraintStatus; value?: ConstraintValueByDimension[D] },
  ): Promise<Constraint<D>> {
    assertValidConstraintAnswer(input.status, input.value);

    const now = new Date().toISOString();
    const constraint: Constraint<D> = {
      id: '',
      interestId,
      dimension,
      status: input.status,
      value: input.value ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.replaceForInterest(interestId, [constraint]);

    const stored = await this.repository.findForInterest(interestId);
    return findConstraint(stored, dimension) ?? constraint;
  }

  async needsEnrichment(
    interestIds: InterestId[],
    dimensions: ConstraintDimension[],
  ): Promise<Set<InterestId>> {
    const fullyAnswered = await this.repository.findFullyAnsweredInterestIds(
      interestIds,
      dimensions,
    );

    return new Set(interestIds.filter((id) => !fullyAnswered.has(id)));
  }
}

export const constraintService = new ConstraintService();
