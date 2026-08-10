import { ApiError } from '../utils/ApiError.js'

/**
 * Minimal fixed-window rate limiter keyed by client IP.
 * Intentionally dependency-free: good enough for basic abuse protection on
 * AI / auth endpoints without introducing infrastructure.
 */
export function rateLimit({ windowMs = 60_000, max = 30, name = 'rate' } = {}) {
  const hits = new Map()

  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) hits.delete(key)
    }
  }, windowMs)
  cleanup.unref()

  return (req, _res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown'
    const key = `${name}:${ip}`
    const now = Date.now()

    let entry = hits.get(key)
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
    }
    entry.count += 1

    if (entry.count > max) {
      throw new ApiError(429, 'Too many requests, please slow down')
    }
    next()
  }
}