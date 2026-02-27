import { Hono } from 'hono'
import { URL_PREFIX, isTrustedUrl } from '../config'
import { getFileRecord, type UploadEnv } from './upload'

export function createServeRoute() {
  const app = new Hono<{ Bindings: UploadEnv }>()

  // GET /v/:hash/:filename — redirect to fallback URL
  app.get(`/${URL_PREFIX}/:hash/:filename`, async (c) => {
    const hash = c.req.param('hash')
    const id = `${URL_PREFIX}/${hash}`
    const record = await getFileRecord(c.env.FILE_STORE, id)

    if (!record) {
      return c.json({ error: 'File not found' }, 404)
    }

    if (!isTrustedUrl(record.url)) {
      return c.json({ error: 'Stored URL is invalid' }, 502)
    }

    return c.redirect(record.url, 302)
  })

  // HEAD /v/:hash/:filename — verify file exists
  app.on('HEAD', `/${URL_PREFIX}/:hash/:filename`, async (c) => {
    const hash = c.req.param('hash')
    const id = `${URL_PREFIX}/${hash}`
    const record = await getFileRecord(c.env.FILE_STORE, id)

    if (!record) {
      return c.body(null, 404)
    }

    c.header('Content-Type', record.mime)
    c.header('Content-Length', String(record.size))
    return c.body(null, 200)
  })

  return app
}
