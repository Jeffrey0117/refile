import type { Context, Next } from 'hono'

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8787',
])

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('Origin') ?? ''

  if (ALLOWED_ORIGINS.has(origin)) {
    c.header('Access-Control-Allow-Origin', origin)
    c.header('Vary', 'Origin')
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.header('Access-Control-Max-Age', '86400')

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
}
