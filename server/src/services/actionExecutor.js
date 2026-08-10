import { getTool } from '../tools/index.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Validate tool params against the tool's JSON-schema style definition.
 * Only string/number/boolean types and enum values are supported.
 */
function validateParams(toolDef, params) {
  const errors = {}

  for (const field of toolDef.parameters.required ?? []) {
    const value = params[field]
    if (value === undefined || value === null || value === '') {
      errors[field] = `${field} is required`
    }
  }

  for (const [field, prop] of Object.entries(toolDef.parameters.properties ?? {})) {
    const value = params[field]
    if (value === undefined || value === null) continue

    if (prop.type === 'string') {
      if (typeof value !== 'string') {
        errors[field] = 'must be a string'
        continue
      }
      if (prop.enum && !prop.enum.includes(value)) {
        errors[field] = `must be one of: ${prop.enum.join(', ')}`
      }
    } else if (prop.type === 'number' && (typeof value !== 'number' || Number.isNaN(value))) {
      errors[field] = 'must be a number'
    } else if (prop.type === 'boolean' && typeof value !== 'boolean') {
      errors[field] = 'must be a boolean'
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Invalid tool parameters', errors)
  }
}

/**
 * Execute a whitelisted AI tool.
 * The tool (not the model) decides what it can mutate, and every tool
 * re-checks lead ownership with the authenticated userId.
 */
export async function executeAction({ tool, params, userId }) {
  const toolDef = getTool(tool)
  if (!toolDef) {
    throw new ApiError(400, `Unknown tool: ${tool}`)
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new ApiError(400, 'params must be an object')
  }

  validateParams(toolDef, params)

  const result = await toolDef.run(params, { userId })
  return { action: tool, result }
}