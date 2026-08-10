const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

function buildUrl(path) {
  const normalized = path.startsWith('/api') ? path : `/api${path}`
  return `${API_BASE}${normalized}`
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

let sessionTokenProvider = null

export function setSessionTokenProvider(provider) {
  sessionTokenProvider = provider
}

export async function getSessionToken() {
  return sessionTokenProvider ? await sessionTokenProvider() : null
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = sessionTokenProvider ? await sessionTokenProvider() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(buildUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Unable to reach the server')
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    throw new ApiError(data?.error ?? `Request failed (${res.status})`, res.status, data?.details)
  }

  return data
}