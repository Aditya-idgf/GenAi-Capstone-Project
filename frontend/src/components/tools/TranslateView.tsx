import { useEffect, useState, useRef } from 'react'
import {
  Globe,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  BookA,
} from 'lucide-react'
import { translateText, type GlossaryItem } from '../../api'
import { useWorkspace } from '../../state/WorkspaceContext'
import { globalToolCache } from '../../state/ToolCache'

export function TranslateView({ initialText }: { initialText?: string }) {
  const { selectedText, messages, activeSessionId } = useWorkspace()

  // Default to highlighted text, or provided text, or last assistant message content
  const defaultText = () => {
    if (selectedText) return selectedText
    if (initialText) return initialText
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    return lastAssistant?.content || 'Retrieval-Augmented Generation (RAG) grounds language models with factual sources.'
  }

  const [inputText, setInputText] = useState<string>(defaultText())
  const [translatedText, setTranslatedText] = useState<string>('')
  const [glossary, setGlossary] = useState<GlossaryItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [speaking, setSpeaking] = useState<boolean>(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Cache restore & save
  useEffect(() => {
    if (!activeSessionId) return
    const cacheKey = 	ranslate_
    const cached = globalToolCache[cacheKey]
    if (cached) {
      if (cached.inputText) setInputText(cached.inputText)
      if (cached.translatedText) setTranslatedText(cached.translatedText)
      if (cached.glossary) setGlossary(cached.glossary)
    } else {
      setTranslatedText('')
      setGlossary([])
    }
  }, [activeSessionId])

  useEffect(() => {
    if (activeSessionId) {
      globalToolCache[	ranslate_] = { inputText, translatedText, glossary }
    }
  }, [inputText, translatedText, glossary, activeSessionId])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  // Update input text if selectedText changes
  useEffect(() => {
    if (selectedText) {
      setInputText(selectedText)
    }
  }, [selectedText])

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('Please provide or select text to translate.')
      return
    }

    setLoading(true)
    setError(null)
    if (synthRef.current) {
      synthRef.current.cancel()
      setSpeaking(false)
    }

    try {
      const res = await translateText({
        text: inputText,
        target_language: 'Hindi',
        preserve_technical_terms: true,
      })
      setTranslatedText(res.translated_text)
      setGlossary(res.glossary || [])
    } catch (e: any) {
      setError(e.message || 'Translation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Trigger translate on initial mount if there is text
  useEffect(() => {
    handleTranslate()
  }, [])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleToggleSpeak = () => {
    if (!synthRef.current || !translatedText) return

    if (speaking) {
      synthRef.current.cancel()
      setSpeaking(false)
      return
    }

    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(translatedText)
    utterance.lang = 'hi-IN'
    utterance.rate = 0.95

    // Pick Hindi voice if available in browser
    const voices = synthRef.current.getVoices()
    const hindiVoice = voices.find((v) => v.lang.startsWith('hi'))
    if (hindiVoice) {
      utterance.voice = hindiVoice
    }

    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    synthRef.current.speak(utterance)
    setSpeaking(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          background: 'var(--panel-bg, #16181d)',
          border: '1px solid var(--border-color, #2a2f38)',
          borderRadius: '12px',
          padding: '12px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="#38bdf8" />
          <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc' }}>
            Technical Translation
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              fontWeight: 500,
            }}
          >
            English → Hindi (हिंदी)
          </span>
        </div>

        <button
          type="button"
          className="btn btn--primary"
          onClick={handleTranslate}
          disabled={loading || !inputText.trim()}
          style={{ padding: '7px 14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {loading ? (
            <>
              <Loader2 size={13} className="spin" />
              Translating…
            </>
          ) : (
            <>
              <Sparkles size={13} />
              Translate to Hindi
            </>
          )}
        </button>
      </div>

      {error && (
        <div style={{ color: '#f87171', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Side-by-Side Translation Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Source English Card */}
        <div
          style={{
            background: 'var(--panel-bg, #16181d)',
            border: '1px solid var(--border-color, #2a2f38)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              background: '#0d1117',
              borderBottom: '1px solid var(--border-color, #2a2f38)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              English (Original)
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {inputText.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste English text to translate…"
            rows={7}
            style={{
              padding: '14px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              color: '#cbd5e1',
              fontSize: '13.5px',
              lineHeight: 1.6,
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Hindi Translation Card */}
        <div
          style={{
            background: 'var(--panel-bg, #16181d)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              background: '#0d1117',
              borderBottom: '1px solid var(--border-color, #2a2f38)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                हिंदी अनुवाद (Hindi)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Text-to-speech button */}
              {translatedText && (
                <button
                  type="button"
                  className="icon-btn"
                  title={speaking ? 'Stop speech' : 'Listen in Hindi (सुने)'}
                  onClick={handleToggleSpeak}
                  style={{ width: '28px', height: '28px', color: speaking ? '#38bdf8' : '#94a3b8' }}
                >
                  {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              )}

              {/* Copy button */}
              {translatedText && (
                <button
                  type="button"
                  className="icon-btn"
                  title="Copy Hindi Translation"
                  onClick={() => handleCopy(translatedText)}
                  style={{ width: '28px', height: '28px' }}
                >
                  {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              minHeight: '140px',
              color: '#f8fafc',
              fontSize: '14.5px',
              lineHeight: 1.7,
              fontFamily: "'Nirmala UI', 'Noto Sans Devanagari', -apple-system, sans-serif",
              whiteSpace: 'pre-wrap',
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px' }}>
                <Loader2 size={16} className="spin" color="#38bdf8" />
                हिंदी अनुवाद तैयार किया जा रहा है…
              </div>
            ) : translatedText ? (
              translatedText
            ) : (
              <span style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
                Click "Translate to Hindi" above to view translation.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key Technical Glossary */}
      {glossary.length > 0 && (
        <div
          style={{
            background: 'var(--panel-bg, #16181d)',
            border: '1px solid var(--border-color, #2a2f38)',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
            <BookA size={15} />
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Key Technical Glossary (शब्दावली)
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {glossary.map((item, idx) => (
              <div
                key={idx}
                title={item.explanation}
                style={{
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>{item.source_term}</span>
                <span style={{ color: '#64748b' }}>→</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>{item.translated_term}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
