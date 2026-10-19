import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
import { ClaimService } from './claim.service.js';
import { ClaimWorkflowReadService } from './claim-workflow-read.service.js';
import { TransitionService } from './transition.service.js';
import { resolveDemoActor } from './claim-access.js';
const claimant = resolveDemoActor('claimant-1');
const other = resolveDemoActor('claimant-2');
const adjuster = resolveDemoActor('adjuster-1');
let directory: string;
let db: DatabaseService;
let claims: ClaimService;
let reads: ClaimWorkflowReadService;
let engine: TransitionService;
let config: WorkflowConfigService;
let registry: WorkflowRegistryService;
let id: string;
const command = (
  transitionId: string,
  expectedRevision: number,
  input: Record<string, string> = {},
) => ({ commandId: randomUUID(), transitionId, expectedRevision, input });
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'workflow-read-'));
  db = new DatabaseService(join(directory, 'test.sqlite'));
  registry = new WorkflowRegistryService(db);
  config = new WorkflowConfigService(
    new URL('../../config/claims.v1.json', import.meta.url),
  );
  registry.register(config.definition);
  claims = new ClaimService(db, registry, config);
  reads = new ClaimWorkflowReadService(db, claims);
  engine = new TransitionService(db, claims);
  id = claims.create(
    { title: 'Damage', description: 'Screen damaged in transit.' },
    claimant,
  ).id;
});
afterEach(() => {
  db?.close();
  vi.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});
function review() {
  engine.execute(id, command('submit', 0), claimant);
  engine.execute(id, command('start_review', 1), adjuster);
}
function snapshot() {
  return [
    'schema_migrations',
    'workflow_versions',
    'claims',
    'transition_events',
    'notifications',
    'command_receipts',
  ].map((table) =>
    db.connection.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
  );
}

describe('authorized action discovery', () => {
  it('returns the exact pinned claim snapshot and eligible claimant action', () => {
    expect(reads.availableTransitions(id, claimant)).toEqual({
      claimId: id,
      workflowId: 'claims',
      workflowVersion: 1,
      state: 'draft',
      revision: 0,
      informationRequestCount: 0,
      informationRequestLimit: 3,
      transitions: [
        {
          id: 'submit',
          label: 'Submit',
          from: 'draft',
          to: 'submitted',
          eligible: true,
          reasonCode: null,
          inputFields: [],
        },
      ],
    });
  });
  it('conceals cross-owner claims and missing claims with the same error', () => {
    for (const claimId of [id, randomUUID()])
      expect(() => reads.availableTransitions(claimId, other)).toThrow(
        expect.objectContaining({
          code: 'CLAIM_NOT_FOUND',
          status: 404,
          message: 'Claim not found.',
        }),
      );
  });
  it('includes disallowed current-state actions with a safe role reason', () => {
    expect(
      reads.availableTransitions(id, adjuster).transitions[0],
    ).toMatchObject({
      id: 'submit',
      eligible: false,
      reasonCode: 'TRANSITION_FORBIDDEN',
    });
  });
  it('only offers transitions whose source matches current state', () => {
    engine.execute(id, command('submit', 0), claimant);
    const result = reads.availableTransitions(id, adjuster);
    expect(result.transitions.map((item) => item.id)).toEqual(['start_review']);
    expect(result.transitions[0].eligible).toBe(true);
    expect(
      reads.availableTransitions(id, claimant).transitions[0].eligible,
    ).toBe(false);
  });
  it('reports claim precondition failures using the same constraint as execution', () => {
    db.connection
      .prepare('UPDATE claims SET description=? WHERE id=?')
      .run('\t', id);
    expect(
      reads.availableTransitions(id, claimant).transitions[0],
    ).toMatchObject({ eligible: false, reasonCode: 'PRECONDITION_FAILED' });
    expect(() => engine.execute(id, command('submit', 0), claimant)).toThrow(
      expect.objectContaining({ code: 'PRECONDITION_FAILED' }),
    );
  });
  it('provides required form metadata without requiring input during discovery', () => {
    review();
    const result = reads.availableTransitions(id, adjuster);
    expect(result.transitions.map((item) => item.id)).toEqual([
      'request_information',
      'approve',
      'reject',
    ]);
    expect(result.transitions[0]).toMatchObject({
      eligible: true,
      reasonCode: null,
      inputFields: [
        {
          name: 'message',
          label: 'Message',
          required: true,
          minLength: 1,
          maxLength: 2000,
        },
      ],
    });
    expect(result.transitions[2].inputFields[0].name).toBe('reason');
  });
  it('reflects all three cycles and only blocks another information request', () => {
    review();
    let revision = 2;
    for (let cycle = 0; cycle < 3; cycle++) {
      expect(
        reads
          .availableTransitions(id, adjuster)
          .transitions.find((item) => item.id === 'request_information')
          ?.eligible,
      ).toBe(true);
      engine.execute(
        id,
        command('request_information', revision++, { message: 'Details' }),
        adjuster,
      );
      engine.execute(
        id,
        command('provide_information', revision++, { response: 'Done' }),
        claimant,
      );
    }
    const result = reads.availableTransitions(id, adjuster);
    expect(result.informationRequestCount).toBe(3);
    expect(result.transitions[0]).toMatchObject({
      id: 'request_information',
      eligible: false,
      reasonCode: 'CYCLE_LIMIT_REACHED',
    });
    expect(result.transitions.slice(1).every((item) => item.eligible)).toBe(
      true,
    );
  });
  it('preserves version-one labels, roles and limits after a newer version is registered', () => {
    registry.register({
      ...config.definition,
      version: 2,
      limits: { informationRequests: 1 },
      transitions: config.definition.transitions.map((item) =>
        item.id === 'submit'
          ? { ...item, label: 'Changed', roles: ['adjuster'] }
          : item,
      ),
    });
    const result = reads.availableTransitions(id, claimant);
    expect(result.workflowVersion).toBe(1);
    expect(result.informationRequestLimit).toBe(3);
    expect(result.transitions[0]).toMatchObject({
      label: 'Submit',
      eligible: true,
    });
  });
  it('discovers configuration-only states and transitions without graph changes in code', () => {
    const definition = {
      ...config.definition,
      version: 2,
      states: [
        ...config.definition.states,
        { id: 'escalated', label: 'Escalated', terminal: true },
      ],
      transitions: [
        ...config.definition.transitions,
        {
          ...config.definition.transitions[0],
          id: 'escalate',
          to: 'escalated',
        },
      ],
    };
    registry.register(definition);
    const ownClaims = new ClaimService(db, registry, { definition });
    const ownReads = new ClaimWorkflowReadService(db, ownClaims);
    const claim = ownClaims.create(
      { title: 'Other', description: 'Details' },
      claimant,
    );
    expect(
      ownReads
        .availableTransitions(claim.id, claimant)
        .transitions.map((item) => item.id),
    ).toEqual(['submit', 'escalate']);
  });
  it('returns no actions for a terminal claim', () => {
    review();
    engine.execute(id, command('approve', 2), adjuster);
    expect(reads.availableTransitions(id, adjuster).transitions).toEqual([]);
  });
  it('reports unavailable notification recipients on unowned legacy records', () => {
    const legacy = randomUUID();
    const now = new Date().toISOString();
    db.connection
      .prepare(
        "INSERT INTO claims (id, workflow_id, workflow_version,state,title,description,created_at,updated_at) VALUES (?,'claims',1,'under_review','Legacy','Unknown owner',?,?)",
      )
      .run(legacy, now, now);
    const result = reads.availableTransitions(legacy, adjuster);
    expect(
      result.transitions.every(
        (item) =>
          !item.eligible &&
          item.reasonCode === 'NOTIFICATION_RECIPIENT_UNAVAILABLE',
      ),
    ).toBe(true);
    expect(() => reads.availableTransitions(legacy, claimant)).toThrow(
      'Claim not found',
    );
  });
  it('revalidates stale advisory eligibility at execution', () => {
    const result = reads.availableTransitions(id, claimant);
    engine.execute(id, command('submit', 0), claimant);
    expect(() =>
      engine.execute(id, command('submit', result.revision), claimant),
    ).toThrow(expect.objectContaining({ code: 'REVISION_CONFLICT' }));
  });
  it('fails safely on unavailable pinned definitions', () => {
    db.connection.exec("UPDATE workflow_versions SET definition_json='{}'");
    expect(() => reads.availableTransitions(id, claimant)).toThrow(
      expect.objectContaining({ code: 'CLAIM_WORKFLOW_UNAVAILABLE' }),
    );
  });
});

describe('read-only successful audit history', () => {
  it('returns an empty page for a claim without successful transitions', () => {
    expect(reads.audit(id, claimant)).toEqual({
      claimId: id,
      workflowId: 'claims',
      workflowVersion: 1,
      items: [],
      limit: 50,
      offset: 0,
    });
  });
  it('returns persisted transition data and no command, notification or input internals', () => {
    const result = engine.execute(id, command('submit', 0), claimant);
    expect(reads.audit(id, claimant).items).toEqual([
      {
        id: result.auditEventId,
        transitionId: 'submit',
        actor: { id: claimant.id, role: 'claimant' },
        fromState: 'draft',
        toState: 'submitted',
        previousRevision: 0,
        resultingRevision: 1,
        createdAt: result.claim.updatedAt,
      },
    ]);
    expect(reads.audit(id, adjuster)).toEqual(reads.audit(id, claimant));
  });
  it('conceals cross-owner and missing history with the same error', () => {
    review();
    for (const claimId of [id, randomUUID()])
      expect(() => reads.audit(claimId, other)).toThrow(
        expect.objectContaining({
          code: 'CLAIM_NOT_FOUND',
          message: 'Claim not found.',
        }),
      );
  });
  it('excludes another accessible claim from audit results', () => {
    review();
    const otherClaim = claims.create(
      { title: 'Other', description: 'Details' },
      other,
    );
    engine.execute(otherClaim.id, command('submit', 0), other);
    expect(
      reads.audit(id, adjuster).items.map((item) => item.transitionId),
    ).toEqual(['submit', 'start_review']);
  });
  it('orders equal timestamps by persisted resulting revision and paginates stably', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-10-19T10:00:00.000Z'));
      review();
      engine.execute(id, command('approve', 2), adjuster);
    } finally {
      vi.useRealTimers();
    }
    const result = reads.audit(id, claimant);
    expect(new Set(result.items.map((item) => item.createdAt)).size).toBe(1);
    expect(result.items.map((item) => item.resultingRevision)).toEqual([
      1, 2, 3,
    ]);
    expect(reads.audit(id, claimant, 2, 0).items).toEqual(
      result.items.slice(0, 2),
    );
    expect(reads.audit(id, claimant, 2, 2).items).toEqual(
      result.items.slice(2),
    );
    expect(reads.audit(id, claimant, 2, 3).items).toEqual([]);
  });
  it('uses timestamp ordering even when clock time differs from revision ordering', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-10-19T11:00:00.000Z'));
      engine.execute(id, command('submit', 0), claimant);
      vi.setSystemTime(new Date('2026-10-19T10:00:00.000Z'));
      engine.execute(id, command('start_review', 1), adjuster);
    } finally {
      vi.useRealTimers();
    }
    expect(
      reads.audit(id, claimant).items.map((item) => item.transitionId),
    ).toEqual(['start_review', 'submit']);
  });
  it('does not reconstruct history from current state', () => {
    review();
    db.connection.prepare("UPDATE claims SET state='draft' WHERE id=?").run(id);
    expect(
      reads.audit(id, claimant).items.map((item) => item.transitionId),
    ).toEqual(['submit', 'start_review']);
  });
  it('does not add failed attempts or replayed commands to successful history', () => {
    const cmd = command('submit', 0);
    engine.execute(id, cmd, claimant);
    engine.execute(id, cmd, claimant);
    expect(() =>
      engine.execute(id, command('start_review', 0), adjuster),
    ).toThrow();
    expect(reads.audit(id, claimant).items).toHaveLength(1);
  });
  it.each([
    [0, 0],
    [101, 0],
    [1.5, 0],
    [1, -1],
  ])('rejects invalid pagination %s / %s', (limit, offset) => {
    expect(() => reads.audit(id, claimant, limit, offset)).toThrow(
      expect.objectContaining({ code: 'INVALID_REQUEST' }),
    );
  });
  it('keeps audit update/delete triggers effective after history reads', () => {
    review();
    reads.audit(id, adjuster);
    expect(() => db.connection.exec('DELETE FROM transition_events')).toThrow(
      'immutable',
    );
    expect(() =>
      db.connection.exec("UPDATE transition_events SET actor_id='other'"),
    ).toThrow('immutable');
  });
});

describe('read safety', () => {
  it('executes both reads with SQLite query-only mode and changes no persisted rows', () => {
    review();
    engine.execute(
      id,
      command('request_information', 2, { message: 'Details' }),
      adjuster,
    );
    const before = snapshot();
    const changes = db.connection
      .prepare('SELECT total_changes() AS count')
      .get();
    db.connection.pragma('query_only=ON');
    reads.availableTransitions(id, claimant);
    reads.availableTransitions(id, adjuster);
    reads.audit(id, claimant);
    reads.audit(id, adjuster, 1, 0);
    expect(snapshot()).toEqual(before);
    expect(
      db.connection.prepare('SELECT total_changes() AS count').get(),
    ).toEqual(changes);
  });
  it('rejects fabricated identities in direct service calls', () => {
    for (const method of [reads.availableTransitions, reads.audit])
      expect(() =>
        Reflect.apply(method, reads, [
          id,
          { id: claimant.id, role: 'claimant' },
        ]),
      ).toThrow(expect.objectContaining({ code: 'IDENTITY_REQUIRED' }));
  });
  it('sanitizes failures of the discovery transaction and audit query', () => {
    db.close();
    expect(() => reads.availableTransitions(id, claimant)).toThrow(
      expect.objectContaining({
        code: 'CLAIM_STORAGE_FAILED',
        message: 'Unable to discover claim transitions.',
      }),
    );
    expect(() => reads.audit(id, claimant)).toThrow(
      expect.objectContaining({
        code: 'CLAIM_STORAGE_FAILED',
        message: 'Unable to read claim audit history.',
      }),
    );
  });
  it('sanitizes an audit-table read failure after successful claim authorization', () => {
    db.connection.exec(
      'ALTER TABLE transition_events RENAME TO inaccessible_events',
    );
    expect(() => reads.audit(id, claimant)).toThrow(
      expect.objectContaining({
        code: 'CLAIM_STORAGE_FAILED',
        message: 'Unable to read claim audit history.',
      }),
    );
  });
});
