import { ApiError } from '../utils/ApiError.js'

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500
  if (status >= 500) {
    console.error('[error]', err)
  }

  // Intentional errors expose their message; unexpected 5xx stay generic.
  const exposed = err instanceof ApiError || status < 500
  res.status(status).json({
    error: exposed ? err.message : 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
  })
}