import { Request } from 'express';

/**
 * Request type used for routes protected by JwtAuthGuard.
 * JwtStrategy.validate() puts { userId, email } on req.user.
 */
export interface AuthRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}
