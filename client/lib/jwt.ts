import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const EXPIRES_IN = '15m';

export type JwtPayload = {
  sub: string;
  email: string;
  name?: string | null;
};

export function createAppToken(payload: JwtPayload): string {
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      name: payload.name ?? null,
    },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}
