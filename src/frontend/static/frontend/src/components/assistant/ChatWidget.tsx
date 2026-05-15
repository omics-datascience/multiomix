import React, { useState } from 'react'
import { Button, Icon } from 'semantic-ui-react'
import { ChatPanel } from './ChatPanel'
import '../../css/chat-widget.css'

const STORAGE_KEY = 'multiomix_chat_open'

/**
 * Floating Action Button that toggles the ChatPanel open or closed.
 * Open state is persisted in localStorage so it survives page reloads.
 */
const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')

    /**
     * Sets the open/closed state and persists it to localStorage.
     * @param next
     */
    const toggle = (next: boolean) => {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
        setIsOpen(next)
    }

    return (
        <>
            {isOpen && <ChatPanel onClose={() => toggle(false)} />}

            <div className='chat-widget-fab'>
                <Button
                    circular
                    primary
                    icon
                    title={isOpen ? 'Close Assistant' : 'Open Assistant'}
                    onClick={() => toggle(!isOpen)}
                >
                    <Icon name={isOpen ? 'close' : 'comment alternate'} />
                </Button>
            </div>
        </>
    )
}

export { ChatWidget }
