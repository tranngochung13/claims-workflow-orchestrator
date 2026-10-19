import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { ClaimsModule } from '../src/claims/claims.module.js';
import {
  DatabaseService,
  DATABASE_PATH,
} from '../src/database/database.service.js';
import { WorkflowRegistryService } from '../src/workflow/workflow-registry.service.js';
import { WorkflowConfigService } from '../src/workflow/workflow-config.service.js';
let app: INestApplication;
let id: string;
const command = (
  transitionId: string,
  expectedRevision: number,
  input: Record<string, string> = {},
) => ({ transitionId, expectedRevision, input, commandId: randomUUID() });
function read(kind: string, actor = 'claimant-1', claimId = id) {
  return request(app.getHttpServer())
    .get(`/api/claims/${claimId}/${kind}`)
    .set('X-Demo-Actor-Id', actor);
}
function execute(payload: object, actor = 'claimant-1') {
  return request(app.getHttpServer())
    .post(`/api/claims/${id}/transitions`)
    .set('X-Demo-Actor-Id', actor)
    .send(payload);
}
async function review() {
  await execute(command('submit', 0)).expect(200);
  await execute(command('start_review', 1), 'adjuster-1').expect(200);
}
beforeEach(async () => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('DEMO_IDENTITY_ENABLED', 'true');
  const module = await Test.createTestingModule({ imports: [ClaimsModule] })
    .overrideProvider(WorkflowConfigService)
    .useValue(
      new WorkflowConfigService(
        new URL('../config/claims.v1.json', import.meta.url),
      ),
    )
    .overrideProvider(DATABASE_PATH)
    .useValue(':memory:')
    .compile();
  app = module.createNestApplication();
  await app.init();
  const created = await request(app.getHttpServer())
    .post('/api/claims')
    .set('X-Demo-Actor-Id', 'claimant-1')
    .send({ title: 'Damage', description: 'Screen damaged.' })
    .expect(201);
  id = created.body.id;
});
afterEach(async () => {
  await app?.close();
  vi.unstubAllEnvs();
});

describe('action discovery HTTP', () => {
  it('returns the explicit discovery contract for an owned claim', async () => {
    const result = await read('available-transitions').expect(200);
    expect(result.body).toEqual({
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
  it('distinguishes current-state actions by role and includes form metadata', async () => {
    await review();
    const adjuster = await read('available-transitions', 'adjuster-1').expect(
      200,
    );
    expect(
      adjuster.body.transitions.map((item: { id: string }) => item.id),
    ).toEqual(['request_information', 'approve', 'reject']);
    expect(adjuster.body.transitions[0]).toMatchObject({
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
    const claimant = await read('available-transitions').expect(200);
    expect(
      claimant.body.transitions.every(
        (item: { eligible: boolean; reasonCode: string }) =>
          !item.eligible && item.reasonCode === 'TRANSITION_FORBIDDEN',
      ),
    ).toBe(true);
  });
  it('shows a precondition failure without executing the action', async () => {
    app
      .get(DatabaseService)
      .connection.prepare('UPDATE claims SET title=? WHERE id=?')
      .run('\t', id);
    const result = await read('available-transitions').expect(200);
    expect(result.body.transitions[0]).toMatchObject({
      eligible: false,
      reasonCode: 'PRECONDITION_FAILED',
    });
    expect((await read('audit').expect(200)).body.items).toEqual([]);
  });
  it('reflects the cycle limit while preserving final-decision actions', async () => {
    await review();
    let revision = 2;
    for (let cycle = 0; cycle < 3; cycle++) {
      await execute(
        command('request_information', revision++, { message: 'Details' }),
        'adjuster-1',
      ).expect(200);
      await execute(
        command('provide_information', revision++, { response: 'Done' }),
      ).expect(200);
    }
    const result = await read('available-transitions', 'adjuster-1').expect(
      200,
    );
    expect(result.body).toMatchObject({
      informationRequestCount: 3,
      revision: 8,
    });
    expect(result.body.transitions[0]).toMatchObject({
      eligible: false,
      reasonCode: 'CYCLE_LIMIT_REACHED',
    });
    expect(
      result.body.transitions
        .slice(1)
        .every((item: { eligible: boolean }) => item.eligible),
    ).toBe(true);
  });
  it('uses the original pinned definition after registering a newer one', async () => {
    const original = app.get(WorkflowConfigService).definition;
    app
      .get(WorkflowRegistryService)
      .register({
        ...original,
        version: 2,
        transitions: original.transitions.map((item) =>
          item.id === 'submit'
            ? { ...item, label: 'Version two', roles: ['adjuster'] }
            : item,
        ),
      });
    const result = await read('available-transitions').expect(200);
    expect(result.body.workflowVersion).toBe(1);
    expect(result.body.transitions[0]).toMatchObject({
      label: 'Submit',
      eligible: true,
    });
  });
  it('discovery does not grant execution permission or bypass revision checks', async () => {
    const discovered = await read('available-transitions').expect(200);
    await execute(command('submit', 0)).expect(200);
    const stale = await execute(
      command('submit', discovered.body.revision),
    ).expect(409);
    expect(stale.body.error.code).toBe('REVISION_CONFLICT');
  });
  it.each([
    'limit=1',
    'role=adjuster',
    'ownerActorId=claimant-2',
    'actor=adjuster-1',
  ])('rejects unsupported discovery query %s', async (query) => {
    const result = await read('available-transitions').query(query).expect(400);
    expect(result.body.error.code).toBe('INVALID_REQUEST');
  });
});

describe('audit history HTTP', () => {
  it('returns an empty bounded page with pinned claim metadata', async () => {
    expect((await read('audit').expect(200)).body).toEqual({
      claimId: id,
      workflowId: 'claims',
      workflowVersion: 1,
      items: [],
      limit: 50,
      offset: 0,
    });
  });
  it('returns persisted event fields to claimant and adjuster with stable pagination', async () => {
    const submitted = await execute(command('submit', 0)).expect(200);
    const started = await execute(
      command('start_review', 1),
      'adjuster-1',
    ).expect(200);
    const history = await read('audit').expect(200);
    expect(history.body.items).toEqual([
      {
        id: submitted.body.auditEventId,
        transitionId: 'submit',
        actor: { id: 'claimant-1', role: 'claimant' },
        fromState: 'draft',
        toState: 'submitted',
        previousRevision: 0,
        resultingRevision: 1,
        createdAt: submitted.body.claim.updatedAt,
      },
      {
        id: started.body.auditEventId,
        transitionId: 'start_review',
        actor: { id: 'adjuster-1', role: 'adjuster' },
        fromState: 'submitted',
        toState: 'under_review',
        previousRevision: 1,
        resultingRevision: 2,
        createdAt: started.body.claim.updatedAt,
      },
    ]);
    expect((await read('audit', 'adjuster-1').expect(200)).body).toEqual(
      history.body,
    );
    const page = await read('audit').query({ limit: 1, offset: 1 }).expect(200);
    expect(page.body).toMatchObject({
      limit: 1,
      offset: 1,
      items: [history.body.items[1]],
    });
    expect(
      (await read('audit').query({ limit: 1, offset: 2 }).expect(200)).body
        .items,
    ).toEqual([]);
  });
  it('never includes failed transitions or duplicate events for replay', async () => {
    const cmd = command('submit', 0);
    await execute(cmd).expect(200);
    await execute(cmd).expect(200);
    await execute(command('start_review', 0), 'adjuster-1').expect(409);
    expect((await read('audit').expect(200)).body.items).toHaveLength(1);
  });
  it.each([
    'limit=0',
    'limit=101',
    'limit=1.5',
    'offset=-1',
    'limit=1&limit=2',
    'role=adjuster',
    'ownerActorId=claimant-2',
  ])('rejects invalid audit pagination/query %s', async (query) => {
    expect((await read('audit').query(query).expect(400)).body.error.code).toBe(
      'INVALID_REQUEST',
    );
  });
});

describe.each(['available-transitions', 'audit'])(
  '%s access and read safety',
  (kind) => {
    it('returns identical 404s for missing and cross-owner claims', async () => {
      const hidden = await read(kind, 'claimant-2').expect(404);
      const missing = await read(kind, 'claimant-2', randomUUID()).expect(404);
      expect(hidden.body).toEqual(missing.body);
      expect(hidden.body).toEqual({
        error: { code: 'CLAIM_NOT_FOUND', message: 'Claim not found.' },
      });
    });
    it('requires a known verified actor', async () => {
      await request(app.getHttpServer())
        .get(`/api/claims/${id}/${kind}`)
        .expect(401);
      expect((await read(kind, 'unknown').expect(401)).body.error.code).toBe(
        'IDENTITY_REQUIRED',
      );
    });
    it('does not use role values supplied in a body or extra header', async () => {
      await read(kind, 'claimant-2')
        .set('X-Role', 'adjuster')
        .send({ actor: 'adjuster-1', role: 'adjuster' })
        .expect(404);
    });
    it.each([
      ['production', 'true'],
      ['development', 'false'],
      ['test', 'true'],
    ])('fails closed in %s / %s', async (environment, enabled) => {
      vi.stubEnv('NODE_ENV', environment);
      vi.stubEnv('DEMO_IDENTITY_ENABLED', enabled);
      expect((await read(kind).expect(403)).body.error.code).toBe(
        'DEMO_IDENTITY_DISABLED',
      );
    });
    it('changes no data even when SQLite rejects writes', async () => {
      await review();
      const db = app.get(DatabaseService).connection;
      const tables = [
        'claims',
        'transition_events',
        'notifications',
        'command_receipts',
        'workflow_versions',
        'schema_migrations',
      ];
      const before = tables.map((table) =>
        db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
      );
      db.pragma('query_only=ON');
      await read(kind).expect(200);
      expect(
        tables.map((table) =>
          db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
        ),
      ).toEqual(before);
    });
    it('returns sanitized errors when storage is unavailable', async () => {
      app.get(DatabaseService).close();
      const response = await read(kind).expect(500);
      expect(response.body.error.code).toBe('CLAIM_STORAGE_FAILED');
      expect(response.body.error.message).toBe(
        kind === 'audit'
          ? 'Unable to read claim audit history.'
          : 'Unable to discover claim transitions.',
      );
      expect(Object.keys(response.body)).toEqual(['error']);
    });
  },
);
