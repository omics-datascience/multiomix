import React from 'react'
import { LevelBadge } from './LevelBadge'
import { DepthSummaryItem, TraversalMode } from './types'

type Props = {
    traversalMode: TraversalMode;
    selectedRootNode: string | null;
    maxLevels: number;
    depthSummary: DepthSummaryItem[];
    incomingSummary: DepthSummaryItem[];
}

export const TraversalSummaryPanel = ({
    traversalMode,
    selectedRootNode,
    maxLevels,
    depthSummary,
    incomingSummary,
}: Props) => {
    return (
        <div
            style={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                background: '#ffffff',
                padding: 12,
            }}
        >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
                {traversalMode === 'outgoing'
                    ? 'Depth levels'
                    : traversalMode === 'incoming'
                        ? 'Upstream regulation levels'
                        : 'Relationship levels'}
            </div>

            {!selectedRootNode
                ? (
                    <div style={{ color: '#64748b', fontSize: 13 }}>
                        Select a node to calculate levels.
                    </div>
                )
                : (
                    <div style={{ display: 'grid', gap: 10 }}>
                        <div style={{ fontSize: 13, color: '#334155' }}>
                            Root node: <strong>{selectedRootNode}</strong>
                        </div>

                        <div style={{ fontSize: 13, color: '#334155' }}>
                            Search limit: <strong>{maxLevels}</strong> level{maxLevels > 1 ? 's' : ''}
                        </div>

                        {(traversalMode === 'outgoing' || traversalMode === 'both') && (
                            <div style={{ display: 'grid', gap: 8 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                                    Regulates
                                </div>

                                {depthSummary.length === 0
                                    ? (
                                        <div style={{ color: '#64748b', fontSize: 13 }}>
                                            No visible regulated nodes match the current filter.
                                        </div>
                                    )
                                    : (
                                        depthSummary.map((item) => (
                                            <div
                                                key={`out-${item.depth}`}
                                                style={{
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 8,
                                                    padding: '8px 10px',
                                                    background: '#f8fafc',
                                                    fontSize: 13,
                                                    color: '#334155',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <LevelBadge depth={item.depth} />
                                                    <strong>Level {item.depth}</strong>
                                                </div>
                                                <div>{item.nodes.join(', ')}</div>
                                            </div>
                                        ))
                                    )}
                            </div>
                        )}

                        {(traversalMode === 'incoming' || traversalMode === 'both') && (
                            <div style={{ display: 'grid', gap: 8 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                                    Regulated by
                                </div>

                                {incomingSummary.length === 0
                                    ? (
                                        <div style={{ color: '#64748b', fontSize: 13 }}>
                                            No visible regulators match the current filter.
                                        </div>
                                    )
                                    : (
                                        incomingSummary.map((item) => (
                                            <div
                                                key={`in-${item.depth}`}
                                                style={{
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 8,
                                                    padding: '8px 10px',
                                                    background: '#f8fafc',
                                                    fontSize: 13,
                                                    color: '#334155',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <LevelBadge depth={item.depth} incoming />
                                                    <strong>Level {item.depth}</strong>
                                                </div>
                                                <div>{item.nodes.join(', ')}</div>
                                            </div>
                                        ))
                                    )}
                            </div>
                        )}
                    </div>
                )}
        </div>
    )
}
