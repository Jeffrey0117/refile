import { Hono } from 'hono'
import { URL_PREFIX } from '../config'
import { getFileRecord, type UploadEnv } from './upload'

export function createMetaRoute() {
  const app = new Hono<{ Bindings: UploadEnv }>()

  // GET /v/:hash/meta — file metadata JSON (public, no provider info)
  app.get(`/${URL_PREFIX}/:hash/meta`, async (c) => {
    const hash = c.req.param('hash')
    const id = `${URL_PREFIX}/${hash}`
    const record = await getFileRecord(c.env.FILE_STORE, id)

    if (!record) {
      return c.json({ error: 'File not found' }, 404)
    }

    return c.json({
      id: record.id,
      hash: `sha256:${record.hash}`,
      size: record.size,
      mime: record.mime,
      filename: record.filename,
      uploadedAt: record.uploadedAt,
    })
  })

  return app
}
