import React from 'react'
import { Button, Icon } from 'semantic-ui-react'
import { ConversationSummary } from './types'

interface ConversationListProps {
    conversations: ConversationSummary[]
    activeId: number | null
    onSelect: (id: number) => void
    onNew: () => void
    onDelete: (id: number) => void
}

const ConversationList = ({ conversations, activeId, onSelect, onNew, onDelete }: ConversationListProps) => {
    return (
        <div className="chat-conversation-list">
            <div className="conv-list-header">
                <span>Chats</span>
                <Button
                    icon
                    size="mini"
                    title="New conversation"
                    onClick={onNew}
                    style={{ margin: 0, padding: '4px 6px' }}
                >
                    <Icon name="plus" />
                </Button>
            </div>
            {conversations.map(conv => (
                <div
                    key={conv.id}
                    className={`conv-item${conv.id === activeId ? ' active' : ''}`}
                    title={conv.title ?? 'Untitled'}
                    onClick={() => onSelect(conv.id)}
                >
                    <span style={{ flex: 1 }}>{conv.title ?? 'Untitled'}</span>
                    <Icon
                        name="trash alternate outline"
                        size="small"
                        style={{ float: 'right', opacity: 0.4, cursor: 'pointer' }}
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(conv.id) }}
                    />
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
