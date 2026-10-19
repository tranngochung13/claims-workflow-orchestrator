import { readFileSync } from 'node:fs';
import type { WorkflowDefinition } from './workflow.types.js';
import {
  validateWorkflowDefinition,
  WorkflowConfigurationError,
} from './workflow-config.validator.js';

export const LEGACY_WORKFLOW_PATH = new URL(
  '../../config/claims.v1.json',
  import.meta.url,
);
export const DEFAULT_WORKFLOW_PATH = new URL(
  '../../config/claims.v2.json',
  import.meta.url,
);
const MAX_CONFIG_BYTES = 1024 * 1024;

export function parseWorkflowJson(text: string): WorkflowDefinition {
  if (Buffer.byteLength(text, 'utf8') > MAX_CONFIG_BYTES) {
    throw new WorkflowConfigurationError(['/: configuration exceeds 1 MiB']);
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new WorkflowConfigurationError(['/: malformed JSON']);
  }
  return validateWorkflowDefinition(value);
}

export function loadWorkflowDefinition(
  path: string | URL = DEFAULT_WORKFLOW_PATH,
): WorkflowDefinition {
  let contents: string;
  try {
    contents = readFileSync(path, 'utf8');
  } catch {
    throw new WorkflowConfigurationError([
      '/: unable to read workflow file; ensure backend/config/claims.v2.json exists and is readable (or check the supplied path)',
    ]);
  }
  return parseWorkflowJson(contents);
}

export class WorkflowConfigService {
  readonly definition: WorkflowDefinition;
  constructor(path: string | URL = DEFAULT_WORKFLOW_PATH) {
    this.definition = loadWorkflowDefinition(path);
    Object.freeze(this);
  }
}
