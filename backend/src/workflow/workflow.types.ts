export type ActorRole = 'claimant' | 'adjuster';
export type ClaimField = 'title' | 'description';
export type NotificationTemplate =
  'information_requested' | 'claim_approved' | 'claim_rejected';
export interface StateDefinition {
  readonly id: string;
  readonly label: string;
  readonly terminal: boolean;
}
export interface InputFieldDefinition {
  readonly name: string;
  readonly label: string;
  readonly required: boolean;
  readonly minLength: number;
  readonly maxLength: number;
}
export interface ClaimFieldsPresentCondition {
  readonly type: 'claimFieldsPresent';
  readonly fields: readonly ClaimField[];
}
export type PreconditionDefinition = ClaimFieldsPresentCondition;
export interface CreateNotificationEffect {
  readonly type: 'createNotification';
  readonly recipient: 'claimant';
  readonly template: NotificationTemplate;
}
export interface RecordPaymentInitiationEffect {
  readonly type: 'recordPaymentInitiation';
}
export type SideEffectDefinition =
  CreateNotificationEffect | RecordPaymentInitiationEffect;
export interface TransitionDefinition {
  readonly id: string;
  readonly label: string;
  readonly from: string;
  readonly to: string;
  readonly roles: readonly ActorRole[];
  readonly kind?: 'information_request';
  readonly inputFields: readonly InputFieldDefinition[];
  readonly preconditions: readonly PreconditionDefinition[];
  readonly sideEffects: readonly SideEffectDefinition[];
}
export interface WorkflowDefinition {
  readonly schemaVersion: 1;
  readonly workflowId: string;
  readonly version: number;
  readonly initialState: string;
  readonly limits: { readonly informationRequests: number };
  readonly states: readonly StateDefinition[];
  readonly transitions: readonly TransitionDefinition[];
}
