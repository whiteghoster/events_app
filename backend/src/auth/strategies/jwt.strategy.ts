import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JWT_CONFIG } from '../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Read flat JWT_SECRET env var; fall back to hardcoded jwt.config value
      secretOrKey:
        configService.get<string>('JWT_SECRET') || JWT_CONFIG.secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const role =
      payload?.role ||
      payload?.user_metadata?.role ||
      payload?.app_metadata?.role ||
      null;

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      role,
      payload,
    };
  }
}