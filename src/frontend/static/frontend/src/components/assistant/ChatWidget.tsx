import React, { useState } from 'react'
import { Button } from 'semantic-ui-react'
import { ChatPanel } from './ChatPanel'
import '../../css/chat-widget.css'

const STORAGE_KEY = 'multiomix_chat_open'

/**
 * Floating Action Button that toggles the ChatPanel open or closed.
 * Open state is persisted in localStorage so it survives page reloads.
 * @returns The rendered FAB and, when open, the ChatPanel.
 */
const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')

    /**
     * Sets the open/closed state and persists it to localStorage.
     * @param next - The desired open state.
     */
    const toggle = (next: boolean) => {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
        setIsOpen(next)
    }

    return (
        <>
            {isOpen && <ChatPanel onClose={() => toggle(false)} />}

            <div className={`chat-widget-fab${isOpen ? ' chat-widget-fab--open' : ''}`}>
                <Button
                    circular
                    primary
                    icon
                    title={isOpen ? 'Close Multiomix Assistant' : 'Open Multiomix Assistant'}
                    onClick={() => toggle(!isOpen)}
                >
                    <i className='robot icon' />
                </Button>
            </div>
        </>
    )
}

export { ChatWidget }
