import { createHmac } from 'crypto';

const SECRET = process.env.HUGSANDI_SESSION_SECRET || 'fallback-secret-change-me';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSessionToken(): string {
  const timestamp = Date.now().toString();
  const hmac = createHmac('sha256', SECRET).update(timestamp).digest('hex');
  return `${timestamp}:${hmac}`;
}

export function verifySessionToken(token: string): boolean {
  const parts = token.split(':');
  if (parts.length !== 2) return false;

  const [timestamp, providedHmac] = parts;
  const expectedHmac = createHmac('sha256', SECRET).update(timestamp).digest('hex');

  if (providedHmac !== expectedHmac) return false;

  const age = Date.now() - parseInt(timestamp, 10);
  if (age > SESSION_MAX_AGE) return false;

  return true;
}

export function verifyPassword(password: string): boolean {
  return password === process.env.HUGSANDI_PASSWORD;
}
