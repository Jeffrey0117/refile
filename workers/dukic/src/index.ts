import { Hono } from 'hono'
import { corsMiddleware } from './middleware/cors'
import { authMiddleware, type AuthEnv } from './middleware/auth'
import { createUploadRoute, type UploadEnv } from './routes/upload'
import { createServeRoute } from './routes/serve'
import { createMetaRoute } from './routes/meta'

type Env = AuthEnv & UploadEnv

const app = new Hono<{ Bindings: Env }>()

app.use('*', corsMiddleware)

app.route('/', createServeRoute())
app.route('/', createMetaRoute())

app.use('/upload', authMiddleware)
app.route('/', createUploadRoute())

app.get('/health', (c) => c.json({ status: 'ok', service: 'dukic', version: '0.1.0' }))

export default app
