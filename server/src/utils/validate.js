import { ApiError } from './ApiError.js'

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const FIELD_LABELS = {
  name: 'Name',
  email: 'Email',
  password: 'Password',
  status: 'Status',
  title: 'Title',
  dueDate: 'Due date',
  leadId: 'Lead ID',
}

const label = (field) => FIELD_LABELS[field] ?? field

/**
 * Validate a request body against a schema, e.g.
 * validateBody({ email: { required: true, pattern: EMAIL_PATTERN }, name: { required: true, max: 100 } })
 * Supported rules per field: required, type, enum, pattern, min, max.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const body = req.body ?? {}
    const errors = {}

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field]

      const isEmpty = value === undefined || value === null || value === ''

      if (isEmpty) {
        if (rules.required) {
          errors[field] = `${label(field)} is required`
        }
        continue
      }

      if (rules.enum) {
        if (rules.trim) {
          body[field] = String(value).trim()
        }
        if (!rules.enum.includes(body[field])) {
          errors[field] = `${label(field)} must be one of: ${rules.enum.join(', ')}`
          continue
        }
      }

      if (rules.pattern && !rules.pattern.test(String(value).trim())) {
        errors[field] = `${label(field)} is invalid`
        continue
      }

      if (rules.min && String(value).trim().length < rules.min) {
        errors[field] = `${label(field)} must be at least ${rules.min} characters`
        continue
      }

      if (rules.max && String(value).trim().length > rules.max) {
        errors[field] = `${label(field)} must be at most ${rules.max} characters`
        continue
      }

      if (rules.type === 'date' && Number.isNaN(Date.parse(value))) {
        errors[field] = `${label(field)} must be a valid date`
        continue
      }

      if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors[field] = `${label(field)} must be a boolean`
        continue
      }

      if (rules.type === 'objectId' && !/^[0-9a-fA-F]{24}$/.test(String(value))) {
        errors[field] = `${label(field)} is invalid`
        continue
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ApiError(400, 'Validation failed', errors)
    }

    next()
  }
}

/** Trim the given string fields on the request body in-place. */
export function trimFields(fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (typeof req.body?.[field] === 'string') {
        req.body[field] = req.body[field].trim()
      }
    }
    next()
  }
}