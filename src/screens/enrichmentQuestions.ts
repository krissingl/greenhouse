import type {
  ConstraintDimension,
  ConstraintStatus,
  ConstraintValue,
  SupplyItem,
} from '../domain/constraint';
import { displayLabel, type InterestType } from '../domain/interest';

export type EnrichmentAxis = Exclude<ConstraintDimension, 'EnergyFocus'> | 'Type';

export const COVERED_AXES: EnrichmentAxis[] = [
  'Type',
  'Time',
  'Supplies',
  'Location',
  'Social',
  'WeatherSeason',
];

export interface ChipOption<V> {
  label: string;
  value: V;
}

export interface ChipQuestionConfig {
  variant: 'chips';
  axis: Exclude<EnrichmentAxis, 'Type' | 'Supplies' | 'WeatherSeason'>;
  shortLabel: string;
  prompt: string;
  options: ChipOption<ConstraintValue>[];
}

export interface TypeQuestionConfig {
  variant: 'type';
  axis: 'Type';
  shortLabel: string;
  prompt: string;
  options: ChipOption<InterestType>[];
}

export interface SuppliesQuestionConfig {
  variant: 'supplies';
  axis: 'Supplies';
  shortLabel: string;
  prompt: string;
}

export interface WeatherSeasonQuestionConfig {
  variant: 'weather';
  axis: 'WeatherSeason';
  shortLabel: string;
  prompt: string;
}

export type QuestionConfig =
  ChipQuestionConfig | TypeQuestionConfig | SuppliesQuestionConfig | WeatherSeasonQuestionConfig;

export const enrichmentQuestions: Record<EnrichmentAxis, QuestionConfig> = {
  Type: {
    variant: 'type',
    axis: 'Type',
    shortLabel: 'type',
    prompt: 'What kind of interest is this?',
    options: [
      { label: displayLabel('OneTimeProject'), value: 'OneTimeProject' },
      { label: displayLabel('StructuredLearning'), value: 'StructuredLearning' },
      { label: displayLabel('UnstructuredLearning'), value: 'UnstructuredLearning' },
    ],
  },
  Time: {
    variant: 'chips',
    axis: 'Time',
    shortLabel: 'time',
    prompt: 'How long does a session take?',
    options: [
      { label: '5–15 min', value: '5-15' },
      { label: '15–30 min', value: '15-30' },
      { label: '30–60 min', value: '30-60' },
      { label: '1hr+', value: '1hr+' },
      { label: 'Varies', value: 'Varies' },
    ],
  },
  Supplies: {
    variant: 'supplies',
    axis: 'Supplies',
    shortLabel: 'supplies',
    prompt: 'Need any gear or supplies?',
  },
  Location: {
    variant: 'chips',
    axis: 'Location',
    shortLabel: 'location',
    prompt: 'Where can you do this?',
    options: [
      { label: 'Home', value: 'Home' },
      { label: 'Somewhere specific', value: 'Specific' },
      { label: 'Anywhere', value: 'Anywhere' },
    ],
  },
  Social: {
    variant: 'chips',
    axis: 'Social',
    shortLabel: 'social',
    prompt: 'Need anyone else?',
    options: [
      { label: 'Solo', value: 'Solo' },
      { label: 'Needs people', value: 'NeedsPeople' },
    ],
  },
  WeatherSeason: {
    variant: 'weather',
    axis: 'WeatherSeason',
    shortLabel: 'weather',
    prompt: 'Does weather or time of year matter?',
  },
};

export function summarizeAnswer(
  axis: EnrichmentAxis,
  status: ConstraintStatus,
  value: ConstraintValue | InterestType | null | undefined,
): string | null {
  if (status === 'Unknown') {
    return null;
  }

  if (status === 'None') {
    return "Doesn't apply";
  }

  const question = enrichmentQuestions[axis];

  if (question.variant === 'chips' || question.variant === 'type') {
    const match = question.options.find((option) => option.value === value);
    return match?.label ?? null;
  }

  if (question.variant === 'supplies') {
    const items = (value as SupplyItem[] | null) ?? [];
    if (items.length === 0) {
      return 'No supplies needed';
    }
    return items.length === 1 ? items[0].name : `${items.length} items`;
  }

  if (question.variant === 'weather') {
    const weatherValue = value as { matters: true; note?: string } | null;
    return weatherValue?.note && weatherValue.note.length > 0 ? weatherValue.note : 'Matters';
  }

  return null;
}
