const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

function buildUrl(path) {
  const normalized = path.startsWith('/api') ? path : `/api${path}`
  return `${API_BASE}${normalized}`
}

const TOKEN_KEY = 'leadboard_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const authToken = token ?? getToken()
  if (authToken) headers.Authorization = `Bearer ${authToken}`

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