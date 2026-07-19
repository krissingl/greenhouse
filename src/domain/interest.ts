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
}

export type InterestPatch = Partial<
  Pick<Interest, 'title' | 'type' | 'state' | 'archivedAt' | 'typeSkippedAt'>
>;

export function validateTitle(title: string): boolean {
  return title.trim().length > 0;
}

export function assertValidTitle(title: string): void {
  if (!validateTitle(title)) {
    throw new Error('Title must not be empty or whitespace-only.');
  }
}
