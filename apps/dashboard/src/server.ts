import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', '.data')
const port = Number(process.env.PORT ?? 8787)

fs.mkdirSync(dataDir, { recursive: true })

type Store = {
  projects: Record<string, { id: string; name: string; secrets: Record<string, string> }>
}

function load(): Store {
  const p = path.join(dataDir, 'store.json')
  if (!fs.existsSync(p)) return { projects: {} }
  return JSON.parse(fs.readFileSync(p, 'utf8')) as Store
}

function save(store: Store): void {
  fs.writeFileSync(path.join(dataDir, 'store.json'), JSON.stringify(store, null, 2) + '\n')
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body, null, 2))
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const defaultSecrets = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_from_dashboard',
  CLERK_SECRET_KEY: 'sk_test_from_dashboard',
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`)
  const store = load()

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(`<!doctype html>
<html><head><title>Dudgital Dashboard</title>
<style>
  body{font-family:ui-sans-serif,system-ui;margin:0;background:#0f1419;color:#e7ecf1}
  main{max-width:720px;margin:48px auto;padding:0 24px}
  h1{font-size:2rem;letter-spacing:-0.03em}
  code{background:#1c2430;padding:2px 6px;border-radius:4px}
  .card{background:#161d27;border:1px solid #2a3544;border-radius:12px;padding:20px;margin-top:24px}
</style></head>
<body><main>
  <h1>Dudgital</h1>
  <p>Control plane MVP — projects &amp; secrets for <code>dg login</code> / <code>dg link</code> / <code>dg secrets pull</code>.</p>
  <div class="card">
    <p>Projects: <strong>${Object.keys(store.projects).length}</strong></p>
    <p>API: <code>POST /api/projects</code> · <code>GET /api/projects/:id/secrets</code></p>
  </div>
</main></body></html>`)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/projects') {
    const raw = await readBody(req)
    const body = JSON.parse(raw || '{}') as { id?: string; name?: string }
    const id = body.id ?? `proj_${Date.now().toString(36)}`
    store.projects[id] = {
      id,
      name: body.name ?? id,
      secrets: { ...defaultSecrets },
    }
    save(store)
    return json(res, 201, store.projects[id])
  }

  const secretsMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/secrets$/)
  if (req.method === 'GET' && secretsMatch) {
    const id = decodeURIComponent(secretsMatch[1])
    const project = store.projects[id]
    if (!project) {
      // Auto-create for local DX
      store.projects[id] = { id, name: id, secrets: { ...defaultSecrets } }
      save(store)
      return json(res, 200, store.projects[id].secrets)
    }
    return json(res, 200, project.secrets)
  }

  if (req.method === 'PUT' && secretsMatch) {
    const id = decodeURIComponent(secretsMatch[1])
    const raw = await readBody(req)
    const secrets = JSON.parse(raw || '{}') as Record<string, string>
    store.projects[id] ??= { id, name: id, secrets: {} }
    store.projects[id].secrets = { ...store.projects[id].secrets, ...secrets }
    save(store)
    return json(res, 200, store.projects[id].secrets)
  }

  json(res, 404, { error: 'not found' })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Dudgital dashboard listening on http://127.0.0.1:${port}`)
})
