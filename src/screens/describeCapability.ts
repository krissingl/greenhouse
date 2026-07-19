import type { Constraint } from '../domain/constraint';
import type { InterestType } from '../domain/interest';

export function describeCapability(
  constraints: Constraint[],
  type: InterestType | null,
  typeSkippedAt: string | null,
): string {
  const capabilities: string[] = [];

  const hasAnswer = (dimension: Constraint['dimension']) =>
    constraints.some((c) => c.dimension === dimension && c.status === 'Set');

  if (hasAnswer('Time')) {
    capabilities.push('when you have the time');
  }
  if (hasAnswer('Location')) {
    capabilities.push('where you can do it');
  }
  if (hasAnswer('Supplies')) {
    capabilities.push('what you need first');
  }

  if (capabilities.length > 0) {
    return `I can suggest this ${capabilities.join(', ')}.`;
  }

  const typeKnown = type !== null || typeSkippedAt !== null;
  if (typeKnown) {
    return "I know a little about this — I'll keep it in mind.";
  }

  return 'I can only find this if you go looking for it.';
}
