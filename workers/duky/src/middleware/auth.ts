import type { Context, Next } from 'hono'
import { timingSafeEqual } from 'hono/utils/buffer'

export interface AuthEnv {
  API_KEY: string
}

export async function authMiddleware(c: Context<{ Bindings: AuthEnv }>, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader

  const encoder = new TextEncoder()
  const expected = encoder.encode(c.env.API_KEY)
  const received = encoder.encode(token)

  if (expected.byteLength !== received.byteLength ||
      !(await timingSafeEqual(expected, received))) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
}
