import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Header, Icon } from 'semantic-ui-react'
import ky from 'ky'
import { getDjangoHeader } from '../../utils/util_functions'
import { ChatMessage, ChatResponse, ConversationDetail, ConversationSummary } from './types'
import { ConversationList } from './ConversationList'
import { MessageThread } from './MessageThread'

declare const urlAssistantChat: string
declare const urlAssistantConversations: string

const ACTIVE_CONV_KEY = 'multiomix_chat_conv_id'
const WIDTH_KEY = 'multiomix_chat_width'
const HEIGHT_KEY = 'multiomix_chat_height'

const MIN_W = 380
const MIN_H = 300

interface DragState {
    dir: 'w' | 'h' | 'both'
    startX: number
    startY: number
    startW: number
    startH: number
}

interface ChatPanelProps {
    onClose: () => void
}

const ChatPanel = ({ onClose }: ChatPanelProps) => {
    const [conversations, setConversations] = useState<ConversationSummary[]>([])
    const [activeConvId, setActiveConvId] = useState<number | null>(() => {
        const stored = localStorage.getItem(ACTIVE_CONV_KEY)
        return stored ? parseInt(stored, 10) : null
    })
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Panel size — persisted in localStorage
    const [panelW, setPanelW] = useState(() => {
        const s = localStorage.getItem(WIDTH_KEY)
        const saved = s ? parseInt(s, 10) : 700
        return Math.max(MIN_W, Math.min(window.innerWidth - 60, saved))
    })
    const [panelH, setPanelH] = useState(() => {
        const s = localStorage.getItem(HEIGHT_KEY)
        const saved = s ? parseInt(s, 10) : 520
        return Math.max(MIN_H, Math.min(window.innerHeight - 140, saved))
    })

    // Resize drag state stored in a ref to avoid re-renders during drag
    const dragRef = useRef<DragState | null>(null)

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const d = dragRef.current
            if (!d) return
            const maxW = Math.min(1100, window.innerWidth - 60)
            const maxH = Math.min(900, window.innerHeight - 140)
            if (d.dir === 'w' || d.dir === 'both') {
                const w = Math.max(MIN_W, Math.min(maxW, d.startW - (e.clientX - d.startX)))
                setPanelW(w)
                localStorage.setItem(WIDTH_KEY, String(w))
            }
            if (d.dir === 'h' || d.dir === 'both') {
                const h = Math.max(MIN_H, Math.min(maxH, d.startH - (e.clientY - d.startY)))
                setPanelH(h)
                localStorage.setItem(HEIGHT_KEY, String(h))
            }
        }
        const onUp = () => {
            dragRef.current = null
            document.body.style.userSelect = ''
            document.body.style.cursor = ''
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
        return () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const startDrag = (e: React.MouseEvent, dir: 'w' | 'h' | 'both') => {
        e.preventDefault()
        dragRef.current = { dir, startX: e.clientX, startY: e.clientY, startW: panelW, startH: panelH }
        document.body.style.userSelect = 'none'
        document.body.style.cursor = dir === 'w' ? 'ew-resize' : dir === 'h' ? 'ns-resize' : 'nwse-resize'
    }

    const loadConversations = useCallback(() => {
        ky.get(urlAssistantConversations).json<ConversationSummary[]>().then(data => {
            setConversations(data)
        }).catch(err => console.error('Error loading conversations', err))
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // On mount: load conversations, then restore the active one if it still exists
    useEffect(() => {
        ky.get(urlAssistantConversations).json<ConversationSummary[]>().then(data => {
            setConversations(data)
            const storedId = localStorage.getItem(ACTIVE_CONV_KEY)
            if (storedId) {
                const id = parseInt(storedId, 10)
                const exists = data.some(c => c.id === id)
                if (exists) {
                    loadConvMessages(id)
                } else {
                    localStorage.removeItem(ACTIVE_CONV_KEY)
                    setActiveConvId(null)
                }
            }
        }).catch(err => console.error('Error loading conversations', err))
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const loadConvMessages = (id: number) => {
        const convUrl = `${urlAssistantConversations}${id}/`
        ky.get(convUrl).json<ConversationDetail>().then(data => {
            setMessages(data.messages)
        }).catch(err => console.error('Error loading conversation', err))
    }

    const selectConversation = (id: number) => {
        localStorage.setItem(ACTIVE_CONV_KEY, String(id))
        setActiveConvId(id)
        loadConvMessages(id)
    }

    const startNewConversation = () => {
        localStorage.removeItem(ACTIVE_CONV_KEY)
        setActiveConvId(null)
        setMessages([])
    }

    const deleteConversation = (id: number) => {
        const convUrl = `${urlAssistantConversations}${id}/`
        ky.delete(convUrl, { headers: getDjangoHeader() }).then(() => {
            if (activeConvId === id) {
                startNewConversation()
            }
            setConversations(prev => prev.filter(c => c.id !== id))
            loadConversations()
        }).catch(err => console.error('Error deleting conversation', err))
    }

    const sendMessage = (text: string) => {
        const userMsg: ChatMessage = { role: 'user', content: text }
        setMessages(prev => [...prev, userMsg])
        setIsLoading(true)

        ky.post(urlAssistantChat, {
            headers: getDjangoHeader(),
            json: { message: text, conversation_id: activeConvId ?? undefined },
            timeout: 180000, // 3 minutes — LLM + tool calls can take a while
        }).json<ChatResponse>().then(data => {
            const assistantMsg: ChatMessage = { role: 'assistant', content: data.reply }
            setMessages(prev => [...prev, assistantMsg])

            if (!activeConvId) {
                localStorage.setItem(ACTIVE_CONV_KEY, String(data.conversation_id))
                setActiveConvId(data.conversation_id)
            }
            loadConversations()
        }).catch(async err => {
            let detail = err?.message ?? String(err)
            if (err?.response) {
                try {
                    const body = await err.response.json()
                    detail = body?.detail ?? body?.error ?? JSON.stringify(body)
                } catch {
                    detail = `HTTP ${err.response.status}`
                }
            }
            console.error('Error sending message:', detail, err)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${detail}`,
            }])
        }).finally(() => {
            setIsLoading(false)
        })
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '96px',
            right: '28px',
            width: `${panelW}px`,
            height: `${panelH}px`,
            zIndex: 8999,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            borderRadius: '10px',
            overflow: 'hidden',
            backgroundColor: '#fff',
            border: '1px solid rgba(34,36,38,.15)',
        }}>
            {/* Resize handles */}
            <div
                className="chat-resize-handle chat-resize-left"
                onMouseDown={e => startDrag(e, 'w')}
            />
            <div
                className="chat-resize-handle chat-resize-top"
                onMouseDown={e => startDrag(e, 'h')}
            />
            <div
                className="chat-resize-handle chat-resize-corner"
                onMouseDown={e => startDrag(e, 'both')}
            />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(34,36,38,.15)', flexShrink: 0, backgroundColor: '#fff' }}>
                <Header as="h5" style={{ margin: 0 }}>
                    <Icon name="comment alternate outline" />
                    Multiomix Assistant
                </Header>
                <Icon name="close" style={{ cursor: 'pointer', opacity: 0.6 }} onClick={onClose} />
            </div>

            {/* Body */}
            <div className="chat-panel-inner">
                <ConversationList
                    conversations={conversations}
                    activeId={activeConvId}
                    onSelect={selectConversation}
                    onNew={startNewConversation}
                    onDelete={deleteConversation}
                />
                <MessageThread
                    messages={messages}
                    isLoading={isLoading}
                    onSend={sendMessage}
                />
            </div>
        </div>
    )
}

export { ChatPanel }
