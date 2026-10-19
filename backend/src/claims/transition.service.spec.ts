import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import Database from 'better-sqlite3';
import { DatabaseService } from '../database/database.service.js';
import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
import { ClaimService } from './claim.service.js';
import { TransitionService } from './transition.service.js';
import { resolveDemoActor } from './claim-access.js';
import { MIGRATIONS, runMigrations } from '../database/migrations.js';
const claimant = resolveDemoActor('claimant-1');
const other = resolveDemoActor('claimant-2');
const adjuster = resolveDemoActor('adjuster-1');
const fields = { title: 'Damage', description: 'Screen damaged in transit.' };
let directory: string;
let db: DatabaseService;
let claims: ClaimService;
let registry: WorkflowRegistryService;
let config: WorkflowConfigService;
let engine: TransitionService;
let id: string;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'transitions-'));
  db = new DatabaseService(join(directory, 'test.sqlite'));
  registry = new WorkflowRegistryService(db);
  config = new WorkflowConfigService(
    new URL('../../config/claims.v1.json', import.meta.url),
  );
  registry.register(config.definition);
  claims = new ClaimService(db, registry, config);
  engine = new TransitionService(db, claims);
  id = claims.create(fields, claimant).id;
});
afterEach(() => {
  db?.close();
  vi.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});
function command(
  transitionId: string,
  expectedRevision: number,
  input: unknown = {},
) {
  return { transitionId, expectedRevision, input, commandId: randomUUID() };
}
function review() {
  engine.execute(id, command('submit', 0), claimant);
  engine.execute(id, command('start_review', 1), adjuster);
}
function counts() {
  return ['transition_events', 'notifications', 'command_receipts'].map(
    (table) =>
      db.connection.prepare(`SELECT count(*) AS count FROM ${table}`).get(),
  );
}

describe('transactional workflow execution', () => {
  it('commits a configured transition with one revision and accurate audit', () => {
    const result = engine.execute(id, command('submit', 0), claimant);
    expect(result.claim).toMatchObject({
      state: 'submitted',
      revision: 1,
      informationRequestCount: 0,
      workflowVersion: 1,
    });
    expect(result.notificationIds).toEqual([]);
    expect(
      db.connection
        .prepare(
          'SELECT actor_id, actor_role, transition_id, from_state, to_state, previous_revision, resulting_revision, created_at FROM transition_events',
        )
        .get(),
    ).toEqual({
      actor_id: claimant.id,
      actor_role: 'claimant',
      transition_id: 'submit',
      from_state: 'draft',
      to_state: 'submitted',
      previous_revision: 0,
      resulting_revision: 1,
      created_at: result.claim.updatedAt,
    });
    expect(counts()).toEqual([{ count: 1 }, { count: 0 }, { count: 1 }]);
  });
  it('conceals cross-owner and nonexistent claims identically', () => {
    for (const claimId of [id, randomUUID()])
      expect(() =>
        engine.execute(claimId, command('submit', 0), other),
      ).toThrow(
        expect.objectContaining({ code: 'CLAIM_NOT_FOUND', status: 404 }),
      );
    expect(counts()).toEqual([{ count: 0 }, { count: 0 }, { count: 0 }]);
  });
  it('rejects unknown transition IDs', () => {
    expect(() => engine.execute(id, command('unknown', 0), claimant)).toThrow(
      expect.objectContaining({ code: 'TRANSITION_NOT_FOUND' }),
    );
  });
  it('rejects wrong source states', () => {
    expect(() => engine.execute(id, command('approve', 0), adjuster)).toThrow(
      expect.objectContaining({ code: 'STATE_CONFLICT' }),
    );
  });
  it('enforces roles from configuration', () => {
    expect(() => engine.execute(id, command('submit', 0), adjuster)).toThrow(
      expect.objectContaining({ code: 'TRANSITION_FORBIDDEN', status: 403 }),
    );
  });
  it('enforces preconditions independently from DB text checks', () => {
    db.connection.prepare('UPDATE claims SET title=? WHERE id=?').run('\t', id);
    expect(() => engine.execute(id, command('submit', 0), claimant)).toThrow(
      expect.objectContaining({ code: 'PRECONDITION_FAILED', status: 422 }),
    );
    expect(claims.get(id, claimant).revision).toBe(0);
  });
  it.each([
    {},
    { message: ' ' },
    { message: 'x', extra: 'bad' },
    { message: 'x'.repeat(2001) },
  ])('rejects invalid request-information inputs %j', (input) => {
    review();
    expect(() =>
      engine.execute(id, command('request_information', 2, input), adjuster),
    ).toThrow(expect.objectContaining({ code: 'INVALID_REQUEST' }));
    expect(claims.get(id, claimant)).toMatchObject({
      state: 'under_review',
      revision: 2,
      informationRequestCount: 0,
    });
    expect(counts()).toEqual([{ count: 2 }, { count: 0 }, { count: 2 }]);
  });
  it('requires the configured rejection reason and persists it on success', () => {
    review();
    expect(() => engine.execute(id, command('reject', 2), adjuster)).toThrow(
      expect.objectContaining({ code: 'INVALID_REQUEST' }),
    );
    const result = engine.execute(
      id,
      command('reject', 2, { reason: '  Not covered  ' }),
      adjuster,
    );
    expect(result.claim.state).toBe('rejected');
    expect(
      db.connection
        .prepare('SELECT input_json FROM transition_events WHERE id=?')
        .get(result.auditEventId),
    ).toEqual({ input_json: '{"reason":"Not covered"}' });
    expect(
      db.connection
        .prepare(
          'SELECT recipient_actor_id, template, message FROM notifications',
        )
        .get(),
    ).toEqual({
      recipient_actor_id: claimant.id,
      template: 'claim_rejected',
      message: 'Claim rejected: Not covered',
    });
  });
  it('allows cycles one through three and rejects the fourth without changes', () => {
    review();
    let revision = 2;
    for (let cycle = 1; cycle <= 3; cycle++) {
      const result = engine.execute(
        id,
        command('request_information', revision++, {
          message: 'More information',
        }),
        adjuster,
      );
      expect(result.claim.informationRequestCount).toBe(cycle);
      engine.execute(
        id,
        command('provide_information', revision++, { response: 'Details' }),
        claimant,
      );
    }
    const before = counts();
    expect(() =>
      engine.execute(
        id,
        command('request_information', revision, { message: 'Again' }),
        adjuster,
      ),
    ).toThrow(expect.objectContaining({ code: 'CYCLE_LIMIT_REACHED' }));
    expect(counts()).toEqual(before);
    expect(claims.get(id, claimant)).toMatchObject({
      state: 'under_review',
      revision: 8,
      informationRequestCount: 3,
    });
    expect(
      engine.execute(id, command('approve', 8), adjuster).claim.state,
    ).toBe('approved');
  });
  it('replays the original result after later state changes with no duplicate effects', () => {
    review();
    const cmd = command('request_information', 2, { message: ' Details ' });
    const first = engine.execute(id, cmd, adjuster);
    engine.execute(
      id,
      command('provide_information', 3, { response: 'Done' }),
      claimant,
    );
    const before = counts();
    expect(
      engine.execute(id, { ...cmd, input: { message: 'Details' } }, adjuster),
    ).toEqual(first);
    expect(counts()).toEqual(before);
    expect(claims.get(id, claimant)).toMatchObject({
      revision: 4,
      informationRequestCount: 1,
    });
  });
  it('rejects same command ID with a different request', () => {
    const cmd = command('submit', 0);
    engine.execute(id, cmd, claimant);
    expect(() =>
      engine.execute(id, { ...cmd, expectedRevision: 1 }, claimant),
    ).toThrow(expect.objectContaining({ code: 'COMMAND_ID_REUSED' }));
  });
  it('rejects same command ID by a different actor with access', () => {
    const cmd = command('submit', 0);
    engine.execute(id, cmd, claimant);
    expect(() => engine.execute(id, cmd, adjuster)).toThrow(
      expect.objectContaining({ code: 'COMMAND_ID_REUSED' }),
    );
    expect(() => engine.execute(id, cmd, other)).toThrow(
      expect.objectContaining({ code: 'CLAIM_NOT_FOUND' }),
    );
  });
  it('rejects stale expected revisions', () => {
    engine.execute(id, command('submit', 0), claimant);
    expect(() =>
      engine.execute(id, command('start_review', 0), adjuster),
    ).toThrow(expect.objectContaining({ code: 'REVISION_CONFLICT' }));
    expect(claims.get(id, claimant).revision).toBe(1);
  });
  it.each(['claims', 'transition_events', 'notifications', 'command_receipts'])(
    'rolls back all writes when %s fails',
    (table) => {
      review();
      const before = claims.get(id, claimant);
      const rows = counts();
      db.connection.exec(
        `CREATE TRIGGER injected_failure BEFORE ${table === 'claims' ? 'UPDATE' : 'INSERT'} ON ${table} BEGIN SELECT RAISE(ABORT, 'injected failure'); END`,
      );
      const cmd = command('request_information', 2, { message: 'Details' });
      expect(() => engine.execute(id, cmd, adjuster)).toThrow(
        expect.objectContaining({ code: 'TRANSITION_STORAGE_FAILED' }),
      );
      expect(claims.get(id, claimant)).toEqual(before);
      expect(counts()).toEqual(rows);
      db.connection.exec('DROP TRIGGER injected_failure');
      expect(
        engine.execute(id, cmd, adjuster).claim.informationRequestCount,
      ).toBe(1);
    },
  );
  it('uses conditional update row count to detect a lost write', () => {
    review();
    db.connection.exec(
      'CREATE TRIGGER skip_update BEFORE UPDATE ON claims BEGIN SELECT RAISE(IGNORE); END',
    );
    expect(() => engine.execute(id, command('approve', 2), adjuster)).toThrow(
      expect.objectContaining({ code: 'REVISION_CONFLICT' }),
    );
    expect(claims.get(id, claimant).revision).toBe(2);
    expect(counts()).toEqual([{ count: 2 }, { count: 0 }, { count: 2 }]);
  });
  it('keeps successful events, notifications and receipts immutable', () => {
    review();
    engine.execute(id, command('approve', 2), adjuster);
    for (const table of [
      'transition_events',
      'notifications',
      'command_receipts',
    ]) {
      expect(() => db.connection.exec(`DELETE FROM ${table}`)).toThrow(
        'immutable',
      );
      const column =
        table === 'transition_events'
          ? 'actor_id'
          : table === 'notifications'
            ? 'message'
            : 'fingerprint';
      expect(() =>
        db.connection.exec(`UPDATE ${table} SET ${column}=${column}`),
      ).toThrow('immutable');
    }
  });
  it('uses pinned version one after version two changes role and transitions', () => {
    registry.register({
      ...config.definition,
      version: 2,
      transitions: config.definition.transitions.map((transition) =>
        transition.id === 'submit'
          ? { ...transition, roles: ['adjuster'] }
          : transition,
      ),
    });
    expect(
      engine.execute(id, command('submit', 0), claimant).claim,
    ).toMatchObject({ workflowVersion: 1, state: 'submitted' });
  });
  it('accepts a configuration-only new state and transition', () => {
    const value = {
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
    registry.register(value);
    const service = new ClaimService(db, registry, { definition: value });
    const claim = service.create(fields, claimant);
    expect(
      new TransitionService(db, service).execute(
        claim.id,
        command('escalate', 0),
        claimant,
      ).claim.state,
    ).toBe('escalated');
  });
  it('rejects an unavailable pinned workflow without writes', () => {
    db.connection.exec("UPDATE workflow_versions SET definition_json='{}'");
    expect(() => engine.execute(id, command('submit', 0), claimant)).toThrow(
      expect.objectContaining({ code: 'CLAIM_WORKFLOW_UNAVAILABLE' }),
    );
    expect(counts()).toEqual([{ count: 0 }, { count: 0 }, { count: 0 }]);
  });
  it('preserves counters and receipt replay across a restart', () => {
    review();
    const cmd = command('request_information', 2, { message: 'Details' });
    const first = engine.execute(id, cmd, adjuster);
    db.close();
    db = new DatabaseService(join(directory, 'test.sqlite'));
    registry = new WorkflowRegistryService(db);
    claims = new ClaimService(db, registry, config);
    engine = new TransitionService(db, claims);
    expect(engine.execute(id, cmd, adjuster)).toEqual(first);
    expect(claims.get(id, claimant).informationRequestCount).toBe(1);
  });
  it('does not invent a notification recipient for unowned legacy claims', () => {
    const legacy = randomUUID();
    const now = new Date().toISOString();
    db.connection
      .prepare(
        "INSERT INTO claims (id,workflow_id,workflow_version,state,title,description,created_at,updated_at) VALUES (?,'claims',1,'under_review','Legacy','Unknown owner',?,?)",
      )
      .run(legacy, now, now);
    expect(() =>
      engine.execute(
        legacy,
        command('request_information', 0, { message: 'Details' }),
        adjuster,
      ),
    ).toThrow(
      expect.objectContaining({ code: 'NOTIFICATION_RECIPIENT_UNAVAILABLE' }),
    );
    expect(claims.get(legacy, adjuster).revision).toBe(0);
  });
  it('serializes competing commands across independent database connections', async () => {
    engine.execute(id, command('submit', 0), claimant);
    const second = new DatabaseService(join(directory, 'test.sqlite'));
    try {
      const otherEngine = new TransitionService(
        second,
        new ClaimService(second, new WorkflowRegistryService(second), config),
      );
      const outcomes = await Promise.allSettled([
        Promise.resolve().then(() =>
          engine.execute(id, command('start_review', 1), adjuster),
        ),
        Promise.resolve().then(() =>
          otherEngine.execute(id, command('start_review', 1), adjuster),
        ),
      ]);
      expect(
        outcomes.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      const failed = outcomes.find((result) => result.status === 'rejected');
      expect(failed?.status === 'rejected' && failed.reason.code).toBe(
        'REVISION_CONFLICT',
      );
      expect(claims.get(id, claimant).revision).toBe(2);
    } finally {
      second.close();
    }
  });
  it('maps a held SQLite writer lock to a retryable safe error', () => {
    const second = new DatabaseService(join(directory, 'test.sqlite'));
    try {
      db.connection.pragma('busy_timeout=1');
      second.connection.exec('BEGIN IMMEDIATE');
      expect(() => engine.execute(id, command('submit', 0), claimant)).toThrow(
        expect.objectContaining({ code: 'STORAGE_BUSY', status: 503 }),
      );
    } finally {
      second.connection.exec('ROLLBACK');
      second.close();
    }
  });
  it('upgrades populated migration 003 data without changing ownership or pinning', () => {
    const file = join(directory, 'old.sqlite');
    const old = new Database(file);
    const timestamp = new Date().toISOString();
    try {
      runMigrations(old, MIGRATIONS.slice(0, 3));
      const row = db.connection
        .prepare('SELECT * FROM workflow_versions')
        .get();
      if (!row || typeof row !== 'object') throw new Error('Missing fixture');
      old
        .prepare(
          'INSERT INTO workflow_versions VALUES (@workflow_id,@version,@schema_version,@definition_json,@definition_sha256,@registered_at)',
        )
        .run(row);
      old
        .prepare(
          "INSERT INTO claims (id,workflow_id,workflow_version,state,title,description,created_at,updated_at,owner_actor_id) VALUES (?,'claims',1,'draft','Old','Existing',?,?,?)",
        )
        .run(id, timestamp, timestamp, claimant.id);
    } finally {
      old.close();
    }
    const upgraded = new DatabaseService(file);
    try {
      const service = new ClaimService(
        upgraded,
        new WorkflowRegistryService(upgraded),
        config,
      );
      expect(service.get(id, claimant)).toMatchObject({
        workflowVersion: 1,
        informationRequestCount: 0,
        ownerActorId: claimant.id,
        createdAt: timestamp,
      });
    } finally {
      upgraded.close();
    }
  });
  it('retains exact migration 001–003 hashes', () => {
    expect(
      MIGRATIONS.slice(0, 3).map((item) =>
        createHash('sha256').update(item.sql).digest('hex'),
      ),
    ).toEqual([
      '306d576e7ec1decd06e12b6c66758400b07a0e1bf35e9c228149e8c8db165a6a',
      'ede9401f0a11fa973173f0cf6160f7c931fbf945c710a7b5b55968310d05dcd5',
      'daec614a1a2674c99178164b13aa4258653e3846b014029c5c2ccbeb7692f508',
    ]);
  });
});

describe('transition input and idempotency boundaries', () => {
  it('uses equivalent normalized input regardless of object key order', () => {
    const definition = {
      ...config.definition,
      version: 2,
      transitions: config.definition.transitions.map((item) =>
        item.id === 'submit'
          ? {
              ...item,
              inputFields: ['alpha', 'beta'].map((name) => ({
                name,
                label: name,
                required: true,
                minLength: 1,
                maxLength: 20,
              })),
            }
          : item,
      ),
    };
    registry.register(definition);
    claims = new ClaimService(db, registry, { definition });
    engine = new TransitionService(db, claims);
    id = claims.create(fields, claimant).id;
    const cmd = command('submit', 0, { beta: ' two ', alpha: 'one' });
    const first = engine.execute(id, cmd, claimant);
    expect(
      engine.execute(
        id,
        { ...cmd, input: { alpha: 'one', beta: 'two' } },
        claimant,
      ),
    ).toEqual(first);
    expect(counts()).toEqual([{ count: 1 }, { count: 0 }, { count: 1 }]);
  });
  it('does not treat an inherited property as required input', () => {
    const definition = {
      ...config.definition,
      version: 2,
      transitions: config.definition.transitions.map((item) =>
        item.id === 'submit'
          ? {
              ...item,
              inputFields: [
                {
                  name: 'constructor',
                  label: 'Details',
                  required: true,
                  minLength: 1,
                  maxLength: 20,
                },
              ],
            }
          : item,
      ),
    };
    registry.register(definition);
    claims = new ClaimService(db, registry, { definition });
    engine = new TransitionService(db, claims);
    id = claims.create(fields, claimant).id;
    expect(() => engine.execute(id, command('submit', 0), claimant)).toThrow(
      expect.objectContaining({ code: 'INVALID_REQUEST' }),
    );
    expect(
      engine.execute(
        id,
        command('submit', 0, { constructor: 'present' }),
        claimant,
      ).claim.revision,
    ).toBe(1);
  });
  it('uses the same pinned limit for an added information-request transition', () => {
    const definition = {
      ...config.definition,
      version: 2,
      limits: { informationRequests: 1 },
      transitions: [
        ...config.definition.transitions,
        { ...config.definition.transitions[2], id: 'ask_again' },
      ],
    };
    registry.register(definition);
    claims = new ClaimService(db, registry, { definition });
    engine = new TransitionService(db, claims);
    id = claims.create(fields, claimant).id;
    review();
    engine.execute(
      id,
      command('request_information', 2, { message: 'Details' }),
      adjuster,
    );
    engine.execute(
      id,
      command('provide_information', 3, { response: 'Done' }),
      claimant,
    );
    expect(() =>
      engine.execute(
        id,
        command('ask_again', 4, { message: 'Again' }),
        adjuster,
      ),
    ).toThrow(expect.objectContaining({ code: 'CYCLE_LIMIT_REACHED' }));
  });
  it('conflicts on command IDs reused for a different accessible claim', () => {
    const cmd = command('submit', 0);
    engine.execute(id, cmd, claimant);
    const second = claims.create(fields, claimant);
    expect(() => engine.execute(second.id, cmd, claimant)).toThrow(
      expect.objectContaining({ code: 'COMMAND_ID_REUSED' }),
    );
    expect(claims.get(second.id, claimant).revision).toBe(0);
  });
  it('rejects forged direct-service identity before processing', () => {
    expect(() =>
      Reflect.apply(engine.execute, engine, [
        id,
        command('submit', 0),
        { id: claimant.id, role: 'claimant' },
      ]),
    ).toThrow(expect.objectContaining({ code: 'IDENTITY_REQUIRED' }));
  });
});
