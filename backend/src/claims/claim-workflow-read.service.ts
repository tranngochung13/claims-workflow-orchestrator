import { DatabaseService } from '../database/database.service.js';
import type { ActorRole } from '../workflow/workflow.types.js';
import { ClaimService } from './claim.service.js';
import { requireVerifiedActor } from './claim-access.js';
import type { VerifiedActor } from './claim-access.js';
import { ClaimError, validatePagination } from './claim.types.js';
import { transitionConstraintFailure } from './transition-eligibility.js';
import type {
  AvailableTransition,
  AvailableTransitions,
  ClaimAuditEvent,
  ClaimAuditPage,
} from './claim-workflow-read.types.js';

type AuditRow = Omit<ClaimAuditEvent, 'actor'> & {
  actorId: string;
  actorRole: ActorRole;
};
export class ClaimWorkflowReadService {
  constructor(
    private readonly database: DatabaseService,
    private readonly claims: ClaimService,
  ) {}
  availableTransitions(
    claimId: string,
    identity: VerifiedActor,
  ): AvailableTransitions {
    const actor = requireVerifiedActor(identity);
    try {
      // A deferred read transaction keeps claim and definition reads in one snapshot.
      return this.database.connection
        .transaction(() => {
          const claim = this.claims.get(claimId, actor);
          const workflow = this.claims.resolveWorkflow(
            claim.id,
            actor,
          ).definition;
          const transitions = workflow.transitions
            .filter((transition) => transition.from === claim.state)
            .map((transition): AvailableTransition => {
              const reasonCode = !transition.roles.includes(actor.role)
                ? 'TRANSITION_FORBIDDEN'
                : (transitionConstraintFailure(
                    claim,
                    transition,
                    workflow.limits.informationRequests,
                  )?.code ?? null);
              return Object.freeze({
                id: transition.id,
                label: transition.label,
                from: transition.from,
                to: transition.to,
                eligible: reasonCode === null,
                reasonCode,
                inputFields: transition.inputFields,
              });
            });
          return Object.freeze({
            claimId: claim.id,
            workflowId: claim.workflowId,
            workflowVersion: claim.workflowVersion,
            state: claim.state,
            revision: claim.revision,
            informationRequestCount: claim.informationRequestCount,
            informationRequestLimit: Math.min(
              3,
              workflow.limits.informationRequests,
            ),
            transitions: Object.freeze(transitions),
          });
        })
        .deferred();
    } catch (error) {
      if (error instanceof ClaimError) throw error;
      throw new ClaimError(
        'CLAIM_STORAGE_FAILED',
        500,
        'Unable to discover claim transitions.',
      );
    }
  }
  audit(
    claimId: string,
    identity: VerifiedActor,
    limit = 50,
    offset = 0,
  ): ClaimAuditPage {
    const actor = requireVerifiedActor(identity);
    validatePagination(limit, offset);
    try {
      return this.database.connection
        .transaction(() => {
          const claim = this.claims.get(claimId, actor);
          const rows = this.database.connection
            .prepare<[string, number, number], AuditRow>(
              `SELECT id, transition_id AS transitionId,
          actor_id AS actorId, actor_role AS actorRole, from_state AS fromState, to_state AS toState,
          previous_revision AS previousRevision, resulting_revision AS resultingRevision, created_at AS createdAt
          FROM transition_events WHERE claim_id = ? ORDER BY created_at ASC, resulting_revision ASC, id ASC LIMIT ? OFFSET ?`,
            )
            .all(claim.id, limit, offset);
          const items = rows.map(
            ({ actorId, actorRole, ...event }): ClaimAuditEvent =>
              Object.freeze({
                ...event,
                actor: Object.freeze({ id: actorId, role: actorRole }),
              }),
          );
          return Object.freeze({
            claimId: claim.id,
            workflowId: claim.workflowId,
            workflowVersion: claim.workflowVersion,
            items: Object.freeze(items),
            limit,
            offset,
          });
        })
        .deferred();
    } catch (error) {
      if (error instanceof ClaimError) throw error;
      throw new ClaimError(
        'CLAIM_STORAGE_FAILED',
        500,
        'Unable to read claim audit history.',
      );
    }
  }
}
