import type {
  ActorRole,
  InputFieldDefinition,
} from '../workflow/workflow.types.js';
import type { TransitionConstraintCode } from './transition-eligibility.js';
export interface AvailableTransition {
  readonly id: string;
  readonly label: string;
  readonly from: string;
  readonly to: string;
  readonly eligible: boolean;
  readonly reasonCode: 'TRANSITION_FORBIDDEN' | TransitionConstraintCode | null;
  readonly inputFields: readonly InputFieldDefinition[];
}
export interface AvailableTransitions {
  readonly claimId: string;
  readonly workflowId: string;
  readonly workflowVersion: number;
  readonly state: string;
  readonly revision: number;
  readonly informationRequestCount: number;
  readonly informationRequestLimit: number;
  readonly transitions: readonly AvailableTransition[];
}
export interface ClaimAuditEvent {
  readonly id: string;
  readonly transitionId: string;
  readonly actor: { readonly id: string; readonly role: ActorRole };
  readonly fromState: string;
  readonly toState: string;
  readonly previousRevision: number;
  readonly resultingRevision: number;
  readonly createdAt: string;
}
export interface ClaimAuditPage {
  readonly claimId: string;
  readonly workflowId: string;
  readonly workflowVersion: number;
  readonly items: readonly ClaimAuditEvent[];
  readonly limit: number;
  readonly offset: number;
}
