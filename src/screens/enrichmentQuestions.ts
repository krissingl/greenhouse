import type {
  ConstraintDimension,
  ConstraintStatus,
  ConstraintValue,
  Season,
  SupplyItem,
  TimeOfDay,
  WeatherCondition,
} from '../domain/constraint';
import { displayLabel, type InterestType } from '../domain/interest';

export const WEATHER_CONDITIONS: WeatherCondition[] = [
  'Sunny',
  'Overcast',
  'Dry',
  'Rainy',
  'Hot',
  'Cold',
];

export const TIMES_OF_DAY: TimeOfDay[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

export const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];

export type EnrichmentAxis = Exclude<ConstraintDimension, 'EnergyFocus'> | 'Type';

export const COVERED_AXES: EnrichmentAxis[] = [
  'Type',
  'Time',
  'Supplies',
  'Location',
  'Social',
  'Weather',
  'Season',
  'TimeOfDay',
];

export type MultiSelectAxis = 'Weather' | 'Season' | 'TimeOfDay';

export type MultiSelectOption = WeatherCondition | Season | TimeOfDay;

export interface ChipOption<V> {
  label: string;
  value: V;
  /** Optional one-line explanation rendered beneath the option's label. */
  description?: string;
}

export interface ChipQuestionConfig {
  variant: 'chips';
  axis: Exclude<EnrichmentAxis, 'Type' | 'Supplies' | MultiSelectAxis>;
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

export interface MultiSelectQuestionConfig {
  variant: 'multi';
  axis: MultiSelectAxis;
  shortLabel: string;
  prompt: string;
  options: MultiSelectOption[];
  /** Season and TimeOfDay are where a deadline naturally comes up; Weather is not. */
  offersDueBy: boolean;
}

export type QuestionConfig =
  ChipQuestionConfig | TypeQuestionConfig | SuppliesQuestionConfig | MultiSelectQuestionConfig;

export const enrichmentQuestions: Record<EnrichmentAxis, QuestionConfig> = {
  Type: {
    variant: 'type',
    axis: 'Type',
    shortLabel: 'type',
    prompt: 'What kind of interest is this?',
    options: [
      {
        label: displayLabel('OneTimeProject'),
        value: 'OneTimeProject',
        description: 'One thing to make or do.',
      },
      {
        label: displayLabel('StructuredLearning'),
        value: 'StructuredLearning',
        description: 'A path of ordered steps or lessons.',
      },
      {
        label: displayLabel('UnstructuredLearning'),
        value: 'UnstructuredLearning',
        description: 'Ongoing, with no defined end.',
      },
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
  Weather: {
    variant: 'multi',
    axis: 'Weather',
    shortLabel: 'weather',
    prompt: 'Does the weather matter?',
    options: WEATHER_CONDITIONS,
    offersDueBy: false,
  },
  Season: {
    variant: 'multi',
    axis: 'Season',
    shortLabel: 'season',
    prompt: 'Is this tied to a season?',
    options: SEASONS,
    offersDueBy: true,
  },
  TimeOfDay: {
    variant: 'multi',
    axis: 'TimeOfDay',
    shortLabel: 'time of day',
    prompt: 'Does the time of day matter?',
    options: TIMES_OF_DAY,
    offersDueBy: true,
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

  if (question.variant === 'multi') {
    const selected = (value as MultiSelectOption[] | null) ?? [];
    return selected.length > 0 ? selected.join(', ') : 'Matters';
  }

  return null;
}
