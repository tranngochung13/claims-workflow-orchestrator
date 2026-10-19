import { randomUUID } from 'node:crypto';
import { transitionConstraintFailure } from './transition-eligibility.js';
import { DatabaseService } from '../database/database.service.js';
import type {
  TransitionDefinition,
  NotificationTemplate,
} from '../workflow/workflow.types.js';
import { ClaimService } from './claim.service.js';
import { requireVerifiedActor } from './claim-access.js';
import type { VerifiedActor } from './claim-access.js';
import { ClaimError } from './claim.types.js';
import {
  transitionFingerprint,
  validateTransitionCommand,
} from './transition-command.js';
import type {
  TransitionCommand,
  TransitionResult,
} from './transition-command.js';

interface Receipt {
  actor_id: string;
  claim_id: string;
  fingerprint: string;
  result_json: string;
}
const templates: Record<
  NotificationTemplate,
  (input: Readonly<Record<string, string>>) => string
> = {
  information_requested: (input) =>
    `Information requested: ${input.message ?? ''}`,
  claim_approved: () => 'Claim approved.',
  claim_rejected: (input) => `Claim rejected: ${input.reason ?? ''}`,
};
function checkInput(
  transition: TransitionDefinition,
  command: TransitionCommand,
): void {
  const fields = new Map(
    transition.inputFields.map((field) => [field.name, field]),
  );
  if (Object.keys(command.input).some((key) => !fields.has(key)))
    throw new ClaimError(
      'INVALID_REQUEST',
      400,
      'Unknown transition input field.',
    );
  for (const field of transition.inputFields) {
    const text = Object.hasOwn(command.input, field.name)
      ? command.input[field.name]
      : undefined;
    if (text === undefined && !field.required) continue;
    if (
      text === undefined ||
      (field.required && !text) ||
      text.length < field.minLength ||
      text.length > field.maxLength
    )
      throw new ClaimError(
        'INVALID_REQUEST',
        400,
        `Invalid input for ${field.name}.`,
      );
  }
}
export class TransitionService {
  constructor(
    private readonly database: DatabaseService,
    private readonly claims: ClaimService,
  ) {}
  execute(
    claimId: string,
    input: unknown,
    identity: VerifiedActor,
  ): TransitionResult {
    const actor = requireVerifiedActor(identity);
    const command = validateTransitionCommand(input);
    try {
      return this.database.connection
        .transaction(() => {
          const claim = this.claims.get(claimId, actor);
          const workflow = this.claims.resolveWorkflow(
            claim.id,
            actor,
          ).definition;
          const fingerprint = transitionFingerprint(claim.id, command);
          const receipt = this.database.connection
            .prepare<[string], Receipt>(
              `SELECT e.actor_id, e.claim_id, r.fingerprint, r.result_json
          FROM command_receipts r JOIN transition_events e ON e.id=r.event_id WHERE r.command_id=?`,
            )
            .get(command.commandId);
          if (receipt) {
            if (
              receipt.actor_id !== actor.id ||
              receipt.claim_id !== claim.id ||
              receipt.fingerprint !== fingerprint
            )
              throw new ClaimError(
                'COMMAND_ID_REUSED',
                409,
                'Command ID was already used for a different request or actor.',
              );
            return this.readReceipt(receipt.result_json);
          }
          const transition = workflow.transitions.find(
            (item) => item.id === command.transitionId,
          );
          if (!transition)
            throw new ClaimError(
              'TRANSITION_NOT_FOUND',
              404,
              'Transition not found in pinned workflow.',
            );
          if (!transition.roles.includes(actor.role))
            throw new ClaimError(
              'TRANSITION_FORBIDDEN',
              403,
              'Transition is not permitted for this actor.',
            );
          if (claim.revision !== command.expectedRevision)
            throw new ClaimError(
              'REVISION_CONFLICT',
              409,
              'Claim changed. Refresh before retrying.',
            );
          if (claim.state !== transition.from)
            throw new ClaimError(
              'STATE_CONFLICT',
              409,
              'Transition is not available from the current state.',
            );
          checkInput(transition, command);
          const failure = transitionConstraintFailure(
            claim,
            transition,
            workflow.limits.informationRequests,
          );
          if (failure) throw new ClaimError(failure.code, 422, failure.message);
          const increment = transition.kind === 'information_request' ? 1 : 0;
          const timestamp = new Date().toISOString();
          const changed = this.database.connection
            .prepare(
              `UPDATE claims SET state=?, revision=revision+1, information_request_count=information_request_count+?, updated_at=?
          WHERE id=? AND revision=? AND state=? AND information_request_count=?`,
            )
            .run(
              transition.to,
              increment,
              timestamp,
              claim.id,
              command.expectedRevision,
              claim.state,
              claim.informationRequestCount,
            );
          if (changed.changes !== 1)
            throw new ClaimError(
              'REVISION_CONFLICT',
              409,
              'Claim changed. Refresh before retrying.',
            );
          const eventId = randomUUID();
          this.database.connection
            .prepare(
              `INSERT INTO transition_events (id, claim_id, actor_id, actor_role, transition_id, from_state, to_state, previous_revision, resulting_revision, input_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(
              eventId,
              claim.id,
              actor.id,
              actor.role,
              transition.id,
              claim.state,
              transition.to,
              claim.revision,
              claim.revision + 1,
              JSON.stringify(command.input),
              timestamp,
            );
          const notificationIds: string[] = [];
          transition.sideEffects.forEach((effect, index) => {
            if (effect.type === 'recordPaymentInitiation') {
              this.database.connection
                .prepare(
                  'INSERT INTO payment_initiations (event_id, claim_id, created_at) VALUES (?, ?, ?)',
                )
                .run(eventId, claim.id, timestamp);
              return;
            }
            const id = randomUUID();
            this.database.connection
              .prepare(
                `INSERT INTO notifications (id, event_id, effect_index, recipient_actor_id, template, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              )
              .run(
                id,
                eventId,
                index,
                claim.ownerActorId,
                effect.template,
                templates[effect.template](command.input),
                timestamp,
              );
            notificationIds.push(id);
          });
          const result: TransitionResult = Object.freeze({
            claim: this.claims.get(claim.id, actor),
            auditEventId: eventId,
            notificationIds: Object.freeze(notificationIds),
          });
          this.database.connection
            .prepare(
              'INSERT INTO command_receipts (command_id, event_id, fingerprint, result_json) VALUES (?, ?, ?, ?)',
            )
            .run(
              command.commandId,
              eventId,
              fingerprint,
              JSON.stringify(result),
            );
          return result;
        })
        .immediate();
    } catch (error) {
      if (error instanceof ClaimError) throw error;
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'SQLITE_BUSY'
      )
        throw new ClaimError(
          'STORAGE_BUSY',
          503,
          'Storage is busy. Retry the same command.',
        );
      throw new ClaimError(
        'TRANSITION_STORAGE_FAILED',
        500,
        'Unable to execute transition.',
      );
    }
  }
  private readReceipt(text: string): TransitionResult {
    const result: unknown = JSON.parse(text);
    if (
      !result ||
      typeof result !== 'object' ||
      !('claim' in result) ||
      !('auditEventId' in result) ||
      typeof result.auditEventId !== 'string' ||
      !('notificationIds' in result) ||
      !Array.isArray(result.notificationIds) ||
      !result.notificationIds.every((id: unknown) => typeof id === 'string')
    )
      throw new Error('Invalid receipt');
    const claim = result.claim;
    if (
      !claim ||
      typeof claim !== 'object' ||
      !('id' in claim) ||
      typeof claim.id !== 'string' ||
      !('ownerActorId' in claim) ||
      (claim.ownerActorId !== null && typeof claim.ownerActorId !== 'string') ||
      !('workflowId' in claim) ||
      typeof claim.workflowId !== 'string' ||
      !('workflowVersion' in claim) ||
      typeof claim.workflowVersion !== 'number' ||
      !Number.isSafeInteger(claim.workflowVersion) ||
      claim.workflowVersion < 1 ||
      !('state' in claim) ||
      typeof claim.state !== 'string' ||
      !('title' in claim) ||
      typeof claim.title !== 'string' ||
      !('description' in claim) ||
      typeof claim.description !== 'string' ||
      !('revision' in claim) ||
      typeof claim.revision !== 'number' ||
      !Number.isSafeInteger(claim.revision) ||
      claim.revision < 1 ||
      !('informationRequestCount' in claim) ||
      typeof claim.informationRequestCount !== 'number' ||
      !Number.isInteger(claim.informationRequestCount) ||
      claim.informationRequestCount < 0 ||
      claim.informationRequestCount > 3 ||
      !('createdAt' in claim) ||
      typeof claim.createdAt !== 'string' ||
      !('updatedAt' in claim) ||
      typeof claim.updatedAt !== 'string'
    )
      throw new Error('Invalid receipt claim');
    return Object.freeze({
      claim: Object.freeze({
        id: claim.id,
        ownerActorId: claim.ownerActorId,
        workflowId: claim.workflowId,
        workflowVersion: claim.workflowVersion,
        state: claim.state,
        title: claim.title,
        description: claim.description,
        revision: claim.revision,
        informationRequestCount: claim.informationRequestCount,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
      }),
      auditEventId: result.auditEventId,
      notificationIds: Object.freeze(result.notificationIds),
    });
  }
}
