import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { SCOPE_KEY } from '../decorators/scope.decorator';
import { AuthInfo } from '../model/auth-info';
import { AuthScope } from '../model/auth-scope.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	constructor(private reflector: Reflector) {
		super();
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Check the JWT first
		if (!(await super.canActivate(context))) {
			return false;
		}

		// Check scope, if present
		const requiredScope = this.reflector.getAllAndOverride<AuthScope>(SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || null;

		const actualScope = (context.switchToHttp().getRequest().user as AuthInfo|undefined)?.scope || null;

		// Unscoped tokens have full access
		if (!actualScope) {
			return true;
		}

		return actualScope === requiredScope;
	}
}
