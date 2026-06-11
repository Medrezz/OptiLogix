import { NextRequest, NextResponse } from 'next/server'
import { getMoonshotClient, SYSTEM_PROMPT, Message } from '@/lib/moonshot'
import { connectDB } from '@/lib/mongodb'
import { Conversation } from '@/lib/models'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { messages, imageBase64, sessionId } = await req.json()

    const client = getMoonshotClient()

    const history: Message[] = messages.slice(-12)

    const systemMessage: Message = {
      role: 'system',
      content: SYSTEM_PROMPT,
    }

    const apiMessages = [systemMessage, ...history]

    if (imageBase64) {
      const lastUserMsg = apiMessages[apiMessages.length - 1]
      if (lastUserMsg.role === 'user' && typeof lastUserMsg.content === 'string') {
        lastUserMsg.content = [
          { type: 'text', text: lastUserMsg.content as string },
          {
            type: 'image_url',
            image_url: { url: imageBase64 },
          },
        ]
      }
    }

    const stream = await client.chat.completions.create({
      model: 'moonshot-v1-8k',
      messages: apiMessages as Parameters<typeof client.chat.completions.create>[0]['messages'],
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        let fullText = ''
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || ''
          if (delta) {
            fullText += delta
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`))
          }
        }

        // Save conversation to MongoDB
        try {
          await connectDB()
          const userMsg = messages[messages.length - 1]
          if (sessionId && userMsg) {
            await Conversation.findOneAndUpdate(
              { sessionId },
              {
                $push: {
                  messages: [
                    { role: 'user', content: userMsg.content },
                    { role: 'assistant', content: fullText },
                  ],
                },
                $set: { updatedAt: new Date() },
              },
              { upsert: true, new: true }
            )
          }
        } catch (dbErr) {
          console.warn('MongoDB save failed (non-fatal):', dbErr)
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullText })}\n\n`))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Chat API error:', message)
    return NextResponse.json(
      { error: message.includes('MOONSHOT_API_KEY') ? 'API key not configured. Please set MOONSHOT_API_KEY.' : message },
      { status: 500 }
    )
  }
}
