import type { Constraint, ConstraintDimension } from '../../domain/constraint';
import { describeCapability } from '../describeCapability';

function makeConstraint(
  dimension: ConstraintDimension,
  overrides: Partial<Constraint> = {},
): Constraint {
  return {
    id: `constraint-${dimension}`,
    interestId: 'interest-1',
    dimension,
    status: 'Unknown',
    value: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('describeCapability', () => {
  it('returns the zero-answers message when nothing is known', () => {
    const constraints = [
      makeConstraint('Time'),
      makeConstraint('Supplies'),
      makeConstraint('Location'),
      makeConstraint('Social'),
      makeConstraint('WeatherSeason'),
    ];

    const result = describeCapability(constraints, null, null);

    expect(result).toBe('I can only find this if you go looking for it.');
  });

  it('returns a suggestion-capability message when some dimensions are answered', () => {
    const constraints = [
      makeConstraint('Time', { status: 'Set', value: '15-30' }),
      makeConstraint('Supplies'),
      makeConstraint('Location'),
      makeConstraint('Social'),
      makeConstraint('WeatherSeason'),
    ];

    const result = describeCapability(constraints, null, null);

    expect(result).toBe('I can suggest this when you have the time.');
  });

  it('returns a distinct message for a deliberately-skipped Type with no dimensions answered', () => {
    const constraints = [
      makeConstraint('Time'),
      makeConstraint('Supplies'),
      makeConstraint('Location'),
      makeConstraint('Social'),
      makeConstraint('WeatherSeason'),
    ];

    const result = describeCapability(constraints, null, '2026-07-02T00:00:00.000Z');

    expect(result).toBe("I know a little about this — I'll keep it in mind.");
    expect(result).not.toBe('I can only find this if you go looking for it.');
  });
});
