import { resolveDemoActor } from './claim-access.js';
const claimant = resolveDemoActor('claimant-1');
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { DatabaseService } from '../database/database.service.js';
import {
  MIGRATIONS,
  migrationChecksum,
  runMigrations,
} from '../database/migrations.js';
import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
import { ClaimService } from './claim.service.js';
let directory: string;
let db: DatabaseService;
let registry: WorkflowRegistryService;
let config: WorkflowConfigService;
let service: ClaimService;
const input = {
  title: 'Laptop damage',
  description: 'Screen damaged in transport.',
};
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'claims-service-'));
  db = new DatabaseService(join(directory, 'test.sqlite'));
  registry = new WorkflowRegistryService(db);
  config = new WorkflowConfigService(
    new URL('../../config/claims.v1.json', import.meta.url),
  );
  registry.register(config.definition);
  service = new ClaimService(db, registry, config);
});
afterEach(() => {
  db?.close();
  vi.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});
describe('claim persistence and pinning', () => {
  it('creates a persisted claim with initial state, zero revision, UUID and UTC timestamps', () => {
    const before = Date.now();
    const claim = service.create(input, claimant);
    expect(claim).toMatchObject({
      ...input,
      workflowId: 'claims',
      workflowVersion: 1,
      state: 'draft',
      revision: 0,
    });
    expect(claim.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Date.parse(claim.createdAt)).toBeGreaterThanOrEqual(before);
    expect(new Date(claim.createdAt).toISOString()).toBe(claim.createdAt);
    expect(claim.updatedAt).toBe(claim.createdAt);
    expect(service.get(claim.id, claimant)).toEqual(claim);
  });
  it('trims required text', () => {
    expect(
      service.create(
        { title: '  Title  ', description: '\n Details\t' },
        claimant,
      ),
    ).toMatchObject({ title: 'Title', description: 'Details' });
  });
  it.each([
    {},
    null,
    [],
    { title: '', description: 'x' },
    { title: ' \t\n', description: 'x' },
    { title: 'x', description: '　 ' },
    { title: 5, description: 'x' },
    { title: 'x', description: {} },
    { title: 'x'.repeat(121), description: 'x' },
    { title: 'x', description: 'x'.repeat(2001) },
    { ...input, state: 'approved' },
    { ...input, roles: ['adjuster'] },
  ])('rejects invalid creation input %j', (value) => {
    expect(() => service.create(value, claimant)).toThrow(
      expect.objectContaining({ code: 'INVALID_REQUEST', status: 400 }),
    );
    expect(service.list(claimant).items).toHaveLength(0);
  });
  it('accepts exactly maximum-length business fields', () => {
    expect(
      service.create(
        { title: 'x'.repeat(120), description: 'x'.repeat(2000) },
        claimant,
      ).description,
    ).toHaveLength(2000);
  });
  it('reports unknown and malformed claim IDs with a stable code', () => {
    for (const id of [randomUUID(), 'not-a-uuid'])
      expect(() => service.get(id, claimant)).toThrow(
        expect.objectContaining({ code: 'CLAIM_NOT_FOUND', status: 404 }),
      );
  });
  it('paginates with stable ordering including equal timestamps', () => {
    const a = service.create(input, claimant);
    const b = service.create(input, claimant);
    const c = service.create(input, claimant);
    db.connection.prepare('UPDATE claims SET created_at=?').run(a.createdAt);
    const expected = [a.id, b.id, c.id].sort().reverse();
    expect(service.list(claimant, 2, 0).items.map((claim) => claim.id)).toEqual(
      expected.slice(0, 2),
    );
    expect(service.list(claimant, 2, 2).items.map((claim) => claim.id)).toEqual(
      expected.slice(2),
    );
    expect(service.list(claimant, 2, 3)).toEqual({
      items: [],
      limit: 2,
      offset: 3,
    });
    expect(service.list(claimant)).toMatchObject({ limit: 50, offset: 0 });
  });
  it.each([
    [0, 0],
    [101, 0],
    [1.5, 0],
    [10, -1],
    [10, Number.MAX_SAFE_INTEGER + 1],
  ])('rejects invalid pagination %j %j', (limit, offset) => {
    expect(() => service.list(claimant, limit, offset)).toThrow(
      expect.objectContaining({ code: 'INVALID_REQUEST' }),
    );
  });
  it('does not choose latest registered version or rewrite existing claims', () => {
    const claim = service.create(input, claimant);
    registry.register({
      ...config.definition,
      version: 2,
      initialState: 'submitted',
      states: config.definition.states.filter((state) => state.id !== 'draft'),
      transitions: config.definition.transitions.filter(
        (transition) => transition.from !== 'draft',
      ),
    });
    expect(service.get(claim.id, claimant)).toEqual(claim);
    expect(service.resolveWorkflow(claim.id, claimant).definition.version).toBe(
      1,
    );
    expect(
      service.resolveWorkflow(claim.id, claimant).definition.initialState,
    ).toBe('draft');
    expect(service.create(input, claimant).workflowVersion).toBe(1);
  });
  it('uses exact configured version initial state for new claims', () => {
    const version2 = {
      ...config.definition,
      version: 2,
      initialState: 'submitted',
      states: config.definition.states.filter((state) => state.id !== 'draft'),
      transitions: config.definition.transitions.filter(
        (transition) => transition.from !== 'draft',
      ),
    };
    registry.register(version2);
    const configured = { definition: version2 };
    const newService = new ClaimService(db, registry, configured);
    const claim = newService.create(input, claimant);
    expect(claim).toMatchObject({ workflowVersion: 2, state: 'submitted' });
    expect(newService.resolveWorkflow(claim.id, claimant).definition).toEqual(
      version2,
    );
  });
  it('refuses unregistered configured versions without inserting claims', () => {
    const configured = { definition: { ...config.definition, version: 99 } };
    expect(() =>
      new ClaimService(db, registry, configured).create(input, claimant),
    ).toThrow(expect.objectContaining({ code: 'CLAIM_WORKFLOW_UNAVAILABLE' }));
    expect(service.list(claimant).items).toHaveLength(0);
  });
  it('database foreign keys reject nonexistent references', () => {
    const claim = service.create(input, claimant);
    expect(() =>
      db.connection
        .prepare(
          'INSERT INTO claims (id, workflow_id, workflow_version, state, title, description, revision, created_at, updated_at) SELECT ?, workflow_id, 99, state, title, description, revision, created_at, updated_at FROM claims WHERE id=?',
        )
        .run(randomUUID(), claim.id),
    ).toThrow('FOREIGN KEY');
  });
  it('database prevents repinning to an existing version', () => {
    const claim = service.create(input, claimant);
    registry.register({ ...config.definition, version: 2 });
    expect(() =>
      db.connection
        .prepare('UPDATE claims SET workflow_version=2 WHERE id=?')
        .run(claim.id),
    ).toThrow('immutable');
    expect(service.get(claim.id, claimant).workflowVersion).toBe(1);
  });
  it('database rejects invalid required fields and revisions', () => {
    service.create(input, claimant);
    for (const sql of [
      "UPDATE claims SET title=''",
      'UPDATE claims SET description=NULL',
      "UPDATE claims SET state=' '",
      'UPDATE claims SET revision=-1',
      'UPDATE claims SET revision=1.5',
    ])
      expect(() => db.connection.exec(sql)).toThrow();
    expect(service.list(claimant).items[0].revision).toBe(0);
  });
  it('migration rerun preserves workflow and claim rows', () => {
    const original = service.create(input, claimant);
    runMigrations(db.connection);
    runMigrations(db.connection);
    expect(service.get(original.id, claimant)).toEqual(original);
    expect(registry.get('claims', 1).definition).toEqual(config.definition);
  });
  it('upgrades a Task 04 database without changing registered workflows', () => {
    const file = join(directory, 'old.sqlite');
    const old = new Database(file);
    try {
      runMigrations(old, [MIGRATIONS[0]]);
      const stored = db.connection
        .prepare('SELECT * FROM workflow_versions')
        .get();
      if (!stored || typeof stored !== 'object')
        throw new Error('Missing fixture workflow');
      old
        .prepare(
          'INSERT INTO workflow_versions (workflow_id, version, schema_version, definition_json, definition_sha256, registered_at) VALUES (@workflow_id, @version, @schema_version, @definition_json, @definition_sha256, @registered_at)',
        )
        .run(stored);
    } finally {
      old.close();
    }
    const upgraded = new DatabaseService(file);
    try {
      expect(
        upgraded.connection
          .prepare("SELECT name FROM sqlite_master WHERE name='claims'")
          .get(),
      ).toEqual({ name: 'claims' });
      expect(new WorkflowRegistryService(upgraded).get('claims', 1)).toEqual(
        registry.get('claims', 1),
      );
    } finally {
      upgraded.close();
    }
  });
  it('persists claims and pinning across close/reopen', () => {
    const claim = service.create(input, claimant);
    db.close();
    db = new DatabaseService(join(directory, 'test.sqlite'));
    registry = new WorkflowRegistryService(db);
    service = new ClaimService(db, registry, config);
    expect(service.get(claim.id, claimant)).toEqual(claim);
    expect(service.resolveWorkflow(claim.id, claimant).definition.version).toBe(
      1,
    );
  });
  it('sanitizes database errors', () => {
    const claim = service.create(input, claimant);
    db.close();
    expect(() => service.create(input, claimant)).toThrow(
      expect.objectContaining({
        code: 'CLAIM_STORAGE_FAILED',
        message: 'Unable to create claim.',
      }),
    );
    expect(() => service.get(claim.id, claimant)).toThrow(
      'Unable to retrieve claim.',
    );
    expect(() => service.list(claimant)).toThrow('Unable to list claims.');
  });
  it('fails safely if pinned workflow content becomes invalid', () => {
    const claim = service.create(input, claimant);
    db.connection.exec("UPDATE workflow_versions SET definition_json='{}'");
    expect(() => service.resolveWorkflow(claim.id, claimant)).toThrow(
      expect.objectContaining({ code: 'CLAIM_WORKFLOW_UNAVAILABLE' }),
    );
  });
  it('keeps migration 001 checksum unchanged', () => {
    expect(migrationChecksum(MIGRATIONS[0])).toBe(
      '306d576e7ec1decd06e12b6c66758400b07a0e1bf35e9c228149e8c8db165a6a',
    );
  });
});
