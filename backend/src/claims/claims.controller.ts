import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpCode,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ClaimWorkflowReadService } from './claim-workflow-read.service.js';
import type {
  AvailableTransitions,
  ClaimAuditPage,
} from './claim-workflow-read.types.js';
import { TransitionService } from './transition.service.js';
import { ClaimService } from './claim.service.js';
import type { VerifiedActor } from './claim-access.js';
import type { CreateClaimDto } from './claim.types.js';
import {
  ClaimExceptionFilter,
  ClaimQueryPipe,
  ClaimsDemoGuard,
  CreateClaimPipe,
  CurrentActor,
  EmptyClaimQueryPipe,
} from './claims-http.js';

@Controller('api/claims')
@UseGuards(ClaimsDemoGuard)
@UseFilters(ClaimExceptionFilter)
export class ClaimsController {
  constructor(
    private readonly claims: ClaimService,
    private readonly transitions: TransitionService,
    private readonly workflowReads: ClaimWorkflowReadService,
  ) {}
  @Post()
  create(
    @Body(new CreateClaimPipe()) input: CreateClaimDto,
    @CurrentActor() actor: VerifiedActor,
    @Query(new EmptyClaimQueryPipe()) _query: unknown,
  ) {
    return this.claims.create(input, actor);
  }
  @Post(':id/transitions')
  @HttpCode(200)
  transition(
    @Param('id') id: string,
    @Body() input: unknown,
    @CurrentActor() actor: VerifiedActor,
    @Query(new EmptyClaimQueryPipe()) _query: unknown,
  ) {
    return this.transitions.execute(id, input, actor);
  }
  @Get()
  list(
    @Query(new ClaimQueryPipe()) query: { limit: number; offset: number },
    @CurrentActor() actor: VerifiedActor,
  ) {
    return this.claims.list(actor, query.limit, query.offset);
  }
  @Get(':id/available-transitions')
  availableTransitions(
    @Param('id') id: string,
    @CurrentActor() actor: VerifiedActor,
    @Query(new EmptyClaimQueryPipe()) _query: unknown,
  ): AvailableTransitions {
    return this.workflowReads.availableTransitions(id, actor);
  }
  @Get(':id/audit')
  audit(
    @Param('id') id: string,
    @CurrentActor() actor: VerifiedActor,
    @Query(new ClaimQueryPipe()) query: { limit: number; offset: number },
  ): ClaimAuditPage {
    return this.workflowReads.audit(id, actor, query.limit, query.offset);
  }
  @Get(':id')
  get(
    @Param('id') id: string,
    @CurrentActor() actor: VerifiedActor,
    @Query(new EmptyClaimQueryPipe()) _query: unknown,
  ) {
    return this.claims.get(id, actor);
  }
}
