import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { DatabaseService } from '../database/database.service.js';
import { WorkflowModule } from '../workflow/workflow.module.js';
import { WorkflowConfigService } from '../workflow/workflow-config.service.js';
import { WorkflowRegistryModule } from '../workflow/workflow-registry.module.js';
import { WorkflowRegistryService } from '../workflow/workflow-registry.service.js';
import { TransitionService } from './transition.service.js';
import { ClaimWorkflowReadService } from './claim-workflow-read.service.js';
import { ClaimService } from './claim.service.js';
import { ClaimsController } from './claims.controller.js';
import { ClaimsDemoGuard } from './claims-http.js';
@Module({
  imports: [DatabaseModule, WorkflowModule, WorkflowRegistryModule],
  controllers: [ClaimsController],
  providers: [
    ClaimsDemoGuard,
    {
      provide: ClaimWorkflowReadService,
      inject: [DatabaseService, ClaimService],
      useFactory: (database: DatabaseService, claims: ClaimService) =>
        new ClaimWorkflowReadService(database, claims),
    },
    {
      provide: TransitionService,
      inject: [DatabaseService, ClaimService],
      useFactory: (database: DatabaseService, claims: ClaimService) =>
        new TransitionService(database, claims),
    },
    {
      provide: ClaimService,
      inject: [DatabaseService, WorkflowRegistryService, WorkflowConfigService],
      useFactory: (
        database: DatabaseService,
        registry: WorkflowRegistryService,
        config: WorkflowConfigService,
      ) => new ClaimService(database, registry, config),
    },
  ],
  exports: [ClaimService, TransitionService, ClaimWorkflowReadService],
})
export class ClaimsModule {}
