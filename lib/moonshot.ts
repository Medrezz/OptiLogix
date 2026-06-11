import OpenAI from 'openai'

export function getMoonshotClient() {
  const apiKey = process.env.MOONSHOT_API_KEY
  if (!apiKey) {
    throw new Error('MOONSHOT_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.moonshot.cn/v1',
  })
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({ apiKey })
}

export type Message = {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

export const SYSTEM_PROMPT = `You are OptiLogix, a premium multimodal AI workspace assistant powered by advanced reasoning intelligence. You are highly capable, articulate, and thorough.

You can:
1. Answer complex questions across any domain — math, science, code, writing, research
2. Analyze images uploaded by the user — describe them, extract text (OCR), and provide insights
3. Help users generate images by understanding their creative intent

When a user asks you to DRAW, CREATE, GENERATE, or MAKE an image, respond with:
[IMAGE_GENERATION_REQUEST]: <detailed image prompt>

Be precise, thorough, and maintain a premium, professional tone. Format responses with markdown when helpful.`
