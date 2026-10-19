import type { Claim } from './claim.types.js';
import type { TransitionDefinition } from '../workflow/workflow.types.js';

export type TransitionConstraintCode =
  | 'PRECONDITION_FAILED'
  | 'CYCLE_LIMIT_REACHED'
  | 'NOTIFICATION_RECIPIENT_UNAVAILABLE';
export interface TransitionConstraintFailure {
  readonly code: TransitionConstraintCode;
  readonly message: string;
}
/** Read-only checks supported by the current schema, shared with execution. */
export function transitionConstraintFailure(
  claim: Claim,
  transition: TransitionDefinition,
  informationRequestLimit: number,
): TransitionConstraintFailure | null {
  for (const condition of transition.preconditions) {
    if (condition.fields.some((field) => !claim[field].trim())) {
      return {
        code: 'PRECONDITION_FAILED',
        message: 'Required claim fields are missing.',
      };
    }
  }
  if (
    transition.kind === 'information_request' &&
    claim.informationRequestCount >= Math.min(3, informationRequestLimit)
  ) {
    return {
      code: 'CYCLE_LIMIT_REACHED',
      message: 'Information-request limit reached.',
    };
  }
  if (
    transition.sideEffects.some(
      (effect) => effect.type === 'createNotification',
    ) &&
    claim.ownerActorId === null
  ) {
    return {
      code: 'NOTIFICATION_RECIPIENT_UNAVAILABLE',
      message: 'Claim has no notification recipient.',
    };
  }
  return null;
}
