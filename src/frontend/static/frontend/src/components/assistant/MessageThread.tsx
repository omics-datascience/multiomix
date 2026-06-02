import React, { useEffect, useRef, useState } from 'react'
import { Button, Icon } from 'semantic-ui-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Nullable } from '../../utils/interfaces'
import { ChatMessage } from './types'

interface MessageThreadProps {
    messages: ChatMessage[]
    isLoading: boolean
    onSend: (text: string) => void
}

const TOOL_CATEGORIES = [
    {
        icon: 'database' as const,
        name: 'Tus datos',
        items: [
            'Experimentos de correlación',
            'Biomarkers y feature selection',
            'Archivos subidos',
            'Validación estadística',
        ],
    },
    {
        icon: 'lab' as const,
        name: 'Bioinformática',
        items: [
            'Genes, miRNAs y sitios CpG',
            'Datasets cBioPortal (CGDS)',
            'Redes de interacción STRING',
            'Métodos estadísticos',
        ],
    },
    {
        icon: 'book' as const,
        name: 'Literatura médica',
        items: [
            'Papers en PubMed / bioRxiv',
            'Ensayos clínicos (ClinicalTrials)',
            'Variantes genómicas (OncoKB)',
            'Anotaciones gen / fármaco',
        ],
    },
]

const SUGGESTED_PROMPTS = [
    'Mostrar mis experimentos recientes',
    '¿Cuáles son mis biomarkers?',
    'Buscar papers sobre DESeq2 en PubMed',
    'Ensayos clínicos para BRCA1',
    'Información sobre el gen TP53',
    '¿Qué archivos tengo subidos?',
]

/**
 * Formats an ISO timestamp as "HH:MM" for today, or "DD Mon HH:MM" otherwise.
 * @param iso
 */
function formatMsgTime (iso: string | undefined): string {
    if (!iso) { return '' }

    const d = new Date(iso)
    const now = new Date()
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (d.toDateString() === now.toDateString()) { return time }

    return d.toLocaleDateString([], { day: '2-digit', month: 'short' }) + ' ' + time
}

/**
 * Main chat message area. Renders the message history with Markdown
 * support (including a click-to-enlarge image lightbox), a copy-to-
 * clipboard button per message, a typing indicator while the assistant
 * is responding, and a textarea input for sending new messages.
 * @param root0
 * @param root0.messages
 * @param root0.isLoading
 * @param root0.onSend
 */
const MessageThread = ({ messages, isLoading, onSend }: MessageThreadProps) => {
    const [input, setInput] = useState('')
    const [lightboxSrc, setLightboxSrc] = useState<Nullable<string>>(null)
    const [copiedKey, setCopiedKey] = useState<Nullable<string>>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isLoading])

    /** Closes the lightbox when the Escape key is pressed. */
    useEffect(() => {
        if (!lightboxSrc) { return }

        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setLightboxSrc(null) } }

        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [lightboxSrc])

    /**
     * Trims the input and, if non-empty, delegates to `onSend`; clears
     * the textarea.
     */
    const handleSend = () => {
        const trimmed = input.trim()

        if (!trimmed || isLoading) { return }

        setInput('')
        onSend(trimmed)
    }

    /**
     * Submits on Enter; allows Shift+Enter for line breaks.
     * @param e
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    /**
     * Copies content to the clipboard and briefly flips the button to a
     * "copied" state.
     * @param key
     * @param content
     */
    const handleCopy = (key: string, content: string) => {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedKey(key)
            setTimeout(() => setCopiedKey(prev => prev === key ? null : prev), 2000)
        }).catch(() => { /* clipboard not available */ })
    }

    /** Custom markdown image renderer that adds a click-to-enlarge lightbox. */
    const mdComponents = {
        img: ({ src, alt }: { src?: string; alt?: string }) => (
            <img
                src={src}
                alt={alt ?? ''}
                className='chat-md-image'
                onClick={() => src && setLightboxSrc(src)}
                title='Click to enlarge'
            />
        ),
    }

    return (
        <div className='chat-message-thread'>
            {/* Lightbox overlay */}
            {lightboxSrc && (
                <div className='chat-lightbox' onClick={() => setLightboxSrc(null)}>
                    <button className='chat-lightbox-close' onClick={() => setLightboxSrc(null)}>
                        <Icon name='close' />
                    </button>
                    <img
                        src={lightboxSrc}
                        alt='Enlarged'
                        className='chat-lightbox-img'
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}

            <div className='chat-messages-scroll' ref={scrollRef}>
                {messages.length === 0 && !isLoading && (
                    <div className='chat-empty-state'>
                        <p className='chat-welcome-title'>¿En qué puedo ayudarte?</p>
                        <div className='chat-capabilities-grid'>
                            {TOOL_CATEGORIES.map(cat => (
                                <div key={cat.name} className='chat-capability-card'>
                                    <div className='chat-capability-name'>
                                        <Icon name={cat.icon} size='small' />
                                        {cat.name}
                                    </div>
                                    <ul className='chat-capability-items'>
                                        {cat.items.map(item => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className='chat-suggested-prompts'>
                            {SUGGESTED_PROMPTS.map(prompt => (
                                <button
                                    key={prompt}
                                    className='chat-prompt-chip'
                                    onClick={() => onSend(prompt)}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const msgKey = msg.id != null ? `db-${msg.id}` : `opt-${idx}`
                    return (
                        <div key={msgKey} className={`chat-message-wrapper ${msg.role}`}>
                            <div className='chat-message-bubble-row'>
                                <div className={`chat-message ${msg.role}`}>
                                    {msg.role === 'assistant'
                                        ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{msg.content}</ReactMarkdown>
                                        : msg.content}
                                </div>
                                <button
                                    className={`chat-copy-btn${copiedKey === msgKey ? ' copied' : ''}`}
                                    title={copiedKey === msgKey ? 'Copiado' : 'Copiar'}
                                    onClick={() => handleCopy(msgKey, msg.content)}
                                >
                                    <Icon name={copiedKey === msgKey ? 'check' : 'copy outline'} size='small' />
                                </button>
                            </div>
                            {msg.created_at && (
                                <span className='chat-msg-time'>{formatMsgTime(msg.created_at)}</span>
                            )}
                        </div>
                    )
                })}
                {isLoading && (
                    <div className='chat-message assistant loading'>
                        <span className='chat-typing-dot' />
                        <span className='chat-typing-dot' />
                        <span className='chat-typing-dot' />
                    </div>
                )}
            </div>
            <div className='chat-input-area'>
                <textarea
                    rows={2}
                    placeholder='Escribí un mensaje… (Enter para enviar, Shift+Enter para nueva línea)'
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <Button
                    icon
                    primary
                    size='small'
                    disabled={isLoading || !input.trim()}
                    onClick={handleSend}
                    title='Enviar'
                    style={{ alignSelf: 'flex-end' }}
                >
                    <Icon name='send' />
                </Button>
            </div>
        </div>
    )
}

export { MessageThread }
