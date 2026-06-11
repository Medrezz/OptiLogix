'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import MessageBubble, { ChatMessage } from './MessageBubble'
import ModeSelector, { Mode } from './ModeSelector'
import VisionUpload from './VisionUpload'
import ImageGallery from './ImageGallery'

interface ChatInterfaceProps {
  onAuraStateChange: (state: 'idle' | 'thinking' | 'generating') => void
}

function generateSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function ChatInterface({ onAuraStateChange }: ChatInterfaceProps) {
  const [mode, setMode] = useState<Mode>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<{ url: string; prompt: string; timestamp: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Init session and load history
  useEffect(() => {
    let sid = sessionStorage.getItem('optilogix_session')
    if (!sid) {
      sid = generateSessionId()
      sessionStorage.setItem('optilogix_session', sid)
    }
    setSessionId(sid)

    fetch(`/api/history?sessionId=${sid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length) {
          const restored: ChatMessage[] = data.messages.map((m: { role: 'user' | 'assistant'; content: string }, i: number) => ({
            id: `history-${i}`,
            role: m.role,
            content: m.content,
          }))
          setMessages(restored)
        }
        if (data.images?.length) {
          setGeneratedImages(data.images)
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const autoResize = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return
    setError(null)

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || 'Analyze this image.',
      uploadedImage: selectedImage || undefined,
    }

    const imageToSend = selectedImage
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setSelectedImage(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsLoading(true)
    onAuraStateChange('thinking')

    const assistantId = (Date.now() + 1).toString()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }
    setMessages((prev) => [...prev, assistantMsg])

    try {
      const apiHistory = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiHistory,
          imageBase64: imageToSend || null,
          sessionId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to get response')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.delta) {
              fullText += data.delta
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: fullText } : m
                )
              )
            }
            if (data.done) {
              const imageMatch = fullText.match(/\[IMAGE_GENERATION_REQUEST\]:\s*(.+)/s)
              if (imageMatch) {
                onAuraStateChange('generating')
                const prompt = imageMatch[1].trim()
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: '✨ Generating your image...', isStreaming: true }
                      : m
                  )
                )
                try {
                  const imgRes = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, sessionId }),
                  })
                  const imgData = await imgRes.json()
                  if (imgData.imageUrl) {
                    const imgContent = `Here's your generated image!\n[GENERATED_IMAGE]:${imgData.imageUrl}`
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId ? { ...m, content: imgContent, isStreaming: false } : m
                      )
                    )
                    setGeneratedImages((prev) => [
                      { url: imgData.imageUrl, prompt, timestamp: Date.now() },
                      ...prev,
                    ])
                    if (mode !== 'canvas') setMode('canvas')
                  } else {
                    throw new Error(imgData.error || 'Image generation failed')
                  }
                } catch (imgErr: unknown) {
                  const msg = imgErr instanceof Error ? imgErr.message : 'Image generation failed'
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: `Image generation failed: ${msg}`, isStreaming: false }
                        : m
                    )
                  )
                }
              }
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setIsLoading(false)
      onAuraStateChange('idle')
    }
  }, [input, selectedImage, messages, isLoading, mode, sessionId, onAuraStateChange])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const placeholders: Record<Mode, string> = {
    chat: 'Ask me anything — math, research, writing, code...',
    vision: 'Describe what you want to know about the image...',
    canvas: 'Describe the image you want me to create...',
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <ModeSelector mode={mode} onChange={setMode} />
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-violet-300/70">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span>{mode === 'canvas' ? 'Creating...' : 'Thinking...'}</span>
            </div>
          )}
          {historyLoaded && messages.length > 0 && (
            <button
              onClick={() => {
                const newSid = generateSessionId()
                sessionStorage.setItem('optilogix_session', newSid)
                setSessionId(newSid)
                setMessages([])
                setGeneratedImages([])
              }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
              title="New session"
            >
              + New chat
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        <div className={`flex flex-col ${mode === 'canvas' && generatedImages.length > 0 ? 'flex-1' : 'w-full'} min-h-0`}>
          {mode === 'vision' && (
            <div className="mb-4 flex-shrink-0">
              <VisionUpload
                onImageSelect={(base64, preview) => setSelectedImage(preview)}
                selectedImage={selectedImage}
                onClear={() => setSelectedImage(null)}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
            {messages.length === 0 && historyLoaded && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white/80 mb-1">
                    {mode === 'chat' && 'The Omniscient Brain'}
                    {mode === 'vision' && 'The Vision Scanner'}
                    {mode === 'canvas' && 'The Creative Canvas'}
                  </p>
                  <p className="text-sm text-white/40 max-w-xs">
                    {mode === 'chat' && 'Ask complex questions, get deep answers across any domain.'}
                    {mode === 'vision' && 'Upload an image and let me analyze it in full detail.'}
                    {mode === 'canvas' && "Describe what you want to create, and I'll generate it."}
                  </p>
                </div>
                {mode === 'chat' && (
                  <div className="grid grid-cols-2 gap-2 text-xs max-w-sm w-full">
                    {['Explain quantum entanglement', 'Debug my Python code', 'Write a product brief', 'Solve this equation'].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); textareaRef.current?.focus() }}
                        className="glass-panel rounded-xl px-3 py-2 text-left text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {mode === 'canvas' && (
                  <div className="grid grid-cols-1 gap-2 text-xs max-w-xs w-full">
                    {['Draw a neon cyberpunk city', 'Create a logo for a space startup', 'Generate a serene Japanese garden'].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); textareaRef.current?.focus() }}
                        className="glass-panel rounded-xl px-3 py-2 text-left text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mt-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-400/20 text-xs text-red-300 flex-shrink-0">
              {error}
            </div>
          )}

          <div className="mt-4 glass-panel rounded-2xl p-3 flex-shrink-0">
            {mode === 'vision' && selectedImage && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <img src={selectedImage} alt="" className="w-8 h-8 rounded-lg object-cover border border-violet-400/30" />
                <span className="text-xs text-violet-300/70">Image attached</span>
              </div>
            )}
            <div className="flex items-end gap-3">
              {mode === 'vision' && !selectedImage && (
                <button
                  onClick={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center text-violet-400 hover:bg-violet-500/20 transition-all"
                  title="Upload image"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </button>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize() }}
                onKeyDown={handleKeyDown}
                placeholder={placeholders[mode]}
                rows={1}
                className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder-white/30 resize-none min-h-[42px]"
                style={{ background: 'transparent' }}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className="flex-shrink-0 w-9 h-9 rounded-xl glass-btn flex items-center justify-center text-violet-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {mode === 'canvas' && (
          <div className="w-72 flex-shrink-0 glass-panel rounded-2xl p-3 overflow-y-auto">
            <p className="text-xs text-white/40 font-medium mb-3 uppercase tracking-wider">Gallery</p>
            <ImageGallery images={generatedImages} />
          </div>
        )}
      </div>
    </div>
  )
}
