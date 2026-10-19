import {
  ArgumentsHost,
  Catch,
  ForbiddenException,
  Injectable,
  createParamDecorator,
} from '@nestjs/common';
import type {
  CanActivate,
  ExceptionFilter,
  ExecutionContext,
  PipeTransform,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { resolveDemoActor, requireVerifiedActor } from './claim-access.js';
import type { VerifiedActor } from './claim-access.js';
import {
  ClaimError,
  parseClaimQuery,
  validateCreateClaim,
} from './claim.types.js';

// Request-scoped identity is private to this module and never sourced from a body.
const requestActors = new WeakMap<Request, VerifiedActor>();
export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): VerifiedActor => {
    return requireVerifiedActor(
      requestActors.get(context.switchToHttp().getRequest<Request>()),
    );
  },
);
@Injectable()
export class ClaimsDemoGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (
      process.env.NODE_ENV !== 'development' ||
      process.env.DEMO_IDENTITY_ENABLED !== 'true'
    ) {
      throw new ForbiddenException({
        error: {
          code: 'DEMO_IDENTITY_DISABLED',
          message: 'Claim API requires enabled development demo identity.',
        },
      });
    }
    const request = context.switchToHttp().getRequest<Request>();
    requestActors.set(
      request,
      resolveDemoActor(request.headers['x-demo-actor-id']),
    );
    return true;
  }
}
export class EmptyClaimQueryPipe implements PipeTransform<unknown> {
  transform(value: unknown): void {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.keys(value).length
    ) {
      throw new ClaimError(
        'INVALID_REQUEST',
        400,
        'This endpoint does not accept query parameters.',
      );
    }
  }
}
export class CreateClaimPipe implements PipeTransform<unknown> {
  transform(value: unknown) {
    return validateCreateClaim(value);
  }
}
export class ClaimQueryPipe implements PipeTransform<unknown> {
  transform(value: unknown) {
    return parseClaimQuery(value);
  }
}
@Catch(ClaimError)
export class ClaimExceptionFilter implements ExceptionFilter<ClaimError> {
  catch(error: ClaimError, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(error.status)
      .json({ error: { code: error.code, message: error.message } });
  }
}
