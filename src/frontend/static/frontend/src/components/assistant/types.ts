/** A single chat message */
export interface ChatMessage {
    id?: number
    role: 'user' | 'assistant'
    content: string
    created_at?: string
}

/** A conversation summary (list view) */
export interface ConversationSummary {
    id: number
    title: string | null
    created_at: string
    updated_at: string
}

/** Full conversation with messages */
export interface ConversationDetail extends ConversationSummary {
    messages: ChatMessage[]
}

/** Response from POST /assistant/api/chat/ */
export interface ChatResponse {
    conversation_id: number
    reply: string
}
