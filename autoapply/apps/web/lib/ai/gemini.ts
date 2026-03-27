interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> }
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
  }
}

export async function callGemini(prompt: string, systemInstruction?: string, maxOutputTokens = 1024): Promise<{
  text: string
  inputTokens: number
  outputTokens: number
}> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens,
      responseMimeType: 'application/json',
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data: GeminiResponse = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  return {
    text,
    inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
  }
}

/** Parse JSON from Gemini response, handling markdown code fences */
export function parseGeminiJSON<T>(text: string): T {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(cleaned) as T
}
