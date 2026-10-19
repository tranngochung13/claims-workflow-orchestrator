import { readFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import { WorkflowModule } from './workflow.module.js';
import {
  WorkflowConfigService,
  LEGACY_WORKFLOW_PATH as DEFAULT_WORKFLOW_PATH,
  loadWorkflowDefinition,
  parseWorkflowJson,
} from './workflow-config.service.js';
import { validateWorkflowDefinition } from './workflow-config.validator.js';
const fixture = () => structuredClone(loadWorkflowDefinition(new URL('../../config/claims.v1.json', import.meta.url)));
function raw(): Record<string, unknown> {
  return JSON.parse(readFileSync(DEFAULT_WORKFLOW_PATH, 'utf8')) as Record<
    string,
    unknown
  >;
}
describe('workflow configuration', () => {
  it('accepts the complete initial workflow', () => {
    const value = loadWorkflowDefinition(new URL('../../config/claims.v1.json', import.meta.url));
    expect(value.workflowId).toBe('claims');
    expect(value.states).toHaveLength(6);
    expect(value.transitions).toHaveLength(6);
    expect(value.limits.informationRequests).toBe(3);
    expect(value.transitions[2].kind).toBe('information_request');
    expect(value.transitions[2].inputFields[0]).toMatchObject({
      name: 'message',
      required: true,
      minLength: 1,
    });
    expect(value.transitions[2].sideEffects[0]).toMatchObject({
      recipient: 'claimant',
      template: 'information_requested',
    });
  });
  it('rejects malformed JSON', () => {
    expect(() => parseWorkflowJson('{"secret":')).toThrow('malformed JSON');
  });
  it('rejects missing required properties with a path', () => {
    const value = raw();
    delete value.initialState;
    expect(() => validateWorkflowDefinition(value)).toThrow('/initialState');
  });
  it('rejects unknown root properties', () => {
    expect(() =>
      validateWorkflowDefinition({ ...raw(), execute: 'bad' }),
    ).toThrow('additional properties');
  });
  it('rejects counter overrides in transitions', () => {
    const value = fixture();
    expect(() =>
      validateWorkflowDefinition({
        ...value,
        transitions: [{ ...value.transitions[2], informationRequestLimit: 99 }],
      }),
    ).toThrow('additional properties');
  });
  it('rejects duplicate states', () => {
    const value = fixture();
    expect(() =>
      validateWorkflowDefinition({
        ...value,
        states: [...value.states, value.states[0]],
      }),
    ).toThrow('duplicate identifier');
  });
  it('rejects duplicate transitions', () => {
    const value = fixture();
    expect(() =>
      validateWorkflowDefinition({
        ...value,
        transitions: [...value.transitions, value.transitions[0]],
      }),
    ).toThrow('duplicate identifier');
  });
  it.each(['from', 'to'] as const)('rejects unknown %s', (field) => {
    const value = fixture();
    expect(() =>
      validateWorkflowDefinition({
        ...value,
        transitions: [{ ...value.transitions[0], [field]: 'missing' }],
      }),
    ).toThrow(`/${field}: unknown state`);
  });
  it('rejects unknown initial state', () => {
    expect(() =>
      validateWorkflowDefinition({ ...fixture(), initialState: 'missing' }),
    ).toThrow('/initialState: unknown state');
  });
  it('rejects terminal initial state', () => {
    expect(() =>
      validateWorkflowDefinition({ ...fixture(), initialState: 'approved' }),
    ).toThrow('must not be terminal');
  });
  it('rejects terminal outgoing transitions', () => {
    const value = fixture();
    expect(() =>
      validateWorkflowDefinition({
        ...value,
        transitions: [
          ...value.transitions,
          { ...value.transitions[0], id: 'reopen', from: 'approved' },
        ],
      }),
    ).toThrow('terminal state has outgoing');
  });
  it('rejects unreachable states', () => {
    const value = fixture();
    expect(() =>
      validateWorkflowDefinition({
        ...value,
        states: [
          ...value.states,
          { id: 'orphan', label: 'Orphan', terminal: false },
        ],
      }),
    ).toThrow('unreachable');
  });
  it.each([
    ['role', { roles: ['admin'] }],
    ['empty roles', { roles: [] }],
    [
      'condition',
      { preconditions: [{ type: 'eval', expression: 'anything' }] },
    ],
    [
      'claim field',
      { preconditions: [{ type: 'claimFieldsPresent', fields: ['password'] }] },
    ],
    ['effect', { sideEffects: [{ type: 'sendEmail' }] }],
    [
      'template',
      {
        sideEffects: [
          {
            type: 'createNotification',
            recipient: 'claimant',
            template: 'unknown',
          },
        ],
      },
    ],
    [
      'recipient',
      {
        sideEffects: [
          {
            type: 'createNotification',
            recipient: 'https://example.com',
            template: 'claim_approved',
          },
        ],
      },
    ],
    [
      'missing effect properties',
      { sideEffects: [{ type: 'createNotification' }] },
    ],
    ['kind', { kind: 'custom_counter' }],
  ])('rejects unsupported %s', (_name, change) => {
    const value = fixture();
    expect(() =>
      validateWorkflowDefinition({
        ...value,
        transitions: [{ ...value.transitions[0], ...change }],
      }),
    ).toThrow('Workflow configuration invalid');
  });
  it.each([0, 4, 1.5, '3'])('rejects limit %s without coercion', (limit) => {
    expect(() =>
      validateWorkflowDefinition({
        ...fixture(),
        limits: { informationRequests: limit },
      }),
    ).toThrow('/limits/informationRequests');
  });
  it('accepts configuration-only extension', () => {
    const value = fixture();
    const result = validateWorkflowDefinition({
      ...value,
      states: [
        ...value.states,
        { id: 'escalated', label: 'Escalated', terminal: false },
      ],
      transitions: [
        ...value.transitions,
        {
          ...value.transitions[1],
          id: 'escalate',
          from: 'under_review',
          to: 'escalated',
        },
      ],
    });
    expect(result.states.at(-1)?.id).toBe('escalated');
    expect(result.transitions.at(-1)?.to).toBe('escalated');
  });
  it('deeply freezes loaded definitions', () => {
    const value = loadWorkflowDefinition(new URL('../../config/claims.v1.json', import.meta.url));
    expect(Object.isFrozen(value.transitions[2].sideEffects[0])).toBe(true);
    expect(Reflect.set(value.limits, 'informationRequests', 9)).toBe(false);
    expect(() => Array.prototype.push.call(value.states, {})).toThrow(
      TypeError,
    );
    expect(value.limits.informationRequests).toBe(3);
  });
  it('copies rather than freezing caller input', () => {
    const value = raw();
    const result = validateWorkflowDefinition(value);
    value.workflowId = 'changed';
    expect(result.workflowId).toBe('claims');
    expect(Object.isFrozen(value)).toBe(false);
  });
  it('reports missing file', () => {
    expect(() => loadWorkflowDefinition('/missing/workflow.json')).toThrow(
      'unable to read workflow file',
    );
  });
  it('loads configuration during Nest provider startup', async () => {
    const module = await Test.createTestingModule({
      imports: [WorkflowModule],
    }).compile();
    expect(module.get(WorkflowConfigService).definition.workflowId).toBe(
      'claims',
    );
    await module.close();
  });
  it('rejects duplicate input names', () => {
    const value = fixture();
    const field = value.transitions[2].inputFields[0];
    expect(() =>
      validateWorkflowDefinition({
        ...value,
        transitions: [{ ...value.transitions[2], inputFields: [field, field] }],
      }),
    ).toThrow('duplicate identifier');
  });
  it.each([
    { minLength: 20, maxLength: 10 },
    { minLength: 0 },
    { maxLength: 2001 },
    { label: '' },
  ])('rejects input bounds %j', (change) => {
    const value = fixture();
    expect(() =>
      validateWorkflowDefinition({
        ...value,
        transitions: [
          {
            ...value.transitions[2],
            inputFields: [
              { ...value.transitions[2].inputFields[0], ...change },
            ],
          },
        ],
      }),
    ).toThrow('Workflow configuration invalid');
  });
  it.each([
    { schemaVersion: 2 },
    { version: 0 },
    { workflowId: 'Invalid-ID' },
    { states: [] },
    { transitions: [] },
  ])('rejects root %j', (change) => {
    expect(() =>
      validateWorkflowDefinition({ ...fixture(), ...change }),
    ).toThrow('Workflow configuration invalid');
  });
  it('never inserts missing defaults or strips unknown properties', () => {
    const value = raw();
    delete value.limits;
    value.extra = true;
    expect(() => validateWorkflowDefinition(value)).toThrow(
      'Workflow configuration invalid',
    );
    expect(value).not.toHaveProperty('limits');
    expect(value.extra).toBe(true);
  });
  it('rejects oversized input', () => {
    expect(() => parseWorkflowJson(' '.repeat(1024 * 1024 + 1))).toThrow(
      'exceeds 1 MiB',
    );
  });
});
