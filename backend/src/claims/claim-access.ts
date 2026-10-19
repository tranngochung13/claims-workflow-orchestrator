import type { ActorRole } from '../workflow/workflow.types.js';
import { ClaimError } from './claim.types.js';

const verified = Symbol('verified-demo-actor');
export interface VerifiedActor {
  readonly id: string;
  readonly role: ActorRole;
  readonly [verified]: true;
}
const actors = new Map<string, VerifiedActor>();
const trusted = new WeakSet<object>();
for (const [id, role] of [
  ['claimant-1', 'claimant'],
  ['claimant-2', 'claimant'],
  ['adjuster-1', 'adjuster'],
] as const) {
  const actor: VerifiedActor = Object.freeze({
    id,
    role,
    [verified]: true as const,
  });
  actors.set(id, actor);
  trusted.add(actor);
}
export function resolveDemoActor(id: unknown): VerifiedActor {
  const actor = typeof id === 'string' ? actors.get(id) : undefined;
  if (!actor)
    throw new ClaimError(
      'IDENTITY_REQUIRED',
      401,
      'Select a backend-allowlisted demo actor.',
    );
  return actor;
}
export function requireVerifiedActor(actor: unknown): VerifiedActor {
  if (typeof actor !== 'object' || actor === null || !trusted.has(actor)) {
    throw new ClaimError(
      'IDENTITY_REQUIRED',
      401,
      'Verified actor identity is required.',
    );
  }
  // Re-identify only after proving reference membership; no client object is trusted.
  for (const candidate of actors.values())
    if (candidate === actor) return candidate;
  throw new ClaimError(
    'IDENTITY_REQUIRED',
    401,
    'Verified actor identity is required.',
  );
}
export function authorizeClaimCreation(value: unknown): VerifiedActor {
  const actor = requireVerifiedActor(value);
  if (actor.role !== 'claimant')
    throw new ClaimError(
      'CLAIM_CREATION_FORBIDDEN',
      403,
      'Claim creation is not permitted.',
    );
  return actor;
}
/** null means all claims for adjusters; otherwise filter to this exact owner. */
export function claimReadOwner(value: unknown): string | null {
  const actor = requireVerifiedActor(value);
  return actor.role === 'adjuster' ? null : actor.id;
}
