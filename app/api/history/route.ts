import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Conversation, GeneratedGraphic } from '@/lib/models'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    await connectDB()

    const [conversation, images] = await Promise.all([
      Conversation.findOne({ sessionId }).lean(),
      GeneratedGraphic.find({ sessionId }).sort({ createdAt: -1 }).limit(20).lean(),
    ])

    return NextResponse.json({
      messages: (conversation as { messages?: unknown[] } | null)?.messages || [],
      images: images.map((img: { prompt?: string; imageUrl?: string; createdAt?: Date }) => ({
        prompt: img.prompt,
        url: img.imageUrl,
        timestamp: img.createdAt ? new Date(img.createdAt).getTime() : Date.now(),
      })),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('History API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
