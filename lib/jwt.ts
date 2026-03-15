import { SignJWT, jwtVerify, type JWTPayload as JosePayload } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-production'
);

export interface AdminJWTPayload extends JosePayload {
  sub: string;
  username: string;
}

export async function signJWT(payload: Omit<AdminJWTPayload, keyof JosePayload> & Pick<AdminJWTPayload, 'sub'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<AdminJWTPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as AdminJWTPayload;
}
