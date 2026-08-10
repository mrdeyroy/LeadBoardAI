import { ApiError } from '../utils/ApiError.js'

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' })
}

function bodyParserError(err) {
  if (err.type === 'entity.parse.failed') {
    return { status: 400, message: 'Invalid JSON body' }
  }
  if (err.type === 'entity.too.large') {
    return { status: 413, message: 'Request body too large' }
  }
  return null
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const parse = bodyParserError(err)
  if (parse) {
    return res.status(parse.status).json({ error: parse.message })
  }

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