import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Header, Icon } from 'semantic-ui-react'
import ky from 'ky'
import { getDjangoHeader } from '../../utils/util_functions'
import { Nullable } from '../../utils/interfaces'
import { ChatMessage, ChatResponse, ConversationDetail, ConversationSummary } from './types'
import { ConversationList } from './ConversationList'
import { MessageThread } from './MessageThread'

declare const urlAssistantChat: string
declare const urlAssistantConversations: string

const ACTIVE_CONV_KEY = 'multiomix_chat_conv_id'
const WIDTH_KEY = 'multiomix_chat_width'
const HEIGHT_KEY = 'multiomix_chat_height'

const MIN_W = Math.max(640, Math.round(window.innerWidth * 0.42))
const MIN_H = Math.max(420, Math.round(window.innerHeight * 0.48))
const MAX_W = Math.min(1000, window.innerWidth - 40)
const MAX_H = window.innerHeight - 80

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

/**
 * Floating, resizable chat panel. Renders a two-column layout:
 * a sidebar with the conversation history (ConversationList) and
 * the active message thread (MessageThread). Panel dimensions are
 * persisted in localStorage and can be adjusted by dragging the
 * left/top/corner resize handles.
 * @param root0
 * @param root0.onClose
 */
const ChatPanel = ({ onClose }: ChatPanelProps) => {
    const [conversations, setConversations] = useState<ConversationSummary[]>([])
    const [activeConvId, setActiveConvId] = useState<Nullable<number>>(() => {
        const stored = localStorage.getItem(ACTIVE_CONV_KEY)
        return stored ? parseInt(stored, 10) : null
    })
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const toggleFullscreen = () => {
        setIsFullscreen(prev => {
            if (prev) {
                // Exiting fullscreen → restore default dimensions
                const w = Math.min(780, Math.round(window.innerWidth * 0.55))
                const h = Math.min(600, Math.round(window.innerHeight * 0.65))
                setPanelW(w)
                setPanelH(h)
                localStorage.setItem(WIDTH_KEY, String(w))
                localStorage.setItem(HEIGHT_KEY, String(h))
            }
            return !prev
        })
    }

    /** Panel dimensions; both values are persisted to localStorage. */
    const [panelW, setPanelW] = useState(() => {
        const s = localStorage.getItem(WIDTH_KEY)
        const saved = s ? parseInt(s, 10) : Math.min(900, Math.round(window.innerWidth * 0.62))
        return Math.max(MIN_W, Math.min(MAX_W, saved))
    })
    const [panelH, setPanelH] = useState(() => {
        const s = localStorage.getItem(HEIGHT_KEY)
        const saved = s ? parseInt(s, 10) : Math.min(600, Math.round(window.innerHeight * 0.65))
        return Math.max(MIN_H, Math.min(MAX_H, saved))
    })

    /** Drag state kept in a ref so mouse-move handlers don't trigger re-renders. */
    const dragRef = useRef<Nullable<DragState>>(null)

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const d = dragRef.current

            if (!d) { return }

            if (d.dir === 'w' || d.dir === 'both') {
                const w = Math.max(MIN_W, Math.min(MAX_W, d.startW - (e.clientX - d.startX)))
                setPanelW(w)
                localStorage.setItem(WIDTH_KEY, String(w))
            }

            if (d.dir === 'h' || d.dir === 'both') {
                const h = Math.max(MIN_H, Math.min(MAX_H, d.startH - (e.clientY - d.startY)))
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
    }, [])

    /**
     * Initiates a resize drag in the given direction; stores initial cursor
     * and panel dimensions.
     * @param e
     * @param dir
     */
    const startDrag = (e: React.MouseEvent, dir: 'w' | 'h' | 'both') => {
        e.preventDefault()
        dragRef.current = { dir, startX: e.clientX, startY: e.clientY, startW: panelW, startH: panelH }
        document.body.style.userSelect = 'none'
        document.body.style.cursor = dir === 'w' ? 'ew-resize' : dir === 'h' ? 'ns-resize' : 'nwse-resize'
    }

    /**
     * Fetches the conversation list from the server and updates state.
     */
    const loadConversations = useCallback(() => {
        ky.get(urlAssistantConversations).json<ConversationSummary[]>().then(data => {
            setConversations(data)
        }).catch(err => console.error('Error loading conversations', err))
    }, [])

    /** On mount: loads the conversation list and restores the previously active conversation if it still exists. */
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
    }, [])

    /**
     * Fetches all messages for the conversation with the given ID.
     * @param id
     */
    const loadConvMessages = (id: number) => {
        const convUrl = `${urlAssistantConversations}${id}/`
        ky.get(convUrl).json<ConversationDetail>().then(data => {
            setMessages(data.messages)
        }).catch(err => console.error('Error loading conversation', err))
    }

    /**
     * Persists the selected conversation in localStorage, updates state,
     * and loads its messages.
     * @param id
     */
    const selectConversation = (id: number) => {
        localStorage.setItem(ACTIVE_CONV_KEY, String(id))
        setActiveConvId(id)
        loadConvMessages(id)
    }

    /**
     * Clears the active conversation and empties the message list.
     */
    const startNewConversation = () => {
        localStorage.removeItem(ACTIVE_CONV_KEY)
        setActiveConvId(null)
        setMessages([])
    }

    /**
     * DELETEs the conversation on the server, falls back to a new
     * conversation if it was active.
     * @param id
     */
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

    /**
     * PATCHes the conversation title on the server and updates local
     * state optimistically.
     * @param id
     * @param title
     */
    const renameConversation = (id: number, title: string) => {
        const convUrl = `${urlAssistantConversations}${id}/`
        ky.patch(convUrl, {
            headers: getDjangoHeader(),
            json: { title: title || null },
        }).then(() => {
            setConversations(prev => prev.map(c => c.id === id ? { ...c, title: title || null } : c))
        }).catch(err => console.error('Error renaming conversation', err))
    }

    /**
     * Appends the user message optimistically, POSTs to the chat API,
     * then appends the assistant reply or an error message.
     * @param text
     */
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

    const panelStyle: React.CSSProperties = isFullscreen
        ? {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 8999,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'none',
            borderRadius: 0,
            overflow: 'hidden',
            backgroundColor: '#fff',
            border: '1px solid rgba(34,36,38,.15)',
        }
        : {
            position: 'fixed',
            bottom: '76px',
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
        }

    return (
        <div style={panelStyle}>
            {/* Resize handles — hidden in fullscreen */}
            {!isFullscreen && (
                <>
                    <div
                        className='chat-resize-handle chat-resize-left'
                        onMouseDown={e => startDrag(e, 'w')}
                    />
                    <div
                        className='chat-resize-handle chat-resize-top'
                        onMouseDown={e => startDrag(e, 'h')}
                    />
                    <div
                        className='chat-resize-handle chat-resize-corner'
                        onMouseDown={e => startDrag(e, 'both')}
                    />
                </>
            )}

            {/* Header */}
            <div className='chat-panel-header'>
                <Header as='h5' style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <i className='robot icon' style={{ flexShrink: 0 }} />
                    <span style={{ flexShrink: 0 }}>Multiomix Assistant</span>
                    {activeConvId && conversations.find(c => c.id === activeConvId)?.title && (
                        <>
                            <span style={{ flexShrink: 0, color: '#ccc', fontWeight: 300 }}>·</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#888', fontWeight: 400 }}>
                                {conversations.find(c => c.id === activeConvId)?.title}
                            </span>
                        </>
                    )}
                </Header>
                <div className='chat-window-controls'>
                    <button
                        className='chat-ctrl-btn chat-ctrl-maximize'
                        title={isFullscreen ? 'Restaurar ventana' : 'Pantalla completa'}
                        onClick={toggleFullscreen}
                    >
                        <Icon name={isFullscreen ? 'compress' : 'expand arrows alternate'} fitted />
                    </button>
                    <button
                        className='chat-ctrl-btn chat-ctrl-close'
                        title='Cerrar'
                        onClick={onClose}
                    >
                        <Icon name='close' fitted />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className='chat-panel-inner'>
                <ConversationList
                    conversations={conversations}
                    activeId={activeConvId}
                    onSelect={selectConversation}
                    onNew={startNewConversation}
                    onDelete={deleteConversation}
                    onRename={renameConversation}
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
