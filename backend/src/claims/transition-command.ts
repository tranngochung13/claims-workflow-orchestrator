import { createHash } from 'node:crypto';
import { ClaimError } from './claim.types.js';
import type { Claim } from './claim.types.js';
export interface TransitionCommand {
  readonly commandId: string;
  readonly transitionId: string;
  readonly expectedRevision: number;
  readonly input: Readonly<Record<string, string>>;
}
export interface TransitionResult {
  readonly claim: Claim;
  readonly auditEventId: string;
  readonly notificationIds: readonly string[];
}
function invalid(message: string): never {
  throw new ClaimError('INVALID_REQUEST', 400, message);
}
export function validateTransitionCommand(value: unknown): TransitionCommand {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return invalid('Expected a transition command object.');
  const record = value as Record<string, unknown>;
  if (
    ['commandId', 'transitionId', 'expectedRevision', 'input'].some(
      (key) => !Object.hasOwn(record, key),
    )
  )
    return invalid('Missing required transition command field.');
  if (
    Object.keys(record).some(
      (key) =>
        !['commandId', 'transitionId', 'expectedRevision', 'input'].includes(
          key,
        ),
    )
  )
    return invalid('Unknown transition command field.');
  if (
    typeof record.commandId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      record.commandId,
    )
  )
    return invalid('commandId must be a UUID v4.');
  if (
    typeof record.transitionId !== 'string' ||
    !/^[a-z][a-z0-9_]{0,63}$/.test(record.transitionId)
  )
    return invalid('Invalid transitionId.');
  if (
    typeof record.expectedRevision !== 'number' ||
    !Number.isSafeInteger(record.expectedRevision) ||
    record.expectedRevision < 0 ||
    record.expectedRevision >= Number.MAX_SAFE_INTEGER
  )
    return invalid(
      'expectedRevision must be a nonnegative safe integer below the maximum.',
    );
  const input = record.input;
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).length > 20
  )
    return invalid('input must be an object with at most 20 text fields.');
  const entries = Object.entries(input);
  const normalized: [string, string][] = [];
  for (const [key, text] of entries) {
    if (
      !/^[a-z][a-z0-9_]{0,63}$/.test(key) ||
      typeof text !== 'string' ||
      text.length > 2000
    )
      return invalid('Invalid transition input field.');
    normalized.push([key, text.trim()]);
  }
  return Object.freeze({
    commandId: record.commandId.toLowerCase(),
    transitionId: record.transitionId,
    expectedRevision: record.expectedRevision,
    input: Object.freeze(Object.fromEntries(normalized)),
  });
}
export function transitionFingerprint(
  claimId: string,
  command: TransitionCommand,
): string {
  const text = JSON.stringify([
    claimId,
    command.transitionId,
    command.expectedRevision,
    Object.entries(command.input).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    ),
  ]);
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
