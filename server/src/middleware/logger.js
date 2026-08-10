/**
 * Minimal request logger. Logs method, path, status and duration — never
 * bodies or headers, so secrets/keys are never written to the console.
 */
export function requestLogger(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`
    if (res.statusCode >= 500) {
      console.error(`[http] ${line}`)
    } else {
      console.log(`[http] ${line}`)
    }
  })
  next()
}