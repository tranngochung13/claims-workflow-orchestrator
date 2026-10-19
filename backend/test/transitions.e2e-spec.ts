import { WorkflowConfigService } from '../src/workflow/workflow-config.service.js';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { ClaimsModule } from '../src/claims/claims.module.js';
import {
  DATABASE_PATH,
  DatabaseService,
} from '../src/database/database.service.js';
let app: INestApplication;
let id: string;
const command = (
  transitionId = 'submit',
  expectedRevision = 0,
  input: Record<string, string> = {},
) => ({ transitionId, expectedRevision, input, commandId: randomUUID() });
function execute(payload: object, actor = 'claimant-1', claimId = id) {
  return request(app.getHttpServer())
    .post(`/api/claims/${claimId}/transitions`)
    .set('X-Demo-Actor-Id', actor)
    .send(payload);
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
  const claim = await request(app.getHttpServer())
    .post('/api/claims')
    .set('X-Demo-Actor-Id', 'claimant-1')
    .send({ title: 'Damage', description: 'Screen damaged' })
    .expect(201);
  id = claim.body.id;
});
afterEach(async () => {
  await app?.close();
  vi.unstubAllEnvs();
});
async function review() {
  await execute(command()).expect(200);
  await execute(command('start_review', 1), 'adjuster-1').expect(200);
}
describe('transition HTTP API', () => {
  it('returns committed claim, audit ID and notification IDs with 200', async () => {
    const result = await execute(command()).expect(200);
    expect(result.body.claim).toMatchObject({
      id,
      state: 'submitted',
      revision: 1,
      informationRequestCount: 0,
      ownerActorId: 'claimant-1',
      workflowVersion: 1,
    });
    expect(result.body.auditEventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.body.notificationIds).toEqual([]);
  });
  it('runs request/response and approval with local notification records', async () => {
    await review();
    const requested = await execute(
      command('request_information', 2, { message: 'Purchase date?' }),
      'adjuster-1',
    ).expect(200);
    expect(requested.body.claim).toMatchObject({
      informationRequestCount: 1,
      revision: 3,
      state: 'awaiting_information',
    });
    expect(requested.body.notificationIds).toHaveLength(1);
    await execute(
      command('provide_information', 3, { response: 'Yesterday' }),
    ).expect(200);
    const approved = await execute(command('approve', 4), 'adjuster-1').expect(
      200,
    );
    expect(approved.body.claim).toMatchObject({
      state: 'approved',
      revision: 5,
      informationRequestCount: 1,
    });
  });
  it('conceals cross-owner and missing claim IDs', async () => {
    const hidden = await execute(command(), 'claimant-2').expect(404);
    const absent = await execute(command(), 'claimant-2', randomUUID()).expect(
      404,
    );
    expect(hidden.body).toEqual(absent.body);
    expect(hidden.body.error.code).toBe('CLAIM_NOT_FOUND');
  });
  it('returns stable unknown-transition, role and source errors', async () => {
    expect(
      (await execute(command('unknown')).expect(404)).body.error.code,
    ).toBe('TRANSITION_NOT_FOUND');
    expect(
      (await execute(command(), 'adjuster-1').expect(403)).body.error.code,
    ).toBe('TRANSITION_FORBIDDEN');
    expect(
      (await execute(command('approve'), 'adjuster-1').expect(409)).body.error
        .code,
    ).toBe('STATE_CONFLICT');
  });
  it('returns stable stale-revision errors', async () => {
    await execute(command()).expect(200);
    expect(
      (await execute(command('start_review', 0), 'adjuster-1').expect(409)).body
        .error.code,
    ).toBe('REVISION_CONFLICT');
  });
  it('requires configured rejection reason', async () => {
    await review();
    expect(
      (await execute(command('reject', 2), 'adjuster-1').expect(400)).body.error
        .code,
    ).toBe('INVALID_REQUEST');
    const result = await execute(
      command('reject', 2, { reason: 'Not covered' }),
      'adjuster-1',
    ).expect(200);
    expect(result.body.claim.state).toBe('rejected');
  });
  it('enforces the three-cycle lifetime limit through HTTP', async () => {
    await review();
    let revision = 2;
    for (let cycle = 1; cycle <= 3; cycle++) {
      const result = await execute(
        command('request_information', revision++, { message: 'Details' }),
        'adjuster-1',
      ).expect(200);
      expect(result.body.claim.informationRequestCount).toBe(cycle);
      await execute(
        command('provide_information', revision++, {
          response: 'Details supplied',
        }),
      ).expect(200);
    }
    expect(
      (
        await execute(
          command('request_information', revision, { message: 'Again' }),
          'adjuster-1',
        ).expect(422)
      ).body.error.code,
    ).toBe('CYCLE_LIMIT_REACHED');
    const detail = await request(app.getHttpServer())
      .get(`/api/claims/${id}`)
      .set('X-Demo-Actor-Id', 'claimant-1')
      .expect(200);
    expect(detail.body).toMatchObject({
      revision: 8,
      informationRequestCount: 3,
      state: 'under_review',
    });
  });
  it('returns original response on retry and conflicts on changed actor or payload', async () => {
    const payload = command();
    const first = await execute(payload).expect(200);
    expect((await execute(payload).expect(200)).body).toEqual(first.body);
    expect(
      (await execute({ ...payload, expectedRevision: 1 }).expect(409)).body
        .error.code,
    ).toBe('COMMAND_ID_REUSED');
    expect(
      (await execute(payload, 'adjuster-1').expect(409)).body.error.code,
    ).toBe('COMMAND_ID_REUSED');
  });
  it.each([
    'state',
    'revision',
    'ownerActorId',
    'workflowVersion',
    'actor',
    'role',
    'informationRequestCount',
    'audit',
    'notifications',
  ])('rejects protected command property %s', async (field) => {
    expect(
      (await execute({ ...command(), [field]: 'override' }).expect(400)).body
        .error.code,
    ).toBe('INVALID_REQUEST');
  });
  it.each([
    {},
    { ...command(), expectedRevision: -1 },
    { ...command(), commandId: 'invalid' },
    { ...command(), input: { actor: 'override' } },
    { ...command(), input: { message: 12 } },
  ])('rejects invalid command %j', async (payload) => {
    expect((await execute(payload).expect(400)).body.error.code).toBe(
      'INVALID_REQUEST',
    );
  });
  it('rejects unverified HTTP identities', async () => {
    await request(app.getHttpServer())
      .post(`/api/claims/${id}/transitions`)
      .send(command())
      .expect(401);
    await execute(command(), 'unknown').expect(401);
  });
  it.each([
    ['production', 'true'],
    ['development', 'false'],
    ['test', 'true'],
  ])('fails closed in %s with demo %s', async (environment, enabled) => {
    vi.stubEnv('NODE_ENV', environment);
    vi.stubEnv('DEMO_IDENTITY_ENABLED', enabled);
    expect((await execute(command()).expect(403)).body.error.code).toBe(
      'DEMO_IDENTITY_DISABLED',
    );
  });
  it('sanitizes write errors and rolls back state', async () => {
    app
      .get(DatabaseService)
      .connection.exec(
        "CREATE TRIGGER fail_audit BEFORE INSERT ON transition_events BEGIN SELECT RAISE(ABORT, 'private SQL failure'); END",
      );
    const result = await execute(command()).expect(500);
    expect(result.body).toEqual({
      error: {
        code: 'TRANSITION_STORAGE_FAILED',
        message: 'Unable to execute transition.',
      },
    });
    const claim = await request(app.getHttpServer())
      .get(`/api/claims/${id}`)
      .set('X-Demo-Actor-Id', 'claimant-1')
      .expect(200);
    expect(claim.body.revision).toBe(0);
  });
});
