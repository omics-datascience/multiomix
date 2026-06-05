import React, { useRef, useState } from 'react'
import { Button, Icon } from 'semantic-ui-react'
import { Nullable } from '../../utils/interfaces'
import { ConversationSummary } from './types'

interface ConversationListProps {
    conversations: ConversationSummary[]
    activeId: Nullable<number>
    onSelect: (id: number) => void
    onNew: () => void
    onDelete: (id: number) => void
    onRename: (id: number, title: string) => void
}

/**
 * Formats an ISO timestamp as "HH:MM" for today, or "DD Mon" otherwise.
 * @param iso - ISO 8601 timestamp string.
 * @returns Human-readable time or date string.
 */
function formatConvDate (iso: string): string {
    const d = new Date(iso)
    const now = new Date()

    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

/**
 * Sidebar list of past conversations. Each item shows the title (or
 * "Untitled") and the last-updated timestamp. Supports inline
 * renaming on double-click and deletion via the trash icon.
 * @param props - Component props.
 * @param props.conversations - List of conversation summaries to display.
 * @param props.activeId - ID of the currently active conversation, or null.
 * @param props.onSelect - Callback invoked when a conversation is selected.
 * @param props.onNew - Callback invoked when the user starts a new conversation.
 * @param props.onDelete - Callback invoked when a conversation is deleted.
 * @param props.onRename - Callback invoked when a conversation is renamed.
 * @returns The rendered conversation list sidebar.
 */
const ConversationList = (props: ConversationListProps) => {
    const { conversations, activeId, onSelect, onNew, onDelete, onRename } = props
    const [editingId, setEditingId] = useState<Nullable<number>>(null)
    const [editTitle, setEditTitle] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    /**
     * Enters inline edit mode for the conversation title; stops event
     * propagation.
     * @param conv - The conversation being edited.
     * @param e - The mouse event that triggered the edit.
     */
    const startEdit = (conv: ConversationSummary, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingId(conv.id)
        setEditTitle(conv.title ?? '')
        setTimeout(() => inputRef.current?.select(), 0)
    }

    /**
     * Submits the trimmed title via `onRename` and exits edit mode.
     * @param id - ID of the conversation being renamed.
     */
    const commitEdit = (id: number) => {
        onRename(id, editTitle.trim())
        setEditingId(null)
    }

    /**
     * Exits edit mode without saving changes.
     * @returns void
     */
    const cancelEdit = () => setEditingId(null)

    return (
        <div className='chat-conversation-list'>
            <div className='conv-list-header'>
                <span>Chats</span>
                <Button
                    icon
                    size='mini'
                    title='New conversation'
                    onClick={onNew}
                    style={{ margin: 0, padding: '4px 6px' }}
                >
                    <Icon name='plus' />
                </Button>
            </div>
            {conversations.map(conv => (
                <div
                    key={conv.id}
                    className={`conv-item${conv.id === activeId ? ' active' : ''}`}
                    onClick={() => editingId !== conv.id && onSelect(conv.id)}
                >
                    <div className='conv-item-row'>
                        {editingId === conv.id
                            ? (
                                <input
                                    ref={inputRef}
                                    className='conv-rename-input'
                                    value={editTitle}
                                    autoFocus
                                    onChange={e => setEditTitle(e.target.value)}
                                    onBlur={() => commitEdit(conv.id)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') { e.preventDefault(); commitEdit(conv.id) }

                                        if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
                                    }}
                                    onClick={e => e.stopPropagation()}
                                />
                            )
                            : (
                                <span
                                    className='conv-item-title'
                                    onDoubleClick={e => startEdit(conv, e)}
                                    title='Double-click to rename'
                                >
                                    {conv.title ?? 'Untitled'}
                                </span>
                            )}
                        <Icon
                            name='trash alternate outline'
                            size='small'
                            className='conv-item-delete'
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(conv.id) }}
                        />
                    </div>
                    <span className='conv-item-date'>{formatConvDate(conv.updated_at)}</span>
                </div>
            ))}
            {conversations.length === 0 && (
                <div style={{ padding: '10px', fontSize: '0.78em', color: '#888' }}>
                    No conversations yet.
                </div>
            )}
        </div>
    )
}

export { ConversationList }
