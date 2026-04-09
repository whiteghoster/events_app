import {
  ExecutionContext,
  Injectable,
  CanActivate,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const user = await this.authService.validateToken(token);
      
      if (!user) {
        throw new UnauthorizedException('Session expired or unauthorised');
      }

      // Populate request.user for RolesGuard and @CurrentUser() decorator
      // Mapping Supabase user structure to our internal Admin/Staff structure
      request.user = {
        id: user.id,
        sub: user.id,
        email: user.email,
        role: user.user_metadata?.role || user.app_metadata?.role || 'staff',
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Session expired or unauthorised');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
