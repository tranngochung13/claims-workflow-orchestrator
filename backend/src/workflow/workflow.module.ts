import { Module } from '@nestjs/common';
import { WorkflowConfigService } from './workflow-config.service.js';

@Module({
  providers: [
    {
      provide: WorkflowConfigService,
      useFactory: () => new WorkflowConfigService(),
    },
  ],
  exports: [WorkflowConfigService],
})
export class WorkflowModule {}
