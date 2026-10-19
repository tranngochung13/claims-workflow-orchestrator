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
import {
  authorizeClaimCreation,
  claimReadOwner,
  requireVerifiedActor,
  resolveDemoActor,
} from './claim-access.js';
const first = resolveDemoActor('claimant-1');
const second = resolveDemoActor('claimant-2');
const adjuster = resolveDemoActor('adjuster-1');
const input = {
  title: 'Device damage',
  description: 'Screen damaged during delivery.',
};
let directory: string;
let database: DatabaseService;
let registry: WorkflowRegistryService;
let config: WorkflowConfigService;
let service: ClaimService;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'claim-access-'));
  database = new DatabaseService(join(directory, 'claims.sqlite'));
  registry = new WorkflowRegistryService(database);
  config = new WorkflowConfigService(
    new URL('../../config/claims.v1.json', import.meta.url),
  );
  registry.register(config.definition);
  service = new ClaimService(database, registry, config);
});
afterEach(() => {
  database?.close();
  vi.unstubAllEnvs();
  rmSync(directory, { recursive: true, force: true });
});
function legacy(): string {
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  database.connection
    .prepare(
      `INSERT INTO claims (id, workflow_id, workflow_version, state, title, description, created_at, updated_at)
    VALUES (?, 'claims', 1, 'draft', 'Legacy', 'Unknown creator', ?, ?)`,
    )
    .run(id, timestamp, timestamp);
  return id;
}
describe('claim ownership and centralized access policy', () => {
  it('assigns verified claimant as owner and permits own reads', () => {
    const claim = service.create(input, first);
    expect(claim.ownerActorId).toBe(first.id);
    expect(service.get(claim.id, first)).toEqual(claim);
    expect(
      database.connection
        .prepare('SELECT owner_actor_id FROM claims WHERE id=?')
        .get(claim.id),
    ).toEqual({ owner_actor_id: first.id });
  });
  it('conceals cross-owner and missing claims with identical errors', () => {
    const claim = service.create(input, first);
    for (const id of [claim.id, randomUUID()])
      expect(() => service.get(id, second)).toThrow(
        expect.objectContaining({
          code: 'CLAIM_NOT_FOUND',
          status: 404,
          message: 'Claim not found.',
        }),
      );
    expect(() => service.resolveWorkflow(claim.id, second)).toThrow(
      expect.objectContaining({ code: 'CLAIM_NOT_FOUND' }),
    );
  });
  it('filters before pagination and preserves ordering', () => {
    const a = service.create(input, first);
    const b = service.create(input, second);
    const c = service.create(input, first);
    const d = service.create(input, second);
    const e = service.create(input, first);
    [a, b, c, d, e].forEach((claim, index) =>
      database.connection
        .prepare('UPDATE claims SET created_at=? WHERE id=?')
        .run(`2026-10-19T10:00:0${index}.000Z`, claim.id),
    );
    expect(service.list(first, 2).items.map((claim) => claim.id)).toEqual([
      e.id,
      c.id,
    ]);
    expect(service.list(first, 2, 2).items.map((claim) => claim.id)).toEqual([
      a.id,
    ]);
    expect(service.list(second).items.map((claim) => claim.id)).toEqual([
      d.id,
      b.id,
    ]);
    expect(service.list(adjuster, 2).items.map((claim) => claim.id)).toEqual([
      e.id,
      d.id,
    ]);
  });
  it('allows adjuster reads for different owners and legacy rows', () => {
    const a = service.create(input, first);
    const b = service.create(input, second);
    const id = legacy();
    expect(service.get(a.id, adjuster)).toEqual(a);
    expect(service.get(b.id, adjuster)).toEqual(b);
    expect(service.get(id, adjuster).ownerActorId).toBeNull();
    expect(service.list(adjuster).items).toHaveLength(3);
  });
  it('hides unowned rows from all claimants', () => {
    const id = legacy();
    for (const actor of [first, second]) {
      expect(service.list(actor).items).toEqual([]);
      expect(() => service.get(id, actor)).toThrow(
        expect.objectContaining({ code: 'CLAIM_NOT_FOUND' }),
      );
    }
  });
  it('denies adjuster creation with a stable error', () => {
    expect(() => service.create(input, adjuster)).toThrow(
      expect.objectContaining({
        code: 'CLAIM_CREATION_FORBIDDEN',
        status: 403,
      }),
    );
    expect(service.list(adjuster).items).toEqual([]);
  });
  it('does not accept fabricated actor objects in direct service calls', () => {
    for (const actor of [
      undefined,
      { id: first.id, role: 'claimant' },
      { ...first },
      { id: second.id, role: 'adjuster' },
    ]) {
      expect(() =>
        Reflect.apply(service.create, service, [input, actor]),
      ).toThrow(expect.objectContaining({ code: 'IDENTITY_REQUIRED' }));
      expect(() => Reflect.apply(service.list, service, [actor])).toThrow(
        expect.objectContaining({ code: 'IDENTITY_REQUIRED' }),
      );
      expect(() =>
        Reflect.apply(service.get, service, [randomUUID(), actor]),
      ).toThrow(expect.objectContaining({ code: 'IDENTITY_REQUIRED' }));
    }
    expect(service.list(adjuster).items).toEqual([]);
  });
  it('keeps identity and role values frozen and backend-owned', () => {
    expect(Reflect.set(first, 'role', 'adjuster')).toBe(false);
    expect(first.role).toBe('claimant');
    expect(requireVerifiedActor(first)).toBe(first);
    expect(claimReadOwner(first)).toBe(first.id);
    expect(claimReadOwner(adjuster)).toBeNull();
    expect(authorizeClaimCreation(second)).toBe(second);
  });
  it.each([undefined, 'unknown', '__proto__', 'constructor', ['claimant-1']])(
    'rejects unknown identity %j',
    (actor) => {
      expect(() => resolveDemoActor(actor)).toThrow(
        expect.objectContaining({ code: 'IDENTITY_REQUIRED' }),
      );
    },
  );
  it.each([
    'ownerActorId',
    'owner_actor_id',
    'ownerId',
    'actor',
    'role',
    'roles',
  ])('rejects caller-supplied %s', (key) => {
    expect(() => service.create({ ...input, [key]: second.id }, first)).toThrow(
      expect.objectContaining({ code: 'INVALID_REQUEST' }),
    );
  });
  it('prevents ownership reassignment including adopting an unowned claim', () => {
    const claim = service.create(input, first);
    const id = legacy();
    expect(() =>
      database.connection
        .prepare('UPDATE claims SET owner_actor_id=? WHERE id=?')
        .run(second.id, claim.id),
    ).toThrow('ownership is immutable');
    expect(() =>
      database.connection
        .prepare('UPDATE claims SET owner_actor_id=? WHERE id=?')
        .run(first.id, id),
    ).toThrow('ownership is immutable');
    expect(service.get(claim.id, first).ownerActorId).toBe(first.id);
    expect(service.get(id, adjuster).ownerActorId).toBeNull();
  });
  it('upgrades populated Task 05 data without inventing ownership', () => {
    const file = join(directory, 'legacy.sqlite');
    const old = new Database(file);
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    try {
      old.pragma('foreign_keys=ON');
      runMigrations(old, MIGRATIONS.slice(0, 2));
      const row = database.connection
        .prepare('SELECT * FROM workflow_versions')
        .get();
      if (!row || typeof row !== 'object')
        throw new Error('Missing workflow fixture');
      old
        .prepare(
          'INSERT INTO workflow_versions VALUES (@workflow_id, @version, @schema_version, @definition_json, @definition_sha256, @registered_at)',
        )
        .run(row);
      old
        .prepare(
          "INSERT INTO claims VALUES (?, 'claims', 1, 'draft', 'Legacy', 'Unknown owner', 0, ?, ?)",
        )
        .run(id, timestamp, timestamp);
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
      expect(service.get(id, adjuster)).toMatchObject({
        ownerActorId: null,
        workflowVersion: 1,
        createdAt: timestamp,
      });
      expect(service.list(first).items).toEqual([]);
      expect(() => service.get(id, first)).toThrow('Claim not found');
      runMigrations(upgraded.connection);
      expect(
        upgraded.connection
          .prepare('SELECT count(*) AS count FROM schema_migrations')
          .get(),
      ).toEqual({ count: 5 });
      registry.register({ ...config.definition, version: 2 });
      expect(() =>
        upgraded.connection
          .prepare("UPDATE claims SET workflow_id='other' WHERE id=?")
          .run(id),
      ).toThrow('workflow reference is immutable');
    } finally {
      upgraded.close();
    }
  });
  it('preserves owner and exact workflow version across restart', () => {
    const claim = service.create(input, second);
    registry.register({ ...config.definition, version: 2 });
    database.close();
    database = new DatabaseService(join(directory, 'claims.sqlite'));
    service = new ClaimService(
      database,
      new WorkflowRegistryService(database),
      config,
    );
    expect(service.get(claim.id, second)).toEqual(claim);
    expect(service.resolveWorkflow(claim.id, second).definition.version).toBe(
      1,
    );
  });
  it('sanitizes storage failures for authorized actors', () => {
    const claim = service.create(input, first);
    database.close();
    expect(() => service.get(claim.id, first)).toThrow(
      expect.objectContaining({
        code: 'CLAIM_STORAGE_FAILED',
        message: 'Unable to retrieve claim.',
      }),
    );
    expect(() => service.list(adjuster)).toThrow('Unable to list claims.');
  });
  it('retains migration 001 and 002 checksums', () => {
    expect(MIGRATIONS.slice(0, 2).map(migrationChecksum)).toEqual([
      '306d576e7ec1decd06e12b6c66758400b07a0e1bf35e9c228149e8c8db165a6a',
      'ede9401f0a11fa973173f0cf6160f7c931fbf945c710a7b5b55968310d05dcd5',
    ]);
  });
});
