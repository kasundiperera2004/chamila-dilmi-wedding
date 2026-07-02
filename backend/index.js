import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createSign } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const envPath = path.join(rootDir, '.env')

if (existsSync(envPath) && process.loadEnvFile) {
  process.loadEnvFile(envPath)
}

const distDir = path.join(rootDir, 'dist')
const PORT = Number(process.env.PORT || 5174)
const host = '0.0.0.0'
const adminPasscode = process.env.ADMIN_PASSCODE || 'chamila-dilmi'
const googleSheetId = process.env.GOOGLE_SHEET_ID
const googleSheetName = process.env.GOOGLE_SHEET_NAME || 'RSVPs'
const googleClientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
const googleScope = 'https://www.googleapis.com/auth/spreadsheets'
let cachedGoogleToken = null
let sheetReady = false
let rsvpSheetId = null

const sendJson = (response, statusCode, data) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-passcode',
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

const base64Url = (value) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

const assertGoogleConfig = () => {
  const missing = [
    ['GOOGLE_SHEET_ID', googleSheetId],
    ['GOOGLE_SERVICE_ACCOUNT_EMAIL', googleClientEmail],
    ['GOOGLE_PRIVATE_KEY', googlePrivateKey],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing Google Sheets environment variables: ${missing.join(', ')}`)
  }
}

const getGoogleAccessToken = async () => {
  assertGoogleConfig()

  if (cachedGoogleToken && cachedGoogleToken.expiresAt > Date.now() + 60_000) {
    return cachedGoogleToken.accessToken
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64Url(
    JSON.stringify({
      iss: googleClientEmail,
      scope: googleScope,
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  )
  const unsignedJwt = `${header}.${payload}`
  const signature = createSign('RSA-SHA256').update(unsignedJwt).sign(googlePrivateKey, 'base64url')
  const assertion = `${unsignedJwt}.${signature}`

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error_description || result.error || 'Unable to authorize Google Sheets.')
  }

  cachedGoogleToken = {
    accessToken: result.access_token,
    expiresAt: Date.now() + Number(result.expires_in || 3600) * 1000,
  }

  return cachedGoogleToken.accessToken
}

const sheetRange = (range) => encodeURIComponent(`'${googleSheetName}'!${range}`)

const googleRequest = async (url, options = {}) => {
  const accessToken = await getGoogleAccessToken()

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message || 'Google Sheets request failed.')
  }

  return result
}

const sheetsRequest = async (range, options = {}) => {
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetId}/values/${sheetRange(range)}${
      options.action ? `:${options.action}` : ''
    }`,
  )

  Object.entries(options.searchParams || {}).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return googleRequest(url, options)
}

const ensureSheetReady = async () => {
  if (sheetReady) {
    return
  }

  const spreadsheetUrl = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${googleSheetId}`)
  spreadsheetUrl.searchParams.set('fields', 'sheets.properties(sheetId,title)')
  const spreadsheet = await googleRequest(spreadsheetUrl)
  const existingSheet = (spreadsheet.sheets || []).find(
    (sheet) => sheet.properties?.title === googleSheetName,
  )

  if (existingSheet) {
    rsvpSheetId = existingSheet.properties.sheetId
  } else {
    const createdSheet = await googleRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetId}:batchUpdate`,
      {
        method: 'POST',
        body: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: googleSheetName,
                },
              },
            },
          ],
        },
      },
    )
    rsvpSheetId = createdSheet.replies?.[0]?.addSheet?.properties?.sheetId
  }

  await sheetsRequest('A1:F1', {
    method: 'PUT',
    searchParams: {
      valueInputOption: 'USER_ENTERED',
    },
    body: {
      values: [['Created At', 'Name', 'Phone', 'Guests', 'Attending', 'Message']],
    },
  })

  sheetReady = true
}

const appendRsvpToSheet = async (rsvp) => {
  await ensureSheetReady()

  await sheetsRequest('A:F', {
    method: 'POST',
    action: 'append',
    searchParams: {
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
    },
    body: {
      values: [[rsvp.createdAt, rsvp.name, rsvp.phone, rsvp.guests, rsvp.attending, rsvp.message]],
    },
  })
}

const readRsvpsFromSheet = async () => {
  await ensureSheetReady()

  const result = await sheetsRequest('A2:F')

  return (result.values || [])
    .map(([createdAt, name, phone, guests, attending, message], index) => ({
      createdAt,
      name,
      phone,
      guests: Number(guests || 1),
      attending,
      message: message || '',
      rowNumber: index + 2,
    }))
    .filter((rsvp) => rsvp.name && rsvp.phone)
    .reverse()
}

const deleteRsvpFromSheet = async (rowNumber) => {
  await ensureSheetReady()

  if (!Number.isInteger(rowNumber) || rowNumber < 2) {
    throw new Error('Invalid RSVP row.')
  }

  if (!Number.isInteger(rsvpSheetId)) {
    throw new Error('Unable to locate the RSVP sheet.')
  }

  await googleRequest(`https://sheets.googleapis.com/v4/spreadsheets/${googleSheetId}:batchUpdate`, {
    method: 'POST',
    body: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: rsvpSheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  })
}

const normalizeSriLankanPhone = (value) => {
  const phone = String(value || '').trim().replace(/\s+/g, '')

  if (/^0\d{9}$/.test(phone)) {
    return phone
  }

  if (/^\+94\d{9}$/.test(phone)) {
    return `0${phone.slice(3)}`
  }

  if (/^94\d{9}$/.test(phone)) {
    return `0${phone.slice(2)}`
  }

  if (/^\d{9}$/.test(phone)) {
    return `0${phone}`
  }

  return ''
}

const normalizeRsvp = (body) => {
  const name = String(body.name || '').trim().replace(/\s+/g, ' ')
  const phone = normalizeSriLankanPhone(body.phone)
  const guests = Number(body.guests || 1)
  const attending = String(body.attending || '').trim()
  const message = String(body.message || '').trim()
  const validAttendance = ['yes', 'no']

  if (name.length < 2 || name.length > 80) {
    return { error: 'Please enter a valid full name.' }
  }

  if (!phone) {
    return { error: 'Please enter a valid Sri Lankan phone number.' }
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > 10) {
    return { error: 'Guest count must be between 1 and 10.' }
  }

  if (!validAttendance.includes(attending)) {
    return { error: 'Please select a valid attendance option.' }
  }

  if (message.length > 300) {
    return { error: 'Message must be 300 characters or fewer.' }
  }

  return {
    rsvp: {
      name,
      phone,
      guests,
      attending,
      message,
      createdAt: new Date().toISOString(),
    },
  }
}

const handleRsvp = async (request, response) => {
  const body = await parseBody(request)
  const { rsvp, error } = normalizeRsvp(body)

  if (error) {
    sendJson(response, 400, { message: error })
    return
  }

  await appendRsvpToSheet(rsvp)

  sendJson(response, 201, { message: 'RSVP received.' })
}

const readRsvps = async () => {
  return readRsvpsFromSheet()
}

const handleAdminRsvps = async (request, response) => {
  const passcode = request.headers['x-admin-passcode']

  if (passcode !== adminPasscode) {
    sendJson(response, 401, { message: 'Invalid admin passcode.' })
    return
  }

  const rsvps = await readRsvps()
  const totals = rsvps.reduce(
    (summary, rsvp) => {
      summary.guests += Number(rsvp.guests || 0)
      summary[rsvp.attending] = (summary[rsvp.attending] || 0) + 1
      return summary
    },
    { guests: 0, yes: 0, no: 0, maybe: 0 },
  )

  sendJson(response, 200, { rsvps, totals })
}

const handleDeleteRsvp = async (request, response) => {
  const passcode = request.headers['x-admin-passcode']

  if (passcode !== adminPasscode) {
    sendJson(response, 401, { message: 'Invalid admin passcode.' })
    return
  }

  const body = await parseBody(request)
  const rowNumber = Number(body.rowNumber)

  if (!Number.isInteger(rowNumber) || rowNumber < 2) {
    sendJson(response, 400, { message: 'Invalid RSVP row.' })
    return
  }

  await deleteRsvpFromSheet(rowNumber)
  sendJson(response, 200, { message: 'RSVP deleted.' })
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
    const requestUrl = new URL(request.url, `http://${request.headers.host}`)

    if (request.method === 'OPTIONS') {
      sendJson(response, 204, {})
      return
    }

    if (requestUrl.pathname === '/api/health') {
      sendJson(response, 200, {
        status: 'ok',
        storage: 'google-sheets',
        sheetsConfigured: Boolean(googleSheetId && googleClientEmail && googlePrivateKey),
      })
      return
    }

    if (requestUrl.pathname === '/api/rsvp' && request.method === 'POST') {
      await handleRsvp(request, response)
      return
    }

    if (requestUrl.pathname === '/api/rsvps' && request.method === 'GET') {
      await handleAdminRsvps(request, response)
      return
    }

    if (requestUrl.pathname === '/api/rsvps' && request.method === 'DELETE') {
      await handleDeleteRsvp(request, response)
      return
    }

    await serveStatic(request, response)
  } catch (error) {
    sendJson(response, 500, { message: error.message || 'Server error' })
  }
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing API server or set PORT to another value.`)
    process.exit(1)
  }

  throw error
})

server.listen(PORT, host, () => {
  console.log(`Wedding invitation API running on port ${PORT}`)
})
