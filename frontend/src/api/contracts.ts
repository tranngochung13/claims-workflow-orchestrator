export type DemoActorId = "claimant-1" | "claimant-2" | "adjuster-1";
export interface Claim {
  id: string;
  ownerActorId: string | null;
  workflowId: string;
  workflowVersion: number;
  state: string;
  title: string;
  description: string;
  revision: number;
  informationRequestCount: number;
  createdAt: string;
  updatedAt: string;
}
export interface Page<T> {
  items: T[];
  limit: number;
  offset: number;
}
export interface InputField {
  name: string;
  label: string;
  required: boolean;
  minLength: number;
  maxLength: number;
}
export interface Action {
  id: string;
  label: string;
  from: string;
  to: string;
  eligible: boolean;
  reasonCode: string | null;
  inputFields: InputField[];
}
export interface Discovery {
  claimId: string;
  workflowId: string;
  workflowVersion: number;
  state: string;
  revision: number;
  informationRequestCount: number;
  informationRequestLimit: number;
  transitions: Action[];
}
export interface AuditEvent {
  id: string;
  transitionId: string;
  actor: { id: string; role: "claimant" | "adjuster" };
  fromState: string;
  toState: string;
  previousRevision: number;
  resultingRevision: number;
  createdAt: string;
}
export interface AuditPage extends Page<AuditEvent> {
  claimId: string;
  workflowId: string;
  workflowVersion: number;
}
export interface TransitionCommand {
  transitionId: string;
  expectedRevision: number;
  commandId: string;
  input: Record<string, string>;
}
export interface TransitionResult {
  claim: Claim;
  auditEventId: string;
  notificationIds: string[];
}
