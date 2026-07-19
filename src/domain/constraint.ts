import type { InterestId } from './interest';

export type ConstraintId = string;

export type ConstraintDimension =
  | 'Time'
  | 'Supplies'
  | 'Location'
  | 'Social'
  | 'WeatherSeason'
  | 'EnergyFocus';

export type ConstraintStatus = 'Unknown' | 'None' | 'Set';

export type TimeConstraintValue = '5-15' | '15-30' | '30-60' | '1hr+' | 'Varies';

export interface SupplyItem {
  name: string;
  have: boolean;
}

export type LocationConstraintValue = 'Home' | 'Specific' | 'Anywhere';

export type SocialConstraintValue = 'Solo' | 'NeedsPeople';

export interface WeatherSeasonConstraintValue {
  matters: true;
  note?: string;
}

export type EnergyFocusConstraintValue = 'Low' | 'Medium' | 'High';

export type ConstraintValue =
  | TimeConstraintValue
  | SupplyItem[]
  | LocationConstraintValue
  | SocialConstraintValue
  | WeatherSeasonConstraintValue
  | EnergyFocusConstraintValue;

export interface Constraint {
  id: ConstraintId;
  interestId: InterestId;
  dimension: ConstraintDimension;
  status: ConstraintStatus;
  value: ConstraintValue | null;
  createdAt: string;
  updatedAt: string;
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
