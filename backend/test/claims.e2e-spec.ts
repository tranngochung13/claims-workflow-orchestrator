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
const input = {
  title: 'Laptop damage',
  description: 'Screen damaged during transport.',
};
const actor = 'claimant-1';
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
});
afterEach(async () => {
  await app?.close();
  vi.unstubAllEnvs();
});
describe('claims HTTP', () => {
  it('creates with 201 and explicit response fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/claims')
      .set('X-Demo-Actor-Id', actor)
      .send({ title: '  Laptop damage  ', description: input.description })
      .expect(201);
    expect(Object.keys(response.body).sort()).toEqual(
      [
        'ownerActorId',
        'id',
        'workflowId',
        'workflowVersion',
        'state',
        'title',
        'description',
        'revision',
        'informationRequestCount',
        'createdAt',
        'updatedAt',
      ].sort(),
    );
    expect(response.body).toMatchObject({
      ...input,
      workflowId: 'claims',
      workflowVersion: 1,
      state: 'draft',
      revision: 0,
    });
    expect(response.body.createdAt).toBe(response.body.updatedAt);
    expect(response.body.id).toMatch(/^[a-f0-9-]{36}$/);
  });
  it('retrieves a persisted claim', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/claims')
      .set('X-Demo-Actor-Id', actor)
      .send(input)
      .expect(201);
    const read = await request(app.getHttpServer())
      .get(`/api/claims/${created.body.id}`)
      .set('X-Demo-Actor-Id', actor)
      .expect(200);
    expect(read.body).toEqual(created.body);
  });
  it('lists claims in the documented page envelope', async () => {
    await request(app.getHttpServer())
      .post('/api/claims')
      .set('X-Demo-Actor-Id', actor)
      .send(input)
      .expect(201);
    const page = await request(app.getHttpServer())
      .get('/api/claims?limit=1&offset=0')
      .set('X-Demo-Actor-Id', actor)
      .expect(200);
    expect(page.body).toMatchObject({
      limit: 1,
      offset: 0,
      items: [
        expect.objectContaining({ workflowId: 'claims', workflowVersion: 1 }),
      ],
    });
    const empty = await request(app.getHttpServer())
      .get('/api/claims?limit=1&offset=1')
      .set('X-Demo-Actor-Id', actor)
      .expect(200);
    expect(empty.body.items).toEqual([]);
  });
  it('returns a safe 404 for missing claims', async () => {
    const result = await request(app.getHttpServer())
      .get(`/api/claims/${randomUUID()}`)
      .set('X-Demo-Actor-Id', actor)
      .expect(404);
    expect(result.body).toEqual({
      error: { code: 'CLAIM_NOT_FOUND', message: 'Claim not found.' },
    });
  });
  it.each([
    {},
    { title: ' ', description: 'x' },
    { title: 'x', description: 1 },
    { title: 'x'.repeat(121), description: 'x' },
  ])('rejects invalid payload %j', async (payload) => {
    const result = await request(app.getHttpServer())
      .post('/api/claims')
      .set('X-Demo-Actor-Id', actor)
      .send(payload)
      .expect(400);
    expect(result.body.error.code).toBe('INVALID_REQUEST');
  });
  it.each([
    'id',
    'state',
    'revision',
    'created_at',
    'updated_at',
    'workflow_id',
    'workflow_version',
    'workflowId',
    'workflowVersion',
    'roles',
    'actorId',
    'extra',
  ])('rejects protected or unknown field %s', async (field) => {
    const result = await request(app.getHttpServer())
      .post('/api/claims')
      .set('X-Demo-Actor-Id', actor)
      .send({ ...input, [field]: 'override' })
      .expect(400);
    expect(result.body.error.code).toBe('INVALID_REQUEST');
  });
  it.each([
    'limit=101',
    'limit=0',
    'offset=-1',
    'limit=1.5',
    'limit=1&limit=2',
    'extra=1',
  ])('rejects invalid pagination %s', async (query) => {
    const result = await request(app.getHttpServer())
      .get(`/api/claims?${query}`)
      .set('X-Demo-Actor-Id', actor)
      .expect(400);
    expect(result.body.error.code).toBe('INVALID_REQUEST');
  });
  it('rejects missing identity', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/claims')
      .send(input)
      .expect(401);
    expect(result.body.error.code).toBe('IDENTITY_REQUIRED');
  });
  it.each(['admin', '__proto__', 'constructor'])(
    'rejects unknown actor %s',
    async (id) => {
      await request(app.getHttpServer())
        .post('/api/claims')
        .set('X-Demo-Actor-Id', id)
        .send(input)
        .expect(401);
    },
  );
  it.each([
    ['production', 'true'],
    ['production', 'false'],
    ['test', 'true'],
    ['development', 'false'],
    ['', 'true'],
  ])(
    'fails closed in NODE_ENV=%s DEMO_IDENTITY_ENABLED=%s',
    async (environment, enabled) => {
      vi.stubEnv('NODE_ENV', environment);
      vi.stubEnv('DEMO_IDENTITY_ENABLED', enabled);
      const result = await request(app.getHttpServer())
        .post('/api/claims')
        .set('X-Demo-Actor-Id', actor)
        .send(input)
        .expect(403);
      expect(result.body.error.code).toBe('DEMO_IDENTITY_DISABLED');
      await request(app.getHttpServer())
        .get('/api/claims')
        .set('X-Demo-Actor-Id', actor)
        .expect(403);
      await request(app.getHttpServer())
        .get(`/api/claims/${randomUUID()}`)
        .set('X-Demo-Actor-Id', actor)
        .expect(403);
    },
  );
  it('returns sanitized 500 on storage failure', async () => {
    app.get(DatabaseService).close();
    const result = await request(app.getHttpServer())
      .post('/api/claims')
      .set('X-Demo-Actor-Id', actor)
      .send(input)
      .expect(500);
    expect(result.body).toEqual({
      error: {
        code: 'CLAIM_STORAGE_FAILED',
        message: 'Unable to create claim.',
      },
    });
  });
});

describe('claim ownership HTTP policy', () => {
  async function create(id: string = 'claimant-1') {
    return request(app.getHttpServer())
      .post('/api/claims')
      .set('X-Demo-Actor-Id', id)
      .send(input)
      .expect(201);
  }
  it('assigns ownership from verified actor and permits own lookup', async () => {
    const result = await create('claimant-2');
    expect(result.body.ownerActorId).toBe('claimant-2');
    const read = await request(app.getHttpServer())
      .get(`/api/claims/${result.body.id}`)
      .set('X-Demo-Actor-Id', 'claimant-2')
      .expect(200);
    expect(read.body).toEqual(result.body);
  });
  it('conceals another owner with exactly the missing-claim error', async () => {
    const created = await create();
    const hidden = await request(app.getHttpServer())
      .get(`/api/claims/${created.body.id}`)
      .set('X-Demo-Actor-Id', 'claimant-2')
      .expect(404);
    const absent = await request(app.getHttpServer())
      .get(`/api/claims/${randomUUID()}`)
      .set('X-Demo-Actor-Id', 'claimant-2')
      .expect(404);
    expect(hidden.body).toEqual(absent.body);
    expect(hidden.body).toEqual({
      error: { code: 'CLAIM_NOT_FOUND', message: 'Claim not found.' },
    });
  });
  it('lists only own claims and allows adjuster reads across owners', async () => {
    const first = await create();
    const second = await create('claimant-2');
    for (const [id, owned] of [
      ['claimant-1', first.body.id],
      ['claimant-2', second.body.id],
    ]) {
      const page = await request(app.getHttpServer())
        .get('/api/claims')
        .set('X-Demo-Actor-Id', id)
        .expect(200);
      expect(page.body.items.map((item: { id: string }) => item.id)).toEqual([
        owned,
      ]);
      await request(app.getHttpServer())
        .get(`/api/claims/${owned}`)
        .set('X-Demo-Actor-Id', 'adjuster-1')
        .expect(200);
    }
    const all = await request(app.getHttpServer())
      .get('/api/claims')
      .set('X-Demo-Actor-Id', 'adjuster-1')
      .expect(200);
    expect(all.body.items).toHaveLength(2);
  });
  it('denies adjuster creation and ignores spoofed role headers', async () => {
    const denied = await request(app.getHttpServer())
      .post('/api/claims')
      .set('X-Demo-Actor-Id', 'adjuster-1')
      .set('X-Role', 'claimant')
      .send(input)
      .expect(403);
    expect(denied.body.error.code).toBe('CLAIM_CREATION_FORBIDDEN');
    const page = await request(app.getHttpServer())
      .get('/api/claims')
      .set('X-Demo-Actor-Id', 'adjuster-1')
      .expect(200);
    expect(page.body.items).toEqual([]);
  });
  it.each(['ownerActorId', 'owner_actor_id', 'ownerId', 'role'])(
    'rejects supplied %s in body and query',
    async (field) => {
      const created = await create();
      const body = await request(app.getHttpServer())
        .post('/api/claims')
        .set('X-Demo-Actor-Id', 'claimant-1')
        .send({ ...input, [field]: 'claimant-2' })
        .expect(400);
      expect(body.body.error.code).toBe('INVALID_REQUEST');
      for (const path of ['/api/claims', `/api/claims/${created.body.id}`]) {
        const result = await request(app.getHttpServer())
          .get(path)
          .query({ [field]: 'claimant-2' })
          .set('X-Demo-Actor-Id', 'claimant-1')
          .expect(400);
        expect(result.body.error.code).toBe('INVALID_REQUEST');
      }
      await request(app.getHttpServer())
        .post('/api/claims')
        .query({ [field]: 'claimant-2' })
        .set('X-Demo-Actor-Id', 'claimant-1')
        .send(input)
        .expect(400);
    },
  );
  it('shows legacy unowned claims only to adjusters', async () => {
    const id = randomUUID();
    const now = new Date().toISOString();
    app
      .get(DatabaseService)
      .connection.prepare(
        `INSERT INTO claims (id, workflow_id, workflow_version, state, title, description, created_at, updated_at)
      VALUES (?, 'claims', 1, 'draft', 'Legacy', 'Unknown owner', ?, ?)`,
      )
      .run(id, now, now);
    for (const actor of ['claimant-1', 'claimant-2']) {
      await request(app.getHttpServer())
        .get(`/api/claims/${id}`)
        .set('X-Demo-Actor-Id', actor)
        .expect(404);
      const own = await request(app.getHttpServer())
        .get('/api/claims')
        .set('X-Demo-Actor-Id', actor)
        .expect(200);
      expect(own.body.items).toEqual([]);
    }
    const legacy = await request(app.getHttpServer())
      .get(`/api/claims/${id}`)
      .set('X-Demo-Actor-Id', 'adjuster-1')
      .expect(200);
    expect(legacy.body.ownerActorId).toBeNull();
    const all = await request(app.getHttpServer())
      .get('/api/claims')
      .set('X-Demo-Actor-Id', 'adjuster-1')
      .expect(200);
    expect(all.body.items).toHaveLength(1);
  });
  it('does not elevate a claimant using a role header', async () => {
    const created = await create('claimant-2');
    await request(app.getHttpServer())
      .get(`/api/claims/${created.body.id}`)
      .set('X-Demo-Actor-Id', 'claimant-1')
      .set('X-Role', 'adjuster')
      .expect(404);
  });
});
