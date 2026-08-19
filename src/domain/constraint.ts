import type { InterestId } from './interest';

export type ConstraintId = string;

export type ConstraintDimension =
  | 'Time'
  | 'Supplies'
  | 'Location'
  | 'Social'
  | 'Weather'
  | 'Season'
  | 'TimeOfDay'
  | 'EnergyFocus';

export type ConstraintStatus = 'Unknown' | 'None' | 'Set';

export type TimeConstraintValue = '5-15' | '15-30' | '30-60' | '1hr+' | 'Varies';

export interface SupplyItem {
  name: string;
  have: boolean;
}

export type LocationConstraintValue = 'Home' | 'Specific' | 'Anywhere';

export type SocialConstraintValue = 'Solo' | 'NeedsPeople';

export type WeatherCondition = 'Sunny' | 'Overcast' | 'Dry' | 'Rainy' | 'Hot' | 'Cold';

export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';

export type EnergyFocusConstraintValue = 'Low' | 'Medium' | 'High';

// Maps each ConstraintDimension to the shape its value takes once answered. Constraint<D> and
// the flat ConstraintValue union are both derived from this map, so a dimension's value shape
// is declared exactly once.
export interface ConstraintValueByDimension {
  Time: TimeConstraintValue;
  Supplies: SupplyItem[];
  Location: LocationConstraintValue;
  Social: SocialConstraintValue;
  Weather: WeatherCondition[];
  Season: Season[];
  TimeOfDay: TimeOfDay[];
  EnergyFocus: EnergyFocusConstraintValue;
}

export type ConstraintValue = ConstraintValueByDimension[ConstraintDimension];

export interface Constraint<D extends ConstraintDimension = ConstraintDimension> {
  id: ConstraintId;
  interestId: InterestId;
  dimension: D;
  status: ConstraintStatus;
  value: ConstraintValueByDimension[D] | null;
  createdAt: string;
  updatedAt: string;
}

// Narrows a Constraint[] to the row for one dimension, if present, so `value` comes back typed
// to that dimension's own shape (e.g. SupplyItem[] for 'Supplies') instead of the flat
// ConstraintValue union — call sites that know which dimension they want no longer need a cast.
export function findConstraint<D extends ConstraintDimension>(
  constraints: Constraint[],
  dimension: D,
): Constraint<D> | undefined {
  return constraints.find((c): c is Constraint<D> => c.dimension === dimension);
}

export function isValidConstraintAnswer(
  status: ConstraintStatus,
  value: ConstraintValue | null | undefined,
): boolean {
  if (status === 'Set') {
    return value !== null && value !== undefined;
  }
  return value === null || value === undefined;
}

export function assertValidConstraintAnswer(
  status: ConstraintStatus,
  value: ConstraintValue | null | undefined,
): void {
  if (!isValidConstraintAnswer(status, value)) {
    if (status === 'Set') {
      throw new Error('A "Set" constraint answer must include a value.');
    }
    throw new Error('An "Unknown" or "None" constraint answer must not include a value.');
  }
}
