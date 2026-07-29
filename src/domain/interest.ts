export type InterestId = string;

export type InterestType = 'OneTimeProject' | 'StructuredLearning' | 'UnstructuredLearning';

export type InterestState = 'Backlog' | 'InProgress' | 'Complete';

export interface Interest {
  id: InterestId;
  title: string;
  type: InterestType | null;
  state: InterestState;
  archivedAt: string | null;
  typeSkippedAt: string | null;
  dueBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewInterest = { title: string } & Partial<{ type: InterestType }>;

export interface InterestDetails {
  type: InterestType;
}

export interface InterestFilter {
  state?: InterestState;
  type?: InterestType;
  query?: string;
  includeArchived?: boolean;
  archivedOnly?: boolean;
}

export type InterestPatch = Partial<
  Pick<Interest, 'title' | 'type' | 'state' | 'archivedAt' | 'typeSkippedAt' | 'dueBy'>
>;

const DISPLAY_LABELS: Record<InterestType | InterestState, string> = {
  OneTimeProject: 'One-time project',
  StructuredLearning: 'Structured learning',
  UnstructuredLearning: 'Unstructured learning',
  Backlog: 'Backlog',
  InProgress: 'In progress',
  Complete: 'Complete',
};

export function displayLabel(value: InterestType | InterestState): string {
  return DISPLAY_LABELS[value];
}

export function validateTitle(title: string): boolean {
  return title.trim().length > 0;
}

export function assertValidTitle(title: string): void {
  if (!validateTitle(title)) {
    throw new Error('Title must not be empty or whitespace-only.');
  }
}
