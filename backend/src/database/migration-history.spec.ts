import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import {
  DatabaseError,
  MIGRATIONS,
  migrationChecksum,
  runMigrations,
} from './migrations.js';
import { loadWorkflowDefinition } from '../workflow/workflow-config.service.js';
import {
  canonicalWorkflowJson,
  workflowDigest,
} from '../workflow/workflow-registry.service.js';

// Exact SQL recovered from the original Task 07 tool call. Its hash matches the
// existing application's stored ledger, unlike the subsequently hardened SQL.
const originalSql = readFileSync(
  new URL('./fixtures/004_workflow_transitions.original.sql', import.meta.url),
  'utf8',
);
const archivedMigration = { id: '004_workflow_transitions', sql: originalSql };
const historicalHashes = [
  '306d576e7ec1decd06e12b6c66758400b07a0e1bf35e9c228149e8c8db165a6a',
  'ede9401f0a11fa973173f0cf6160f7c931fbf945c710a7b5b55968310d05dcd5',
  'daec614a1a2674c99178164b13aa4258653e3846b014029c5c2ccbeb7692f508',
  '6940a9a79b6c29999b4038e38ec6e885f2d8be7c4fd75405a486ebad69e05db7',
];
const tables = [
  'schema_migrations',
  'workflow_versions',
  'claims',
  'transition_events',
  'notifications',
  'command_receipts',
] as const;
let directory: string;
let db: Database.Database;
function snapshot() {
  return tables.map((table) =>
    db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
  );
}
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'migration-history-'));
  db = new Database(join(directory, 'historical.sqlite'));
  db.pragma('foreign_keys=ON');
  // Initialize using the independently archived SQL, not the current migration 004.
  runMigrations(db, [...MIGRATIONS.slice(0, 3), archivedMigration]);
  const definition = loadWorkflowDefinition(
    new URL('../../config/claims.v1.json', import.meta.url),
  );
  const json = canonicalWorkflowJson(definition);
  const timestamp = '2026-10-19T10:00:00.000Z';
  const claimId = randomUUID();
  const eventId = randomUUID();
  const notificationId = randomUUID();
  db.prepare('INSERT INTO workflow_versions VALUES (?, ?, ?, ?, ?, ?)').run(
    'claims',
    1,
    1,
    json,
    workflowDigest(json),
    timestamp,
  );
  db.prepare(
    `INSERT INTO claims (id,workflow_id,workflow_version,state,title,description,revision,created_at,updated_at,owner_actor_id,information_request_count)
    VALUES (?,'claims',1,'awaiting_information','Damage','Existing claim',3,?,?,'claimant-1',1)`,
  ).run(claimId, timestamp, timestamp);
  db.prepare(
    `INSERT INTO transition_events VALUES (?,?,'adjuster-1','adjuster','request_information','under_review','awaiting_information',2,3,?,?)`,
  ).run(eventId, claimId, '{"message":"More information"}', timestamp);
  db.prepare('INSERT INTO notifications VALUES (?,?,0,?,?,?,?)').run(
    notificationId,
    eventId,
    'claimant-1',
    'information_requested',
    'Information requested: More information',
    timestamp,
  );
  db.prepare('INSERT INTO command_receipts VALUES (?,?,?,?)').run(
    randomUUID(),
    eventId,
    'a'.repeat(64),
    JSON.stringify({
      claimId,
      auditEventId: eventId,
      notificationIds: [notificationId],
    }),
  );
});
afterEach(() => {
  db?.close();
  rmSync(directory, { recursive: true, force: true });
});

describe('compatibility with already-applied migration history', () => {
  it('retains every verified historical checksum including original migration 004', () => {
    expect(migrationChecksum(archivedMigration)).toBe(historicalHashes[3]);
    expect(MIGRATIONS.slice(0, 4).map(migrationChecksum)).toEqual(
      historicalHashes,
    );
  });
  it('accepts a populated original database without changing history, schema, or data', () => {
    const before = snapshot();
    const schema = db
      .prepare('SELECT type,name,sql FROM sqlite_master ORDER BY name')
      .all();
    runMigrations(db, MIGRATIONS.slice(0, 4));
    runMigrations(db, MIGRATIONS.slice(0, 4));
    expect(snapshot()).toEqual(before);
    expect(
      db.prepare('SELECT type,name,sql FROM sqlite_master ORDER BY name').all(),
    ).toEqual(schema);
    expect(db.pragma('foreign_key_check')).toEqual([]);
  });
  it('rejects edited applied SQL and preserves the original ledger and all rows', () => {
    const before = snapshot();
    const changed = [
      ...MIGRATIONS.slice(0, 3),
      { ...archivedMigration, sql: `${originalSql}\n` },
    ];
    expect(() => runMigrations(db, changed)).toThrow(
      expect.objectContaining({ code: 'MIGRATION_DRIFT' }),
    );
    expect(snapshot()).toEqual(before);
  });
  it('rejects a renamed historical migration without rewriting history', () => {
    const before = snapshot();
    expect(() =>
      runMigrations(db, [
        ...MIGRATIONS.slice(0, 3),
        { ...archivedMigration, id: '004_renamed' },
      ]),
    ).toThrow(DatabaseError);
    expect(snapshot()).toEqual(before);
  });
  it('rejects a removed historical migration without deleting data', () => {
    const before = snapshot();
    expect(() => runMigrations(db, MIGRATIONS.slice(0, 3))).toThrow(
      expect.objectContaining({ code: 'MIGRATION_DRIFT' }),
    );
    expect(snapshot()).toEqual(before);
  });
});

it('adds payment records to a populated 001–004 database without changing existing rows', () => {
  const before = snapshot();
  const oldLedger = db
    .prepare('SELECT * FROM schema_migrations ORDER BY id')
    .all();
  runMigrations(db);
  expect(snapshot().slice(1)).toEqual(before.slice(1));
  expect(
    db.prepare('SELECT * FROM schema_migrations ORDER BY id').all().slice(0, 4),
  ).toEqual(oldLedger);
  expect(db.prepare('SELECT * FROM payment_initiations').all()).toEqual([]);
  expect(db.pragma('foreign_key_check')).toEqual([]);
  const upgraded = snapshot();
  runMigrations(db);
  expect(snapshot()).toEqual(upgraded);
});
