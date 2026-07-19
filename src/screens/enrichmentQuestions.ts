import type { ConstraintDimension, ConstraintValue } from '../domain/constraint';
import type { InterestType } from '../domain/interest';

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
  prompt: string;
  options: ChipOption<ConstraintValue>[];
}

export interface TypeQuestionConfig {
  variant: 'type';
  axis: 'Type';
  prompt: string;
  options: ChipOption<InterestType>[];
}

export interface SuppliesQuestionConfig {
  variant: 'supplies';
  axis: 'Supplies';
  prompt: string;
}

export interface WeatherSeasonQuestionConfig {
  variant: 'weather';
  axis: 'WeatherSeason';
  prompt: string;
}

export type QuestionConfig =
  ChipQuestionConfig | TypeQuestionConfig | SuppliesQuestionConfig | WeatherSeasonQuestionConfig;

export const enrichmentQuestions: Record<EnrichmentAxis, QuestionConfig> = {
  Type: {
    variant: 'type',
    axis: 'Type',
    prompt: 'What kind of interest is this?',
    options: [
      { label: 'One-time project', value: 'OneTimeProject' },
      { label: 'Structured learning', value: 'StructuredLearning' },
      { label: 'Unstructured learning', value: 'UnstructuredLearning' },
    ],
  },
  Time: {
    variant: 'chips',
    axis: 'Time',
    prompt: 'How long does a good session usually want?',
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
    prompt: 'Need any gear or supplies?',
  },
  Location: {
    variant: 'chips',
    axis: 'Location',
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
    prompt: 'Need anyone else?',
    options: [
      { label: 'Solo', value: 'Solo' },
      { label: 'Needs people', value: 'NeedsPeople' },
    ],
  },
  WeatherSeason: {
    variant: 'weather',
    axis: 'WeatherSeason',
    prompt: 'Does weather or time of year matter?',
  },
};
