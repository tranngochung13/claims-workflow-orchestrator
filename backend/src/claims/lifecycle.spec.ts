import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import {
  WorkflowConfigService,
  LEGACY_WORKFLOW_PATH,
} from '../workflow/workflow-config.service.js';
import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
import { ClaimService } from './claim.service.js';
import { TransitionService } from './transition.service.js';
import { ClaimWorkflowReadService } from './claim-workflow-read.service.js';
import { resolveDemoActor } from './claim-access.js';
const owner = resolveDemoActor('claimant-1');
const adjuster = resolveDemoActor('adjuster-1');
let db: DatabaseService;
let claims: ClaimService;
let engine: TransitionService;
let reads: ClaimWorkflowReadService;
let id: string;
let revision: number;
const command = (
  transitionId: string,
  expectedRevision: number,
  input = {},
) => ({ transitionId, expectedRevision, input, commandId: randomUUID() });
function execute(transition: string, input = {}, actor = adjuster) {
  const result = engine.execute(
    id,
    command(transition, revision, input),
    actor,
  );
  revision = result.claim.revision;
  return result;
}
function assessment() {
  execute('submit', {}, owner);
  execute('verify_documents');
  execute('start_assessment');
}
function snapshot() {
  return [
    'claims',
    'transition_events',
    'notifications',
    'payment_initiations',
    'command_receipts',
  ].map((table) =>
    db.connection.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
  );
}
beforeEach(() => {
  db = new DatabaseService(':memory:');
  const config = new WorkflowConfigService();
  const registry = new WorkflowRegistryService(db);
  registry.register(config.definition);
  claims = new ClaimService(db, registry, config);
  engine = new TransitionService(db, claims);
  reads = new ClaimWorkflowReadService(db, claims);
  id = claims.create(
    { title: 'Damage', description: 'Damaged screen' },
    owner,
  ).id;
  revision = 0;
});
afterEach(() => db.close());
it('runs the complete happy path and exposes payment and closure through discovery', () => {
  assessment();
  execute('approve');
  expect(reads.availableTransitions(id, adjuster).transitions).toMatchObject([
    { id: 'initiate_payment', eligible: true },
  ]);
  expect(execute('initiate_payment').claim.state).toBe('payment_initiated');
  expect(reads.availableTransitions(id, adjuster).transitions).toMatchObject([
    { id: 'close_paid', eligible: true },
  ]);
  expect(execute('close_paid').claim).toMatchObject({
    state: 'closed',
    revision: 6,
    workflowVersion: 2,
  });
  expect(reads.audit(id, owner).items.map((e) => e.toState)).toEqual([
    'submitted',
    'documents_verified',
    'under_assessment',
    'approved',
    'payment_initiated',
    'closed',
  ]);
  expect(
    db.connection.prepare('SELECT count(*) n FROM payment_initiations').get(),
  ).toEqual({ n: 1 });
});
it('closes rejection without initiating payment and keeps the required reason', () => {
  assessment();
  const before = snapshot();
  expect(() => execute('reject')).toThrow(
    expect.objectContaining({ code: 'INVALID_REQUEST' }),
  );
  expect(snapshot()).toEqual(before);
  execute('reject', { reason: 'Not covered' });
  expect(execute('close_rejected').claim.state).toBe('closed');
  expect(
    db.connection.prepare('SELECT * FROM payment_initiations').all(),
  ).toEqual([]);
});
it('returns information to documents verification before assessment and completes closure', () => {
  assessment();
  execute('request_information', { message: 'Receipt?' });
  expect(
    execute('provide_information', { response: 'Attached' }, owner).claim.state,
  ).toBe('documents_verified');
  execute('start_assessment');
  execute('approve');
  execute('initiate_payment');
  expect(execute('close_paid').claim).toMatchObject({
    state: 'closed',
    informationRequestCount: 1,
    revision: 9,
  });
});
it('enforces three requests across repeated document verification and assessment', () => {
  assessment();
  for (let i = 0; i < 3; i++) {
    execute('request_information', { message: 'More?' });
    execute('provide_information', { response: 'Details' }, owner);
    execute('start_assessment');
  }
  const before = snapshot();
  expect(() => execute('request_information', { message: 'Fourth' })).toThrow(
    expect.objectContaining({ code: 'CYCLE_LIMIT_REACHED' }),
  );
  expect(snapshot()).toEqual(before);
});
it('rejects direct submitted approval, cross-owner access and claimant payment/closure', () => {
  execute('submit', {}, owner);
  expect(() => execute('approve')).toThrow(
    expect.objectContaining({ code: 'STATE_CONFLICT' }),
  );
  execute('verify_documents');
  execute('start_assessment');
  execute('approve');
  const before = snapshot();
  expect(() => execute('initiate_payment', {}, owner)).toThrow(
    expect.objectContaining({ code: 'TRANSITION_FORBIDDEN' }),
  );
  expect(() =>
    execute('initiate_payment', {}, resolveDemoActor('claimant-2')),
  ).toThrow(expect.objectContaining({ code: 'CLAIM_NOT_FOUND' }));
  expect(snapshot()).toEqual(before);
  execute('initiate_payment');
  expect(() => execute('close_paid', {}, owner)).toThrow(
    expect.objectContaining({ code: 'TRANSITION_FORBIDDEN' }),
  );
});
it('deduplicates payment and closure even after closure and rejects stale or changed commands', () => {
  assessment();
  execute('approve');
  const payment = command('initiate_payment', revision);
  const result = engine.execute(id, payment, adjuster);
  revision++;
  expect(engine.execute(id, payment, adjuster)).toEqual(result);
  const close = command('close_paid', revision);
  const closed = engine.execute(id, close, adjuster);
  revision++;
  const before = snapshot();
  expect(engine.execute(id, close, adjuster)).toEqual(closed);
  expect(engine.execute(id, payment, adjuster)).toEqual(result);
  expect(() =>
    engine.execute(id, { ...payment, expectedRevision: revision }, adjuster),
  ).toThrow(expect.objectContaining({ code: 'COMMAND_ID_REUSED' }));
  expect(() =>
    engine.execute(id, command('close_paid', revision - 1), adjuster),
  ).toThrow(expect.objectContaining({ code: 'REVISION_CONFLICT' }));
  expect(snapshot()).toEqual(before);
});
it('treats closed as terminal and rejects every configured transition', () => {
  assessment();
  execute('approve');
  execute('initiate_payment');
  execute('close_paid');
  expect(reads.availableTransitions(id, adjuster).transitions).toEqual([]);
  const before = snapshot();
  for (const transition of new WorkflowConfigService().definition.transitions) {
    const actor = transition.roles.includes('adjuster') ? adjuster : owner;
    expect(() => execute(transition.id, {}, actor)).toThrow(
      expect.objectContaining({ code: 'STATE_CONFLICT' }),
    );
  }
  expect(snapshot()).toEqual(before);
});
it.each(['transition_events', 'payment_initiations', 'command_receipts'])(
  'rolls back payment, state, revision, audit and receipts when %s fails',
  (table) => {
    assessment();
    execute('approve');
    db.connection.exec(
      `CREATE TRIGGER fail_payment BEFORE INSERT ON ${table} BEGIN SELECT RAISE(ABORT, 'injected'); END`,
    );
    const before = snapshot();
    expect(() => execute('initiate_payment')).toThrow(
      expect.objectContaining({ code: 'TRANSITION_STORAGE_FAILED' }),
    );
    expect(snapshot()).toEqual(before);
  },
);
it('protects payment records against update/delete and preserves version-one pins', () => {
  assessment();
  execute('approve');
  execute('initiate_payment');
  expect(() =>
    db.connection.exec("UPDATE payment_initiations SET created_at='changed'"),
  ).toThrow('immutable');
  expect(() => db.connection.exec('DELETE FROM payment_initiations')).toThrow(
    'immutable',
  );
  const legacy = new WorkflowConfigService(LEGACY_WORKFLOW_PATH);
  const registry = new WorkflowRegistryService(db);
  registry.register(legacy.definition);
  const oldClaims = new ClaimService(db, registry, legacy);
  const old = oldClaims.create(
    { title: 'Old', description: 'Existing version' },
    owner,
  );
  expect(claims.resolveWorkflow(old.id, owner).definition).toEqual(
    legacy.definition,
  );
  expect(reads.availableTransitions(old.id, owner).transitions[0].id).toBe(
    'submit',
  );
  expect(old.workflowVersion).toBe(1);
});

it('rolls back closure when receipt persistence fails', () => {
  assessment();
  execute('approve');
  execute('initiate_payment');
  db.connection.exec(
    "CREATE TRIGGER fail_closure BEFORE INSERT ON command_receipts BEGIN SELECT RAISE(ABORT, 'injected'); END",
  );
  const before = snapshot();
  expect(() => execute('close_paid')).toThrow(
    expect.objectContaining({ code: 'TRANSITION_STORAGE_FAILED' }),
  );
  expect(snapshot()).toEqual(before);
});
