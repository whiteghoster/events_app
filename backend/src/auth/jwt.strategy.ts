import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('jwt.secret'),
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