import { createHash } from 'node:crypto';
import type { WorkflowDefinition } from './workflow.types.js';
import { parseWorkflowJson } from './workflow-config.service.js';
import { validateWorkflowDefinition } from './workflow-config.validator.js';
import { DatabaseService } from '../database/database.service.js';

export class WorkflowRegistryError extends Error {
  constructor(
    readonly code:
      | 'WORKFLOW_VERSION_CONFLICT'
      | 'WORKFLOW_VERSION_NOT_FOUND'
      | 'INVALID_PERSISTED_WORKFLOW'
      | 'WORKFLOW_STORAGE_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'WorkflowRegistryError';
  }
}
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const text = JSON.stringify(value);
    if (text === undefined) throw new Error('Unsupported JSON value');
    return text;
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(',')}}`;
}
export function canonicalWorkflowJson(definition: WorkflowDefinition): string {
  return canonical(definition);
}
export function workflowDigest(json: string): string {
  return createHash('sha256').update(json, 'utf8').digest('hex');
}

export interface RegisteredWorkflowVersion {
  readonly definition: WorkflowDefinition;
  readonly sha256: string;
  readonly registeredAt: string;
}
export class WorkflowRegistryService {
  constructor(private readonly database: DatabaseService) {}
  private decode(
    row: unknown,
    workflowId: string,
    version: number,
  ): RegisteredWorkflowVersion {
    try {
      if (
        typeof row !== 'object' ||
        row === null ||
        !('definition_json' in row) ||
        typeof row.definition_json !== 'string' ||
        !('definition_sha256' in row) ||
        typeof row.definition_sha256 !== 'string' ||
        !('schema_version' in row) ||
        !('workflow_id' in row) ||
        !('version' in row) ||
        !('registered_at' in row) ||
        typeof row.registered_at !== 'string'
      )
        throw new Error();
      const definition = parseWorkflowJson(row.definition_json);
      const json = canonicalWorkflowJson(definition);
      if (
        row.workflow_id !== workflowId ||
        row.version !== version ||
        definition.workflowId !== workflowId ||
        definition.version !== version ||
        row.schema_version !== definition.schemaVersion ||
        json !== row.definition_json ||
        workflowDigest(json) !== row.definition_sha256 ||
        !Number.isFinite(Date.parse(row.registered_at)) ||
        new Date(row.registered_at).toISOString() !== row.registered_at
      )
        throw new Error();
      return Object.freeze({
        definition,
        sha256: row.definition_sha256,
        registeredAt: row.registered_at,
      });
    } catch {
      throw new WorkflowRegistryError(
        'INVALID_PERSISTED_WORKFLOW',
        'Stored workflow version failed integrity validation.',
      );
    }
  }
  get(workflowId: string, version: number): RegisteredWorkflowVersion {
    try {
      const row = this.database.connection
        .prepare(
          'SELECT * FROM workflow_versions WHERE workflow_id = ? AND version = ?',
        )
        .get(workflowId, version);
      if (!row)
        throw new WorkflowRegistryError(
          'WORKFLOW_VERSION_NOT_FOUND',
          'Requested workflow version is not registered.',
        );
      return this.decode(row, workflowId, version);
    } catch (error) {
      if (error instanceof WorkflowRegistryError) throw error;
      throw new WorkflowRegistryError(
        'WORKFLOW_STORAGE_FAILED',
        'Unable to read workflow version.',
      );
    }
  }
  register(definition: WorkflowDefinition): RegisteredWorkflowVersion {
    // Reuse the exact Task 03 validator, including for future non-startup callers.
    const validated = validateWorkflowDefinition(definition);
    const json = canonicalWorkflowJson(validated);
    const digest = workflowDigest(json);
    try {
      return this.database.connection
        .transaction(() => {
          const row = this.database.connection
            .prepare(
              'SELECT * FROM workflow_versions WHERE workflow_id = ? AND version = ?',
            )
            .get(validated.workflowId, validated.version);
          if (row) {
            const stored = this.decode(
              row,
              validated.workflowId,
              validated.version,
            );
            if (
              stored.sha256 !== digest ||
              canonicalWorkflowJson(stored.definition) !== json
            ) {
              throw new WorkflowRegistryError(
                'WORKFLOW_VERSION_CONFLICT',
                'Workflow identity already exists with different content. Increment the workflow version.',
              );
            }
            return stored;
          }
          const registeredAt = new Date().toISOString();
          this.database.connection
            .prepare(
              'INSERT INTO workflow_versions (workflow_id, version, schema_version, definition_json, definition_sha256, registered_at) VALUES (?, ?, ?, ?, ?, ?)',
            )
            .run(
              validated.workflowId,
              validated.version,
              validated.schemaVersion,
              json,
              digest,
              registeredAt,
            );
          return Object.freeze({
            definition: validated,
            sha256: digest,
            registeredAt,
          });
        })
        .immediate();
    } catch (error) {
      if (error instanceof WorkflowRegistryError) throw error;
      throw new WorkflowRegistryError(
        'WORKFLOW_STORAGE_FAILED',
        'Unable to register workflow version.',
      );
    }
  }
}
