import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import type { OnModuleDestroy } from '@nestjs/common';
import { DatabaseError, runMigrations } from './migrations.js';

export const DATABASE_PATH = Symbol('DATABASE_PATH');
export const DEFAULT_DATABASE_PATH = fileURLToPath(
  new URL('../../data/claims.sqlite', import.meta.url),
);
export function configuredDatabasePath(): string {
  const path = process.env.SQLITE_DATABASE_PATH;
  if (path !== undefined && !path.trim())
    throw new DatabaseError(
      'DATABASE_INITIALIZATION_FAILED',
      'SQLITE_DATABASE_PATH must not be empty.',
    );
  // Tests must never silently use the development file.
  if (path === undefined && process.env.NODE_ENV === 'test') return ':memory:';
  return path ?? DEFAULT_DATABASE_PATH;
}
export class DatabaseService implements OnModuleDestroy {
  readonly connection: Database.Database;
  constructor(path: string) {
    let connection: Database.Database | undefined;
    try {
      if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
      connection = new Database(path, { timeout: 5000 });
      connection.pragma('foreign_keys = ON');
      connection.pragma('journal_mode = WAL');
      connection.pragma('synchronous = FULL');
      runMigrations(connection);
      this.connection = connection;
    } catch (error) {
      connection?.close();
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        'DATABASE_INITIALIZATION_FAILED',
        'Unable to initialize SQLite database. Check the database path and permissions.',
      );
    }
  }
  close(): void {
    if (this.connection.open) this.connection.close();
  }
  onModuleDestroy(): void {
    this.close();
  }
}
