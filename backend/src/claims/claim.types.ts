export interface Claim {
  readonly id: string;
  readonly ownerActorId: string | null;
  readonly workflowId: string;
  readonly workflowVersion: number;
  readonly state: string;
  readonly title: string;
  readonly description: string;
  readonly revision: number;
  readonly informationRequestCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface CreateClaimDto {
  readonly title: string;
  readonly description: string;
}
export interface ClaimPage {
  readonly items: readonly Claim[];
  readonly limit: number;
  readonly offset: number;
}
export class ClaimError extends Error {
  constructor(
    readonly code:
      | 'TRANSITION_NOT_FOUND'
      | 'STATE_CONFLICT'
      | 'TRANSITION_FORBIDDEN'
      | 'PRECONDITION_FAILED'
      | 'REVISION_CONFLICT'
      | 'CYCLE_LIMIT_REACHED'
      | 'COMMAND_ID_REUSED'
      | 'NOTIFICATION_RECIPIENT_UNAVAILABLE'
      | 'TRANSITION_STORAGE_FAILED'
      | 'STORAGE_BUSY'
      | 'IDENTITY_REQUIRED'
      | 'CLAIM_CREATION_FORBIDDEN'
      | 'INVALID_REQUEST'
      | 'CLAIM_NOT_FOUND'
      | 'CLAIM_STORAGE_FAILED'
      | 'CLAIM_WORKFLOW_UNAVAILABLE',
    readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 500 | 503,
    message: string,
  ) {
    super(message);
    this.name = 'ClaimError';
  }
}
function invalid(message: string): never {
  throw new ClaimError('INVALID_REQUEST', 400, message);
}
export function validateCreateClaim(value: unknown): CreateClaimDto {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return invalid('Expected a title and description object.');
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).some((key) => key !== 'title' && key !== 'description')
  )
    return invalid('Only title and description are accepted.');
  const text = (field: string, maximum: number): string => {
    const input = record[field];
    if (typeof input !== 'string' || !input.trim() || input.length > maximum)
      return invalid(
        `${field} must be nonempty text of at most ${maximum} characters.`,
      );
    return input.trim();
  };
  return { title: text('title', 120), description: text('description', 2000) };
}
export function validatePagination(
  limit: number = 50,
  offset: number = 0,
): { limit: number; offset: number } {
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  )
    return invalid(
      'limit must be 1–100 and offset must be a nonnegative safe integer.',
    );
  return { limit, offset };
}
export function parseClaimQuery(value: unknown): {
  limit: number;
  offset: number;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return invalid('Invalid pagination query.');
  const query = value as Record<string, unknown>;
  if (Object.keys(query).some((key) => key !== 'limit' && key !== 'offset'))
    return invalid('Only limit and offset query parameters are accepted.');
  const number = (key: string, fallback: number): number => {
    const input = query[key];
    if (input === undefined) return fallback;
    if (typeof input !== 'string' || !/^(0|[1-9][0-9]{0,15})$/.test(input))
      return invalid(`Invalid ${key}.`);
    return Number(input);
  };
  return validatePagination(number('limit', 50), number('offset', 0));
}
