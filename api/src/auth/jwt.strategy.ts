import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './types/jwt-payload.type';
import type { Request } from 'express';

function cookieExtractor(req: Request | undefined): string | null {
  if (!req?.cookies) {
    return null;
  }

  const cookies = req.cookies as Record<string, string | undefined>;
  const token = cookies.access_token;

  return token ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        const tokenFromCookie = cookieExtractor(req);
        if (tokenFromCookie) {
          return tokenFromCookie;
        }
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  validate(payload: JwtPayload) {
    // This becomes req.user
    return { userId: payload.sub, email: payload.email };
  }
}
