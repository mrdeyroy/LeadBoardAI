import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Single generated-response wrapper around the Gemini REST API.
 * Supports system instructions, tools (function declarations),
 * structured JSON output and message history.
 */
export async function generateContent({
  systemInstruction,
  contents,
  tools,
  generationConfig,
}) {
  if (!env.geminiApiKey) {
    throw new ApiError(500, 'Gemini API key not configured')
  }

  const payload = {
    systemInstruction: systemInstruction
      ? { parts: [{ text: systemInstruction }] }
      : undefined,
    contents,
    tools,
    generationConfig,
  }

  const res = await fetch(`${BASE_URL}/${env.geminiModel}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.geminiApiKey,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.text()).slice(0, 300)
    } catch {
      /* ignore body read errors */
    }
    throw new ApiError(502, `AI provider error (${res.status})`, {
      provider: detail,
    })
  }

  const data = await res.json()
  const candidate = data.candidates?.[0]
  const parts = candidate?.content?.parts ?? []

  if (!candidate || parts.length === 0) {
    throw new ApiError(502, 'AI provider returned no response')
  }
  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    throw new ApiError(
      502,
      `AI provider finished unexpectedly: ${candidate.finishReason}`
    )
  }

  return { parts }
}

export function partsToText(parts) {
  return parts
    .filter((part) => part.text)
    .map((part) => part.text)
    .join('')
}

export function partsToToolCalls(parts) {
  return parts
    .filter((part) => part.functionCall)
    .map((part) => ({
      tool: part.functionCall.name,
      params: part.functionCall.args ?? {},
    }))
}