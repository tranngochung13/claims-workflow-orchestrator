import { randomUUID } from 'node:crypto';
import { authorizeClaimCreation, claimReadOwner } from './claim-access.js';
import type { VerifiedActor } from './claim-access.js';
import { DatabaseService } from '../database/database.service.js';
import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
import {
  WorkflowRegistryService,
  WorkflowRegistryError,
} from '../workflow/workflow-registry.service.js';
import type { RegisteredWorkflowVersion } from '../workflow/workflow-registry.service.js';
import {
  ClaimError,
  validateCreateClaim,
  validatePagination,
} from './claim.types.js';
import type { Claim, ClaimPage } from './claim.types.js';

const SELECT = `SELECT id, owner_actor_id AS ownerActorId, workflow_id AS workflowId, workflow_version AS workflowVersion,
  state, title, description, revision, information_request_count AS informationRequestCount, created_at AS createdAt, updated_at AS updatedAt FROM claims`;
export class ClaimService {
  constructor(
    private readonly database: DatabaseService,
    private readonly registry: WorkflowRegistryService,
    private readonly config: WorkflowConfigService,
  ) {}
  create(input: unknown, identity: VerifiedActor): Claim {
    const actor = authorizeClaimCreation(identity);
    const dto = validateCreateClaim(input);
    try {
      return this.database.connection
        .transaction(() => {
          const workflow = this.registry.get(
            this.config.definition.workflowId,
            this.config.definition.version,
          ).definition;
          const timestamp = new Date().toISOString();
          const claim: Claim = {
            id: randomUUID(),
            ownerActorId: actor.id,
            workflowId: workflow.workflowId,
            workflowVersion: workflow.version,
            state: workflow.initialState,
            title: dto.title,
            description: dto.description,
            revision: 0,
            informationRequestCount: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          this.database.connection
            .prepare(
              `INSERT INTO claims
          (id, owner_actor_id, workflow_id, workflow_version, state, title, description, revision, created_at, updated_at)
          VALUES (@id, @ownerActorId, @workflowId, @workflowVersion, @state, @title, @description, @revision, @createdAt, @updatedAt)`,
            )
            .run(claim);
          return this.get(claim.id, actor);
        })
        .immediate();
    } catch (error) {
      if (error instanceof WorkflowRegistryError)
        throw new ClaimError(
          'CLAIM_WORKFLOW_UNAVAILABLE',
          500,
          'Configured workflow is unavailable or invalid.',
        );
      throw new ClaimError(
        'CLAIM_STORAGE_FAILED',
        500,
        'Unable to create claim.',
      );
    }
  }
  get(id: string, actor: VerifiedActor): Claim {
    const owner = claimReadOwner(actor);
    if (
      typeof id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    )
      throw new ClaimError('CLAIM_NOT_FOUND', 404, 'Claim not found.');
    try {
      const claim =
        owner === null
          ? this.database.connection
              .prepare<[string], Claim>(`${SELECT} WHERE id = ?`)
              .get(id)
          : this.database.connection
              .prepare<[string, string], Claim>(
                `${SELECT} WHERE id = ? AND owner_actor_id = ?`,
              )
              .get(id, owner);
      if (!claim)
        throw new ClaimError('CLAIM_NOT_FOUND', 404, 'Claim not found.');
      return Object.freeze(claim);
    } catch (error) {
      if (error instanceof ClaimError) throw error;
      throw new ClaimError(
        'CLAIM_STORAGE_FAILED',
        500,
        'Unable to retrieve claim.',
      );
    }
  }
  list(actor: VerifiedActor, limit = 50, offset = 0): ClaimPage {
    const owner = claimReadOwner(actor);
    validatePagination(limit, offset);
    try {
      const items =
        owner === null
          ? this.database.connection
              .prepare<[number, number], Claim>(
                `${SELECT} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
              )
              .all(limit, offset)
          : this.database.connection
              .prepare<[string, number, number], Claim>(
                `${SELECT} WHERE owner_actor_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
              )
              .all(owner, limit, offset);
      return Object.freeze({
        items: Object.freeze(items.map((item) => Object.freeze(item))),
        limit,
        offset,
      });
    } catch {
      throw new ClaimError(
        'CLAIM_STORAGE_FAILED',
        500,
        'Unable to list claims.',
      );
    }
  }
  resolveWorkflow(id: string, actor: VerifiedActor): RegisteredWorkflowVersion {
    const claim = this.get(id, actor);
    try {
      return this.registry.get(claim.workflowId, claim.workflowVersion);
    } catch {
      throw new ClaimError(
        'CLAIM_WORKFLOW_UNAVAILABLE',
        500,
        'Pinned workflow is unavailable or invalid.',
      );
    }
  }
}
