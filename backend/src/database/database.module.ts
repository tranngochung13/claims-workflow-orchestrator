import { Module } from '@nestjs/common';
import { WorkflowModule } from '../workflow/workflow.module.js';
import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
import { WorkflowConfigurationError } from '../workflow/workflow-config.validator.js';
import {
  DatabaseService,
  DATABASE_PATH,
  configuredDatabasePath,
} from './database.service.js';

@Module({
  imports: [WorkflowModule],
  providers: [
    { provide: DATABASE_PATH, useFactory: configuredDatabasePath },
    {
      provide: DatabaseService,
      inject: [WorkflowConfigService, DATABASE_PATH],
      // Explicit dependency ensures config validation precedes opening SQLite.
      useFactory: (config: WorkflowConfigService, path: string) => {
        // Nest can resolve a failed dependency as null while unwinding startup.
        if (!config?.definition)
          throw new WorkflowConfigurationError([
            '/: validated workflow configuration is required before database initialization',
          ]);
        return new DatabaseService(path);
      },
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
