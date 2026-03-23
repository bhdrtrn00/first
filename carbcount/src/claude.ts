import Anthropic from '@anthropic-ai/sdk'
import type { Macros } from './types'

export async function analyzeMealImage(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<{ description: string; macros: Macros }> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: `Analyze this meal photo and estimate its nutritional macros.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "description": "brief meal description (max 40 chars)",
  "calories": <number>,
  "carbs": <number in grams>,
  "protein": <number in grams>,
  "fat": <number in grams>,
  "fiber": <number in grams>
}

Be concise. Round all numbers to nearest integer. If you cannot identify food clearly, make a reasonable estimate based on what is visible.`,
          },
        ],
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  const text = textBlock.text.trim()
  // Strip any markdown code fences if present
  const jsonStr = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(jsonStr)

  return {
    description: String(parsed.description || 'Unknown meal'),
    macros: {
      calories: Math.round(Number(parsed.calories) || 0),
      carbs: Math.round(Number(parsed.carbs) || 0),
      protein: Math.round(Number(parsed.protein) || 0),
      fat: Math.round(Number(parsed.fat) || 0),
      fiber: Math.round(Number(parsed.fiber) || 0),
    },
  }
}
