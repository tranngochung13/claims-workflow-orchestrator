import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import type { WorkflowDefinition } from './workflow.types.js';

export class WorkflowConfigurationError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Workflow configuration invalid: ${issues.slice(0, 20).join('; ')}`);
    this.name = 'WorkflowConfigurationError';
  }
}

// Relative to this module in both src/workflow and dist/workflow.
const schema: unknown = JSON.parse(
  readFileSync(
    new URL('../../config/workflow.schema.json', import.meta.url),
    'utf8',
  ),
);
const ajv = new Ajv({
  strict: true,
  allErrors: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
});
if (typeof schema !== 'object' || schema === null)
  throw new Error('Workflow schema must be an object');
const validate = ajv.compile<WorkflowDefinition>(schema);

function freezeDeep(value: unknown): void {
  if (typeof value !== 'object' || value === null) return;
  for (const child of Object.values(value)) freezeDeep(child);
  Object.freeze(value);
}

export function validateWorkflowDefinition(value: unknown): WorkflowDefinition {
  if (!validate(value)) {
    throw new WorkflowConfigurationError(
      (validate.errors ?? []).slice(0, 20).map((error) => {
        const missing: unknown = error.params.missingProperty;
        const path = `${error.instancePath}${typeof missing === 'string' ? `/${missing}` : ''}`;
        return `${(path || '/').slice(0, 200)}: ${error.message ?? 'invalid value'}`;
      }),
    );
  }
  const issues: string[] = [];
  const states = new Map(value.states.map((state) => [state.id, state]));
  function unique(ids: readonly string[], path: string, key = 'id'): void {
    const seen = new Set<string>();
    ids.forEach((id, index) => {
      if (seen.has(id))
        issues.push(`${path}/${index}/${key}: duplicate identifier`);
      seen.add(id);
    });
  }
  unique(
    value.states.map((state) => state.id),
    '/states',
  );
  unique(
    value.transitions.map((transition) => transition.id),
    '/transitions',
  );
  if (!states.has(value.initialState))
    issues.push('/initialState: unknown state');
  if (states.get(value.initialState)?.terminal)
    issues.push('/initialState: must not be terminal');
  value.transitions.forEach((transition, index) => {
    const path = `/transitions/${index}`;
    if (!states.has(transition.from))
      issues.push(`${path}/from: unknown state`);
    if (!states.has(transition.to)) issues.push(`${path}/to: unknown state`);
    if (states.get(transition.from)?.terminal)
      issues.push(`${path}/from: terminal state has outgoing transition`);
    unique(
      transition.inputFields.map((field) => field.name),
      `${path}/inputFields`,
      'name',
    );
    transition.inputFields.forEach((field, fieldIndex) => {
      if (field.minLength > field.maxLength)
        issues.push(
          `${path}/inputFields/${fieldIndex}: minLength exceeds maxLength`,
        );
      if (field.required && field.minLength < 1)
        issues.push(
          `${path}/inputFields/${fieldIndex}/minLength: required input must be nonempty`,
        );
    });
  });
  const reached = new Set<string>([value.initialState]);
  const pending = [value.initialState];
  while (pending.length) {
    const current = pending.pop();
    for (const transition of value.transitions) {
      if (transition.from === current && !reached.has(transition.to)) {
        reached.add(transition.to);
        pending.push(transition.to);
      }
    }
  }
  value.states.forEach((state, index) => {
    if (!reached.has(state.id))
      issues.push(`/states/${index}: unreachable from initialState`);
  });
  if (issues.length) throw new WorkflowConfigurationError(issues.slice(0, 20));
  // Copy before freezing so callers retain ownership of their input objects.
  const definition = structuredClone(value);
  freezeDeep(definition);
  return definition;
}
