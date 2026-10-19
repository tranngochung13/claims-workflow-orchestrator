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
let db: DatabaseService;
let id: string;
let revision: number;
const command = (
  transitionId: string,
  expectedRevision: number,
  input = {},
) => ({ transitionId, expectedRevision, input, commandId: randomUUID() });
function post(payload: object, actor = 'adjuster-1') {
  return request(app.getHttpServer())
    .post(`/api/claims/${id}/transitions`)
    .set('X-Demo-Actor-Id', actor)
    .send(payload);
}
async function step(transition: string, input = {}, actor = 'adjuster-1') {
  const discovery = await request(app.getHttpServer())
    .get(`/api/claims/${id}/available-transitions`)
    .set('X-Demo-Actor-Id', actor)
    .expect(200);
  expect(discovery.body.transitions).toContainEqual(
    expect.objectContaining({ id: transition, eligible: true }),
  );
  const payload = command(transition, revision, input);
  const result = await post(payload, actor).expect(200);
  revision = result.body.claim.revision;
  expect((await post(payload, actor).expect(200)).body).toEqual(result.body);
  return result.body;
}
beforeEach(async () => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('DEMO_IDENTITY_ENABLED', 'true');
  const module = await Test.createTestingModule({ imports: [ClaimsModule] })
    .overrideProvider(DATABASE_PATH)
    .useValue(':memory:')
    .compile();
  db = module.get(DatabaseService);
  app = module.createNestApplication();
  await app.init();
  const result = await request(app.getHttpServer())
    .post('/api/claims')
    .set('X-Demo-Actor-Id', 'claimant-1')
    .send({ title: 'Lifecycle', description: 'Real API scenario' })
    .expect(201);
  id = result.body.id;
  revision = 0;
  expect(result.body.workflowVersion).toBe(2);
});
afterEach(async () => {
  await app?.close();
  vi.unstubAllEnvs();
});
it.each(['approval', 'rejection', 'information'])(
  'completes %s lifecycle through discovery and immutable history',
  async (path) => {
    await step('submit', {}, 'claimant-1');
    expect(
      (await post(command('approve', revision)).expect(409)).body.error.code,
    ).toBe('STATE_CONFLICT');
    await step('verify_documents');
    await step('start_assessment');
    if (path === 'information') {
      await step('request_information', { message: 'More information' });
      await step('provide_information', { response: 'Details' }, 'claimant-1');
      await step('start_assessment');
    }
    if (path === 'rejection') {
      await step('reject', { reason: 'Not covered' });
      await step('close_rejected');
    } else {
      await step('approve');
      await post(command('initiate_payment', revision), 'claimant-1').expect(
        403,
      );
      await step('initiate_payment');
      await step('close_paid');
    }
    const actions = await request(app.getHttpServer())
      .get(`/api/claims/${id}/available-transitions`)
      .set('X-Demo-Actor-Id', 'adjuster-1')
      .expect(200);
    expect(actions.body.state).toBe('closed');
    expect(actions.body.transitions).toEqual([]);
    const audit = await request(app.getHttpServer())
      .get(`/api/claims/${id}/audit`)
      .set('X-Demo-Actor-Id', 'claimant-1')
      .expect(200);
    expect(audit.body.items).toHaveLength(revision);
    expect(
      db.connection.prepare('SELECT count(*) n FROM command_receipts').get(),
    ).toEqual({ n: revision });
    expect(
      db.connection.prepare('SELECT count(*) n FROM payment_initiations').get(),
    ).toEqual({ n: path === 'rejection' ? 0 : 1 });
    await post(command('approve', revision)).expect(409);
  },
);
