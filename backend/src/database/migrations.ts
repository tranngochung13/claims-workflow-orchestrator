import { createHash } from 'node:crypto';
import type Database from 'better-sqlite3';

export interface Migration {
  readonly id: string;
  readonly sql: string;
}
export const MIGRATIONS: readonly Migration[] = Object.freeze([
  Object.freeze({
    id: '001_workflow_versions',
    sql: `CREATE TABLE workflow_versions (
      workflow_id TEXT NOT NULL CHECK(length(workflow_id) BETWEEN 1 AND 64),
      version INTEGER NOT NULL CHECK(version BETWEEN 1 AND 9007199254740991),
      schema_version INTEGER NOT NULL CHECK(schema_version = 1),
      definition_json TEXT NOT NULL CHECK(json_valid(definition_json)),
      definition_sha256 TEXT NOT NULL CHECK(length(definition_sha256) = 64 AND definition_sha256 NOT GLOB '*[^0-9a-f]*'),
      registered_at TEXT NOT NULL,
      PRIMARY KEY (workflow_id, version)
    ) STRICT;`,
  }),
  Object.freeze({
    id: '002_claims',
    sql: `CREATE TABLE claims (
      id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
      workflow_id TEXT NOT NULL,
      workflow_version INTEGER NOT NULL CHECK(workflow_version BETWEEN 1 AND 9007199254740991),
      state TEXT NOT NULL CHECK(length(trim(state)) BETWEEN 1 AND 64),
      title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
      description TEXT NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 2000),
      revision INTEGER NOT NULL DEFAULT 0 CHECK(revision BETWEEN 0 AND 9007199254740991),
      created_at TEXT NOT NULL CHECK(length(created_at) = 24),
      updated_at TEXT NOT NULL CHECK(length(updated_at) = 24),
      FOREIGN KEY (workflow_id, workflow_version) REFERENCES workflow_versions(workflow_id, version)
    ) STRICT;
    CREATE INDEX claims_created_at_id ON claims(created_at DESC, id DESC);
    CREATE INDEX claims_workflow_reference ON claims(workflow_id, workflow_version);
    CREATE TRIGGER claims_workflow_immutable
    BEFORE UPDATE OF workflow_id, workflow_version ON claims
    WHEN OLD.workflow_id != NEW.workflow_id OR OLD.workflow_version != NEW.workflow_version
    BEGIN SELECT RAISE(ABORT, 'Claim workflow reference is immutable'); END;`,
  }),
  Object.freeze({
    id: '003_claim_ownership',
    sql: `ALTER TABLE claims ADD COLUMN owner_actor_id TEXT
      CHECK(owner_actor_id IS NULL OR (length(trim(owner_actor_id)) BETWEEN 1 AND 64 AND owner_actor_id = trim(owner_actor_id)));
    CREATE INDEX claims_owner_created_at_id ON claims(owner_actor_id, created_at DESC, id DESC);
    CREATE TRIGGER claims_owner_immutable
    BEFORE UPDATE OF owner_actor_id ON claims
    WHEN OLD.owner_actor_id IS NOT NEW.owner_actor_id
    BEGIN SELECT RAISE(ABORT, 'Claim ownership is immutable'); END;`,
  }),
  Object.freeze({
    id: '004_workflow_transitions',
    sql: `ALTER TABLE claims ADD COLUMN information_request_count INTEGER NOT NULL DEFAULT 0 CHECK(information_request_count BETWEEN 0 AND 3);
    CREATE TABLE transition_events (
      id TEXT PRIMARY KEY NOT NULL,
      claim_id TEXT NOT NULL REFERENCES claims(id),
      actor_id TEXT NOT NULL,
      actor_role TEXT NOT NULL CHECK(actor_role IN ('claimant', 'adjuster')),
      transition_id TEXT NOT NULL,
      from_state TEXT NOT NULL,
      to_state TEXT NOT NULL,
      previous_revision INTEGER NOT NULL CHECK(previous_revision >= 0),
      resulting_revision INTEGER NOT NULL CHECK(resulting_revision = previous_revision + 1),
      input_json TEXT NOT NULL CHECK(json_valid(input_json)),
      created_at TEXT NOT NULL,
      UNIQUE(claim_id, resulting_revision)
    ) STRICT;
    CREATE TABLE notifications (
      id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL REFERENCES transition_events(id),
      effect_index INTEGER NOT NULL CHECK(effect_index >= 0),
      recipient_actor_id TEXT NOT NULL,
      template TEXT NOT NULL CHECK(template IN ('information_requested', 'claim_approved', 'claim_rejected')),
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(event_id, effect_index)
    ) STRICT;
    CREATE TABLE command_receipts (
      command_id TEXT PRIMARY KEY NOT NULL,
      event_id TEXT NOT NULL UNIQUE REFERENCES transition_events(id),
      fingerprint TEXT NOT NULL CHECK(length(fingerprint) = 64),
      result_json TEXT NOT NULL CHECK(json_valid(result_json))
    ) STRICT;
    CREATE TRIGGER transition_events_no_update BEFORE UPDATE ON transition_events BEGIN SELECT RAISE(ABORT, 'Transition events are immutable'); END;
    CREATE TRIGGER transition_events_no_delete BEFORE DELETE ON transition_events BEGIN SELECT RAISE(ABORT, 'Transition events are immutable'); END;
    CREATE TRIGGER notifications_no_update BEFORE UPDATE ON notifications BEGIN SELECT RAISE(ABORT, 'Notifications are immutable'); END;
    CREATE TRIGGER notifications_no_delete BEFORE DELETE ON notifications BEGIN SELECT RAISE(ABORT, 'Notifications are immutable'); END;
    CREATE TRIGGER command_receipts_no_update BEFORE UPDATE ON command_receipts BEGIN SELECT RAISE(ABORT, 'Command receipts are immutable'); END;
    CREATE TRIGGER command_receipts_no_delete BEFORE DELETE ON command_receipts BEGIN SELECT RAISE(ABORT, 'Command receipts are immutable'); END;`,
  }),
  Object.freeze({
    id: '005_payment_initiations',
    sql: `CREATE TABLE payment_initiations (
      event_id TEXT PRIMARY KEY NOT NULL REFERENCES transition_events(id),
      claim_id TEXT NOT NULL UNIQUE REFERENCES claims(id),
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE TRIGGER payment_initiations_no_update BEFORE UPDATE ON payment_initiations BEGIN SELECT RAISE(ABORT, 'Payment initiation records are immutable'); END;
    CREATE TRIGGER payment_initiations_no_delete BEFORE DELETE ON payment_initiations BEGIN SELECT RAISE(ABORT, 'Payment initiation records are immutable'); END;`,
  }),
]);

export class DatabaseError extends Error {
  constructor(
    readonly code:
      | 'DATABASE_INITIALIZATION_FAILED'
      | 'MIGRATION_FAILED'
      | 'MIGRATION_DRIFT'
      | 'DATABASE_OPERATION_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}
export function migrationChecksum(migration: Migration): string {
  return createHash('sha256').update(migration.sql, 'utf8').digest('hex');
}
export function runMigrations(
  db: Database.Database,
  migrations: readonly Migration[] = MIGRATIONS,
): void {
  try {
    db.transaction(() => {
      db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY NOT NULL,
        checksum TEXT NOT NULL CHECK(length(checksum) = 64),
        applied_at TEXT NOT NULL
      ) STRICT`);
      const ids = migrations.map((migration) => migration.id);
      if (
        new Set(ids).size !== ids.length ||
        ids.some(
          (id, index) =>
            !/^[0-9]{3}_[a-z0-9_]+$/.test(id) ||
            (index > 0 && id <= ids[index - 1]),
        )
      ) {
        throw new DatabaseError(
          'MIGRATION_DRIFT',
          'Migration identifiers must be unique and ordered.',
        );
      }
      const applied = db
        .prepare('SELECT id, checksum FROM schema_migrations ORDER BY id')
        .all();
      applied.forEach((row, index) => {
        if (
          typeof row !== 'object' ||
          row === null ||
          !('id' in row) ||
          !('checksum' in row)
        ) {
          throw new DatabaseError(
            'MIGRATION_DRIFT',
            'Invalid migration history.',
          );
        }
        const expected = migrations[index];
        if (
          !expected ||
          row.id !== expected.id ||
          row.checksum !== migrationChecksum(expected)
        ) {
          throw new DatabaseError(
            'MIGRATION_DRIFT',
            'Applied migration history does not match this application. Restore the matching migration set.',
          );
        }
      });
      const insert = db.prepare(
        'INSERT INTO schema_migrations (id, checksum, applied_at) VALUES (?, ?, ?)',
      );
      for (const migration of migrations.slice(applied.length)) {
        db.exec(migration.sql);
        insert.run(
          migration.id,
          migrationChecksum(migration),
          new Date().toISOString(),
        );
      }
    }).immediate();
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(
      'MIGRATION_FAILED',
      'Database migration failed; no pending migrations were committed.',
    );
  }
}
