import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/moonshot'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const client = getOpenAIClient()

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    })

    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl, revisedPrompt: response.data[0]?.revised_prompt })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Image generation error:', message)
    return NextResponse.json(
      { error: message.includes('OPENAI_API_KEY') ? 'OPENAI_API_KEY not configured for image generation.' : message },
      { status: 500 }
    )
  }
}
