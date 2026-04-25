import React from 'react'
import { Dropdown, Label } from 'semantic-ui-react'
import { NODE_COLORS, REGULATION_COLORS } from './graphStyle'
import { LegendArrow, LegendDot } from './legend'
import { TraversalMode } from './types'

const traversalOptions = [
    { key: 'outgoing', value: 'outgoing', text: 'Regulates' },
    { key: 'incoming', value: 'incoming', text: 'Regulated by' },
    { key: 'both', value: 'both', text: 'Both' },
]

type Props = {
    threshold: number;
    onThresholdChange: (value: number) => void;
    maxLevels: number;
    onMaxLevelsChange: (value: number) => void;
    traversalMode: TraversalMode;
    onTraversalModeChange: (value: TraversalMode) => void;
}

const roundThreshold = (value: number) => Number(value.toFixed(1))

export const GraphControls = ({
    threshold,
    onThresholdChange,
    maxLevels,
    onMaxLevelsChange,
    traversalMode,
    onTraversalModeChange,
}: Props) => {
    return (
        <div
            style={{
                display: 'grid',
                gap: 12,
                padding: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                background: '#ffffff',
            }}
        >
            <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ color: '#64748b', fontSize: 12 }}>
                    These values update the BRAF root while it is the only active filter. After expanding nodes, they are used for the next right-click expansion.
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        Correlation threshold
                    </div>

                    <Label>
                        Visible when correlation &lt;= -{threshold.toFixed(1)} or &gt;= {threshold.toFixed(1)}
                    </Label>
                </div>

                <input
                    type='range'
                    min={0.1}
                    max={0.9}
                    step={0.1}
                    value={threshold}
                    onChange={(e) => onThresholdChange(roundThreshold(Number(e.target.value)))}
                    style={{
                        width: '100%',
                        accentColor: '#2563eb',
                        cursor: 'pointer',
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: '#64748b',
                    }}
                >
                    <span>+/-0.1</span>
                    <span>+/-0.5</span>
                    <span>+/-0.9</span>
                </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        Maximum levels
                    </div>

                    <Label>
                        {maxLevels} level{maxLevels > 1 ? 's' : ''}
                    </Label>
                </div>

                <input
                    type='range'
                    min={1}
                    max={10}
                    step={1}
                    value={maxLevels}
                    onChange={(e) => onMaxLevelsChange(Number(e.target.value))}
                    style={{
                        width: '100%',
                        accentColor: '#16a34a',
                        cursor: 'pointer',
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: '#64748b',
                    }}
                >
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                        Node analysis:
                    </span>

                    <Dropdown
                        selection
                        value={traversalMode}
                        options={traversalOptions}
                        onChange={(_, data) => onTraversalModeChange(data.value as TraversalMode)}
                    />

                    <Label color='orange'>Root node: BRAF</Label>
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>Nodes:</span>
                        <LegendDot color={NODE_COLORS.Gene} label='Gene' />
                        <LegendDot color={NODE_COLORS.miRNA} label='miRNA' />
                        <LegendDot color={NODE_COLORS.CNA} label='CNA' />
                        <LegendDot color={NODE_COLORS.Methylation} label='Methylation' />
                        <LegendDot color={NODE_COLORS.Drug} label='Drug' />
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>Edges:</span>
                        <LegendArrow color={REGULATION_COLORS.down} label='Down-regulation' />
                        <LegendArrow color={REGULATION_COLORS.up} label='Up-regulation' />
                    </div>
                </div>
            </div>
        </div>
    )
}
