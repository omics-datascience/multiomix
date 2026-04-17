import React, { useEffect, useRef, useState } from 'react'
import { Button, Icon } from 'semantic-ui-react'
import { ChatMessage } from './types'

interface MessageThreadProps {
    messages: ChatMessage[]
    isLoading: boolean
    onSend: (text: string) => void
}

const MessageThread = ({ messages, isLoading, onSend }: MessageThreadProps) => {
    const [input, setInput] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isLoading])

    const handleSend = () => {
        const trimmed = input.trim()
        if (!trimmed || isLoading) return
        setInput('')
        onSend(trimmed)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="chat-message-thread">
            <div className="chat-messages-scroll" ref={scrollRef}>
                {messages.length === 0 && !isLoading && (
                    <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.85em', marginTop: '20px' }}>
                        Ask me anything about your experiments, biomarkers, or genes.
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={msg.id != null ? `db-${msg.id}` : `opt-${idx}`} className={`chat-message ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {isLoading && (
                    <div className="chat-message assistant loading">
                        Thinking...
                    </div>
                )}
            </div>
            <div className="chat-input-area">
                <textarea
                    rows={2}
                    placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <Button
                    icon
                    primary
                    size="small"
                    disabled={isLoading || !input.trim()}
                    onClick={handleSend}
                    title="Send"
                    style={{ alignSelf: 'flex-end' }}
                >
                    <Icon name="send" />
                </Button>
            </div>
        </div>
    )
}

export { MessageThread }
