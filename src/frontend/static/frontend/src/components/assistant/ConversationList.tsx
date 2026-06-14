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
 * @param iso
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
 * "Sin título") and the last-updated timestamp. Supports inline
 * renaming on double-click and deletion via the trash icon.
 * @param root0
 * @param root0.conversations
 * @param root0.activeId
 * @param root0.onSelect
 * @param root0.onNew
 * @param root0.onDelete
 * @param root0.onRename
 */

const ConversationList = ({ conversations, activeId, onSelect, onNew, onDelete, onRename }: ConversationListProps) => {
    const [editingId, setEditingId] = useState<Nullable<number>>(null)
    const [editTitle, setEditTitle] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    /**
     * Enters inline edit mode for the conversation title; stops event
     * propagation.
     * @param conv
     * @param e
     */

    const startEdit = (conv: ConversationSummary, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingId(conv.id)
        setEditTitle(conv.title ?? '')
        setTimeout(() => inputRef.current?.select(), 0)
    }

    /**
     * Submits the trimmed title via `onRename` and exits edit mode.
     * @param id
     */

    const commitEdit = (id: number) => {
        onRename(id, editTitle.trim())
        setEditingId(null)
    }

    /**
     * Exits edit mode without saving changes.
     */

    const cancelEdit = () => setEditingId(null)

    return (
        <div className='chat-conversation-list'>
            <div className='conv-list-header'>
                <span>Chats</span>
                <Button
                    icon
                    size='mini'
                    title='Nueva conversación'
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
                                    title='Doble clic para renombrar'
                                >
                                    {conv.title ?? 'Sin título'}
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
                    No hay conversaciones aún.
                </div>
            )}
        </div>
    )
}

export { ConversationList }
