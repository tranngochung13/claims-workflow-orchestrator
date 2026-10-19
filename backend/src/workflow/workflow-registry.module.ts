import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { DatabaseService } from '../database/database.service.js';
import { WorkflowModule } from './workflow.module.js';
import { WorkflowConfigService } from './workflow-config.service.js';
import { WorkflowRegistryService } from './workflow-registry.service.js';

@Module({
  imports: [WorkflowModule, DatabaseModule],
  providers: [
    {
      provide: WorkflowRegistryService,
      inject: [DatabaseService, WorkflowConfigService],
      useFactory: (
        database: DatabaseService,
        config: WorkflowConfigService,
      ) => {
        try {
          const registry = new WorkflowRegistryService(database);
          registry.register(config.definition);
          return registry;
        } catch (error) {
          database?.close();
          throw error;
        }
      },
    },
  ],
  exports: [WorkflowRegistryService],
})
export class WorkflowRegistryModule {}
