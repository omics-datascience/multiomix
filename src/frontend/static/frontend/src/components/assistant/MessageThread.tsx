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

/**
 * Capability groups shown in the empty-state welcome screen.
 * Each entry represents a thematic area the assistant can help with,
 * derived from the tool set defined in `assistant/services/tools.py`
 * (internal Multiomix tools) and the MCP servers configured via
 * `assistant/services/mcp_loader.py` (BioMCP, cBioPortal, etc.).
 *
 * Displayed as a three-column grid of cards, each card showing an icon,
 * a category name, and a bullet list of example capabilities.
 * Update this list whenever a new tool category is added or removed.
 */
const TOOL_CATEGORIES = [
    {
        icon: 'database' as const,
        name: 'Your data',
        items: [
            'Correlation experiments',
            'Biomarkers and feature selection',
            'Uploaded files',
            'Statistical validation',
        ],
    },
    {
        icon: 'lab' as const,
        name: 'Bioinformatics',
        items: [
            'Genes, miRNAs and CpG sites',
            'cBioPortal (CGDS) datasets',
            'STRING interaction networks',
            'Statistical methods',
        ],
    },
    {
        icon: 'book' as const,
        name: 'Medical literature',
        items: [
            'Papers on PubMed / bioRxiv',
            'Clinical trials (ClinicalTrials)',
            'Genomic variants (OncoKB)',
            'Gene / drug annotations',
        ],
    },
]

/**
 * One-click example prompts shown below the capability cards in the
 * empty-state screen. Clicking a chip fires `onSend` directly with the
 * prompt text, letting the user try the assistant without typing.
 * These are purely illustrative — edit freely to reflect the most
 * useful or frequently requested queries.
 */
const SUGGESTED_PROMPTS = [
    'Show my recent experiments',
    'What are my biomarkers?',
    'Search PubMed papers about DESeq2',
    'Clinical trials for BRCA1',
    'Information about the TP53 gene',
    'What files have I uploaded?',
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
                        <p className='chat-welcome-title'>How can I help you?</p>
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
                                    title={copiedKey === msgKey ? 'Copied' : 'Copy'}
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
                    placeholder='Type a message… (Enter to send, Shift+Enter for new line)'
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
                    title='Send'
                    style={{ alignSelf: 'flex-end' }}
                >
                    <Icon name='send' />
                </Button>
            </div>
        </div>
    )
}

export { MessageThread }
