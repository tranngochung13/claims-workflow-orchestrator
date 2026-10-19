import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { Test } from '@nestjs/testing';
import {
  DatabaseService,
  DATABASE_PATH,
  configuredDatabasePath,
} from './database.service.js';
import { MIGRATIONS, runMigrations } from './migrations.js';
import {
  WorkflowRegistryService,
  canonicalWorkflowJson,
} from '../workflow/workflow-registry.service.js';
import { WorkflowRegistryModule } from '../workflow/workflow-registry.module.js';
import {
  WorkflowConfigService,
  loadWorkflowDefinition,
} from '../workflow/workflow-config.service.js';
import { validateWorkflowDefinition } from '../workflow/workflow-config.validator.js';

let directory: string;
let database: DatabaseService;
let registry: WorkflowRegistryService;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'claims-db-'));
  database = new DatabaseService(join(directory, 'nested', 'test.sqlite'));
  registry = new WorkflowRegistryService(database);
});
afterEach(() => {
  database?.close();
  vi.unstubAllEnvs();
  rmSync(directory, { recursive: true, force: true });
});
const definition = () =>
  loadWorkflowDefinition(
    new URL('../../config/claims.v1.json', import.meta.url),
  );
const count = (
  db: DatabaseService,
  table: 'workflow_versions' | 'schema_migrations',
) => db.connection.prepare(`SELECT count(*) AS count FROM ${table}`).get();

describe('SQLite initialization and migrations', () => {
  it('creates parent directories and expected tables', () => {
    const tables = database.connection
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      )
      .all();
    expect(tables).toEqual([
      { name: 'claims' },
      { name: 'command_receipts' },
      { name: 'notifications' },
      { name: 'payment_initiations' },
      { name: 'schema_migrations' },
      { name: 'transition_events' },
      { name: 'workflow_versions' },
    ]);
    expect(count(database, 'schema_migrations')).toEqual({ count: 5 });
  });
  it('enforces primary key and check constraints', () => {
    registry.register(definition());
    expect(() =>
      database.connection.exec(
        'INSERT INTO workflow_versions SELECT * FROM workflow_versions',
      ),
    ).toThrow();
    expect(() =>
      database.connection.exec('UPDATE workflow_versions SET version=0'),
    ).toThrow();
    expect(() =>
      database.connection.exec('UPDATE workflow_versions SET schema_version=2'),
    ).toThrow();
    expect(() =>
      database.connection.exec(
        "UPDATE workflow_versions SET definition_json='bad'",
      ),
    ).toThrow();
    expect(() =>
      database.connection.exec(
        "UPDATE workflow_versions SET definition_sha256='bad'",
      ),
    ).toThrow();
  });
  it('migrations are idempotent', () => {
    runMigrations(database.connection);
    runMigrations(database.connection);
    expect(count(database, 'schema_migrations')).toEqual({ count: 5 });
    registry.register(definition());
    expect(count(database, 'workflow_versions')).toEqual({ count: 1 });
  });
  it('rolls back every pending migration on failure', () => {
    expect(() =>
      runMigrations(database.connection, [
        ...MIGRATIONS,
        { id: '005_probe', sql: 'CREATE TABLE probe (id INTEGER)' },
        { id: '006_fail', sql: 'INVALID SQL' },
      ]),
    ).toThrow('no pending migrations were committed');
    expect(
      database.connection
        .prepare("SELECT name FROM sqlite_master WHERE name='probe'")
        .get(),
    ).toBeUndefined();
    expect(count(database, 'schema_migrations')).toEqual({ count: 5 });
  });
  it('detects changed migration SQL', () => {
    expect(() =>
      runMigrations(database.connection, [
        { ...MIGRATIONS[0], sql: MIGRATIONS[0].sql + ' ' },
      ]),
    ).toThrow('history does not match');
  });
  it('detects an unexpected stored checksum', () => {
    database.connection
      .prepare('UPDATE schema_migrations SET checksum=?')
      .run('0'.repeat(64));
    expect(() => runMigrations(database.connection)).toThrow(
      'history does not match',
    );
  });
  it('rejects unknown applied migration history', () => {
    database.connection
      .prepare('INSERT INTO schema_migrations VALUES (?, ?, ?)')
      .run('999_unknown', '0'.repeat(64), new Date().toISOString());
    expect(() => runMigrations(database.connection)).toThrow(
      'history does not match',
    );
  });
  it('enforces foreign keys on every new connection', () => {
    expect(database.connection.pragma('foreign_keys', { simple: true })).toBe(
      1,
    );
    database.connection.exec(
      'CREATE TABLE parent(id INTEGER PRIMARY KEY); CREATE TABLE child(parent_id INTEGER REFERENCES parent(id))',
    );
    expect(() =>
      database.connection.exec('INSERT INTO child VALUES (99)'),
    ).toThrow('FOREIGN KEY');
  });
  it('closes cleanly and close is idempotent', () => {
    database.onModuleDestroy();
    database.close();
    expect(database.connection.open).toBe(false);
  });
  it('reports database initialization failures without exposing paths', () => {
    expect(
      () =>
        new DatabaseService(
          join(directory, 'nested', 'test.sqlite', 'impossible.sqlite'),
        ),
    ).toThrow('Unable to initialize SQLite database');
  });
  it('uses in-memory isolation in test mode without an explicit path', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SQLITE_DATABASE_PATH', undefined);
    expect(configuredDatabasePath()).toBe(':memory:');
  });
  it('supports explicit paths and rejects empty overrides', () => {
    vi.stubEnv('SQLITE_DATABASE_PATH', join(directory, 'custom.sqlite'));
    expect(configuredDatabasePath()).toBe(join(directory, 'custom.sqlite'));
    vi.stubEnv('SQLITE_DATABASE_PATH', '');
    expect(configuredDatabasePath).toThrow('must not be empty');
  });
});

describe('immutable workflow registry', () => {
  it('persists complete canonical definition and expected digest', () => {
    const value = definition();
    const result = registry.register(value);
    const json = canonicalWorkflowJson(value);
    expect(result.definition).toEqual(value);
    expect(result.sha256).toBe(
      createHash('sha256').update(json, 'utf8').digest('hex'),
    );
    expect(json).toMatch(/^\{"initialState":/);
    expect(
      database.connection
        .prepare(
          'SELECT definition_json, definition_sha256 FROM workflow_versions',
        )
        .get(),
    ).toEqual({ definition_json: json, definition_sha256: result.sha256 });
    expect(new Date(result.registeredAt).toISOString()).toBe(
      result.registeredAt,
    );
  });
  it('identical registration is idempotent and preserves timestamp', () => {
    const first = registry.register(definition());
    const second = registry.register(definition());
    expect(second).toEqual(first);
    expect(count(database, 'workflow_versions')).toEqual({ count: 1 });
  });
  it('object key ordering does not create conflicts', () => {
    const original = definition();
    registry.register(original);
    const reordered: unknown = JSON.parse(
      JSON.stringify(original),
      (_key: string, value: unknown): unknown => {
        if (value && typeof value === 'object' && !Array.isArray(value))
          return Object.fromEntries(Object.entries(value).reverse());
        return value;
      },
    );
    const result = registry.register(validateWorkflowDefinition(reordered));
    expect(result.definition).toEqual(original);
    expect(count(database, 'workflow_versions')).toEqual({ count: 1 });
  });
  it('rejects changed content and leaves original record untouched', () => {
    const value = definition();
    const first = registry.register(value);
    const before = database.connection
      .prepare('SELECT * FROM workflow_versions')
      .get();
    expect(() =>
      registry.register({ ...value, limits: { informationRequests: 2 } }),
    ).toThrow('Increment the workflow version');
    expect(
      database.connection.prepare('SELECT * FROM workflow_versions').get(),
    ).toEqual(before);
    expect(registry.get('claims', 1)).toEqual(first);
  });
  it('array order is preserved and affects version identity', () => {
    const value = definition();
    registry.register(value);
    expect(() =>
      registry.register({ ...value, states: [...value.states].reverse() }),
    ).toThrow('different content');
  });
  it('higher versions preserve older definitions', () => {
    const value = definition();
    const first = registry.register(value);
    registry.register({ ...value, version: 2 });
    expect(registry.get('claims', 1)).toEqual(first);
    expect(registry.get('claims', 2).definition.version).toBe(2);
  });
  it('different workflow IDs can share version numbers', () => {
    registry.register(definition());
    registry.register({ ...definition(), workflowId: 'other' });
    expect(registry.get('other', 1).definition.workflowId).toBe('other');
    expect(count(database, 'workflow_versions')).toEqual({ count: 2 });
  });
  it('retrieves full immutable validated definitions', () => {
    registry.register(definition());
    const result = registry.get('claims', 1);
    expect(result.definition).toEqual(definition());
    expect(
      Object.isFrozen(result.definition.transitions[0].preconditions),
    ).toBe(true);
  });
  it('reports missing versions', () => {
    expect(() => registry.get('claims', 99)).toThrow('not registered');
  });
  it.each([
    [
      'digest',
      "UPDATE workflow_versions SET definition_sha256='" + '0'.repeat(64) + "'",
    ],
    ['content', "UPDATE workflow_versions SET definition_json='{}'"],
    ['identity', "UPDATE workflow_versions SET workflow_id='other'"],
    ['timestamp', "UPDATE workflow_versions SET registered_at='bad'"],
  ])('detects tampered %s', (kind, sql) => {
    registry.register(definition());
    database.connection.exec(sql);
    expect(() =>
      registry.get(kind === 'identity' ? 'other' : 'claims', 1),
    ).toThrow('integrity validation');
  });
  it('rejects a conflicting stored hash even when incoming content matches', () => {
    registry.register(definition());
    database.connection
      .prepare('UPDATE workflow_versions SET definition_sha256=?')
      .run('0'.repeat(64));
    expect(() => registry.register(definition())).toThrow(
      'integrity validation',
    );
  });
  it('sanitizes database failures', () => {
    database.close();
    expect(() => registry.get('claims', 1)).toThrow(
      'Unable to read workflow version',
    );
    expect(() => registry.register(definition())).toThrow(
      'Unable to register workflow version',
    );
  });
  it('persists across database close and reopen', () => {
    const first = registry.register(definition());
    database.close();
    database = new DatabaseService(join(directory, 'nested', 'test.sqlite'));
    registry = new WorkflowRegistryService(database);
    expect(registry.get('claims', 1)).toEqual(first);
    expect(registry.register(definition())).toEqual(first);
  });
});

describe('Nest startup integration', () => {
  it('registers configuration automatically and closes on shutdown', async () => {
    const module = await Test.createTestingModule({
      imports: [WorkflowRegistryModule],
    })
      .overrideProvider(DATABASE_PATH)
      .useValue(join(directory, 'application.sqlite'))
      .compile();
    try {
      expect(
        module.get(WorkflowRegistryService).get('claims', 2).definition,
      ).toEqual(new WorkflowConfigService().definition);
      expect(module.get(DatabaseService).connection.open).toBe(true);
    } finally {
      await module.close();
    }
    expect(module.get(DatabaseService).connection.open).toBe(false);
  });
  it('registration conflict prevents startup and closes the opened connection', async () => {
    registry.register(definition());
    const module = Test.createTestingModule({
      imports: [WorkflowRegistryModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(database)
      .overrideProvider(WorkflowConfigService)
      .useValue({
        definition: { ...definition(), limits: { informationRequests: 2 } },
      });
    await expect(module.compile()).rejects.toThrow('different content');
    expect(database.connection.open).toBe(false);
  });
  it('invalid configuration prevents opening the database', async () => {
    const path = join(directory, 'invalid-config.sqlite');
    const module = Test.createTestingModule({
      imports: [WorkflowRegistryModule],
    })
      .overrideProvider(WorkflowConfigService)
      .useFactory({
        factory: () => ({ definition: validateWorkflowDefinition({}) }),
      })
      .overrideProvider(DATABASE_PATH)
      .useValue(path);
    await expect(module.compile()).rejects.toThrow(
      'Workflow configuration invalid',
    );
    expect(existsSync(path)).toBe(false);
  });
});
