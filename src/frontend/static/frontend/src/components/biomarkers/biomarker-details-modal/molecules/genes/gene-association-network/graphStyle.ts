import { NodeKind } from './types'

export const NODE_COLORS: Record<NodeKind, string> = {
    Gene: '#4f46e5',
    miRNA: '#db2777',
    CNA: '#f59e0b',
    Methylation: '#10b981',
    Drug: '#64748b',
}

export const REGULATION_COLORS = {
    down: '#dc2626',
    up: '#2563eb',
}
