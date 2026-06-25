import { createServer } from 'node:http'
import { appendFile, mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const dataDir = path.join(rootDir, 'backend', 'data')
const rsvpFile = path.join(dataDir, 'rsvps.jsonl')
const port = Number(process.env.PORT || 5174)

const sendJson = (response, statusCode, data) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  response.end(JSON.stringify(data))
}

const parseBody = (request) =>
  new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk

      if (body.length > 1_000_000) {
        request.destroy()
        reject(new Error('Request body too large'))
      }
    })

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
  })

const handleRsvp = async (request, response) => {
  const body = await parseBody(request)
  const name = String(body.name || '').trim()
  const phone = String(body.phone || '').trim()
  const guests = Number(body.guests || 1)
  const attending = String(body.attending || '').trim()
  const message = String(body.message || '').trim()

  if (!name || !phone || !attending || guests < 1) {
    sendJson(response, 400, { message: 'Please provide valid RSVP details.' })
    return
  }

  await mkdir(dataDir, { recursive: true })
  await appendFile(
    rsvpFile,
    `${JSON.stringify({
      name,
      phone,
      guests,
      attending,
      message,
      createdAt: new Date().toISOString(),
    })}\n`,
  )

  sendJson(response, 201, { message: 'RSVP received.' })
}

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
}

const serveStatic = async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`)
  const safePath = path.normalize(decodeURIComponent(requestUrl.pathname)).replace(/^(\.\.[/\\])+/, '')
  let filePath = path.join(distDir, safePath === '/' ? 'index.html' : safePath)

  try {
    const fileStat = await stat(filePath)

    if (fileStat.isDirectory()) {
      filePath = path.join(filePath, 'index.html')
    }

    const file = await readFile(filePath)
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
    })
    response.end(file)
  } catch {
    try {
      const file = await readFile(path.join(distDir, 'index.html'))
      response.writeHead(200, { 'Content-Type': 'text/html' })
      response.end(file)
    } catch {
      sendJson(response, 404, { message: 'Build the frontend with npm run build first.' })
    }
  }
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') {
      sendJson(response, 204, {})
      return
    }

    if (request.url === '/api/health') {
      sendJson(response, 200, { status: 'ok' })
      return
    }

    if (request.url === '/api/rsvp' && request.method === 'POST') {
      await handleRsvp(request, response)
      return
    }

    await serveStatic(request, response)
  } catch (error) {
    sendJson(response, 500, { message: error.message || 'Server error' })
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Wedding invitation API running at http://localhost:${port}`)
})
