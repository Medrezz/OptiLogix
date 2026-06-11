'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Session } from 'next-auth'
import { useRouter } from 'next/navigation'
import MessageBubble, { ChatMessage } from './MessageBubble'
import ModeSelector, { Mode } from './ModeSelector'
import VisionUpload from './VisionUpload'
import ImageGallery from './ImageGallery'

interface ChatInterfaceProps {
  onAuraStateChange: (state: 'idle' | 'thinking' | 'generating') => void
  session?: Session | null
}

function generateSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// How many free images a guest/logged-out user gets (tracked in localStorage)
const GUEST_FREE_IMAGES = 0 // guests must log in to generate images

export default function ChatInterface({ onAuraStateChange, session }: ChatInterfaceProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<{ url: string; prompt: string; timestamp: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [authGateReason, setAuthGateReason] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const freeImagesUsed = session?.user?.freeImagesUsed ?? 0
  const freeImagesLeft = Math.max(0, 3 - freeImagesUsed)
  const coinBalance = session?.user?.coinBalance ?? 0

  useEffect(() => {
    let sid = sessionStorage.getItem('optilogix_session')
    if (!sid) { sid = generateSessionId(); sessionStorage.setItem('optilogix_session', sid) }
    setSessionId(sid)
    fetch(`/api/history?sessionId=${sid}`)
      .then(r => r.json())
      .then(data => {
        if (data.messages?.length) {
          setMessages(data.messages.map((m: { role: 'user' | 'assistant'; content: string }, i: number) => ({
            id: `history-${i}`, role: m.role, content: m.content,
          })))
        }
        if (data.images?.length) setGeneratedImages(data.images)
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true))
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const autoResize = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }

  // ── Image gate check ───────────────────────────────────────────────────────
  const canGenerateImage = (): boolean => {
    if (!session) {
      setAuthGateReason("You need to sign in to generate images. Don't worry — chat is always free!")
      setShowAuthGate(true)
      return false
    }
    if (freeImagesLeft > 0) return true
    if (coinBalance >= 50) return true
    setAuthGateReason(`You've used all 3 free images. Your balance is ${coinBalance} coins (need 50). Buy more coins to continue.`)
    setShowAuthGate(true)
    return false
  }

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return
    setError(null)
    setShowAuthGate(false)

    // Check image gate for canvas mode
    if (mode === 'canvas' && !canGenerateImage()) return

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
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '', isStreaming: true }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const apiHistory = newMessages.map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiHistory, imageBase64: imageToSend || null, sessionId }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.delta) {
              fullText += data.delta
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m))
            }
            if (data.done) {
              const imgMatch = fullText.match(/\[IMAGE_GENERATION_REQUEST\]:\s*(.+)/s)
              if (imgMatch) {
                // Re-check gate before generating
                if (!session) {
                  setAuthGateReason("Sign in to generate images. Chat is always free!")
                  setShowAuthGate(true)
                  setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: '🔒 Sign in to generate images.', isStreaming: false } : m))
                  return
                }
                if (freeImagesLeft === 0 && coinBalance < 50) {
                  setAuthGateReason(`Need 50 coins to generate (you have ${coinBalance}). Buy more coins!`)
                  setShowAuthGate(true)
                  setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: '🪙 Insufficient coins. Please top up.', isStreaming: false } : m))
                  return
                }
                onAuraStateChange('generating')
                const prompt = imgMatch[1].trim()
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: '✨ Generating your image...', isStreaming: true } : m))
                try {
                  const imgRes = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, sessionId }),
                  })
                  const imgData = await imgRes.json()
                  if (imgData.imageUrl) {
                    setMessages(prev => prev.map(m => m.id === assistantId
                      ? { ...m, content: `Here's your image!\n[GENERATED_IMAGE]:${imgData.imageUrl}`, isStreaming: false }
                      : m))
                    setGeneratedImages(prev => [{ url: imgData.imageUrl, prompt, timestamp: Date.now() }, ...prev])
                    if (mode !== 'canvas') setMode('canvas')
                  } else throw new Error(imgData.error || 'Image generation failed')
                } catch (imgErr) {
                  const msg = imgErr instanceof Error ? imgErr.message : 'Image generation failed'
                  setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `Image failed: ${msg}`, isStreaming: false } : m))
                }
              }
            }
          } catch { /* skip malformed SSE */ }
        }
      }
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setMessages(prev => prev.filter(m => m.id !== assistantId))
    } finally {
      setIsLoading(false)
      onAuraStateChange('idle')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, selectedImage, messages, isLoading, mode, sessionId, session, freeImagesLeft, coinBalance, onAuraStateChange])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const placeholders: Record<Mode, string> = {
    chat: 'Ask me anything — math, research, writing, code...',
    vision: 'Describe what you want to know about the image...',
    canvas: 'Describe the image you want to create...',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mode + status bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
        <ModeSelector mode={mode} onChange={setMode} />
        <div className="flex items-center gap-3">
          {/* Image counter */}
          {mode === 'canvas' && (
            <div className={`text-xs px-2 py-1 rounded-lg ${session ? (freeImagesLeft > 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300') : 'bg-red-500/10 text-red-300'}`}>
              {session ? (freeImagesLeft > 0 ? `🎨 ${freeImagesLeft} free images left` : `🪙 ${coinBalance} coins`) : '🔒 Sign in to generate'}
            </div>
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-violet-300/70">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
              </div>
              <span>{mode === 'canvas' ? 'Creating...' : 'Thinking...'}</span>
            </div>
          )}
          {historyLoaded && messages.length > 0 && (
            <button onClick={() => {
              const sid = generateSessionId()
              sessionStorage.setItem('optilogix_session', sid)
              setSessionId(sid); setMessages([]); setGeneratedImages([])
            }} className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
              + New chat
            </button>
          )}
        </div>
      </div>

      {/* Auth gate banner */}
      {showAuthGate && (
        <div className="mb-4 glass rounded-2xl p-4 border border-violet-400/30 flex items-start gap-4 flex-shrink-0 animate-fadeInUp">
          <span className="text-2xl flex-shrink-0">🔒</span>
          <div className="flex-1">
            <p className="text-sm text-white/80 mb-3">{authGateReason}</p>
            <div className="flex gap-2">
              <button onClick={() => router.push('/auth')} className="grad-btn px-4 py-2 rounded-xl text-xs text-white font-medium">
                Sign In / Sign Up
              </button>
              {session && (
                <button onClick={() => router.push('/dashboard')} className="glass px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white transition-colors">
                  Buy Coins →
                </button>
              )}
              <button onClick={() => setShowAuthGate(false)} className="ml-auto text-xs text-white/30 hover:text-white/60 transition-colors">✕</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-4 min-h-0">
        <div className={`flex flex-col ${mode === 'canvas' && generatedImages.length > 0 ? 'flex-1' : 'w-full'} min-h-0`}>
          {mode === 'vision' && (
            <div className="mb-4 flex-shrink-0">
              <VisionUpload
                onImageSelect={(base64: string, preview: string) => setSelectedImage(preview)}
                selectedImage={selectedImage}
                onClear={() => setSelectedImage(null)}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
            {messages.length === 0 && historyLoaded && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                  <span className="text-3xl">{mode === 'chat' ? '🧠' : mode === 'vision' ? '👁' : '🎨'}</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white/80 mb-1">
                    {mode === 'chat' && 'The Omniscient Brain'}
                    {mode === 'vision' && 'The Vision Scanner'}
                    {mode === 'canvas' && 'The Creative Canvas'}
                  </p>
                  <p className="text-sm text-white/40 max-w-xs">
                    {mode === 'chat' && 'Ask complex questions, get deep answers. Free forever.'}
                    {mode === 'vision' && 'Upload an image and let me analyze it in detail.'}
                    {mode === 'canvas' && session
                      ? `Describe what you want. ${freeImagesLeft > 0 ? `${freeImagesLeft} free images left.` : `Costs 50 coins (you have ${coinBalance}).`}`
                      : "Sign in to generate AI images. 3 free images on us!"}
                  </p>
                </div>

                {mode === 'chat' && (
                  <div className="grid grid-cols-2 gap-2 text-xs max-w-sm w-full">
                    {['Explain quantum entanglement', 'Debug my Python code', 'Write a product brief', 'Solve this equation'].map(s => (
                      <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus() }}
                        className="glass rounded-xl px-3 py-2 text-left text-white/50 hover:text-white/80 hover:border-white/20 transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {mode === 'canvas' && (
                  session ? (
                    <div className="grid grid-cols-1 gap-2 text-xs max-w-xs w-full">
                      {['Draw a neon cyberpunk city', 'Create a logo for a space startup', 'Generate a serene Japanese garden'].map(s => (
                        <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus() }}
                          className="glass rounded-xl px-3 py-2 text-left text-white/50 hover:text-white/80 hover:border-white/20 transition-all">
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button onClick={() => router.push('/auth')} className="grad-btn px-6 py-2.5 rounded-xl text-sm text-white font-medium">
                      Sign In for Free Images →
                    </button>
                  )
                )}
              </div>
            )}

            {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mt-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-400/20 text-xs text-red-300 flex-shrink-0">
              {error}
            </div>
          )}

          <div className="mt-4 glass rounded-2xl p-3 flex-shrink-0">
            {mode === 'vision' && selectedImage && (
              <div className="flex items-center gap-2 mb-2 px-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedImage} alt="" className="w-8 h-8 rounded-lg object-cover border border-violet-400/30" />
                <span className="text-xs text-violet-300/70">Image attached</span>
              </div>
            )}
            <div className="flex items-end gap-3">
              {mode === 'vision' && !selectedImage && (
                <button onClick={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center text-violet-400 hover:bg-violet-500/20 transition-all" title="Upload image">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                </button>
              )}
              <textarea ref={textareaRef} value={input} onChange={e => { setInput(e.target.value); autoResize() }}
                onKeyDown={handleKeyDown} placeholder={placeholders[mode]} rows={1}
                className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder-white/30 resize-none min-h-[42px]"
                style={{background:'transparent'}} />
              <button onClick={handleSend} disabled={isLoading || (!input.trim() && !selectedImage)}
                className="flex-shrink-0 w-9 h-9 rounded-xl glass flex items-center justify-center text-violet-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:border-violet-400/40">
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {mode === 'canvas' && generatedImages.length > 0 && (
          <div className="w-72 flex-shrink-0 glass rounded-2xl p-3 overflow-y-auto">
            <p className="text-xs text-white/40 font-medium mb-3 uppercase tracking-wider">Gallery</p>
            <ImageGallery images={generatedImages} />
          </div>
        )}
      </div>
    </div>
  )
}
