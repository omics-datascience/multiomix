import React from 'react'

export const LegendDot = ({ color, label }: { color: string; label: string }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
        <span
            style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: color,
                display: 'inline-block',
            }}
        />
        {label}
    </span>
)

export const LegendArrow = ({ color, label }: { color: string; label: string }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
        <span
            style={{
                position: 'relative',
                width: 22,
                height: 0,
                borderTop: `3px solid ${color}`,
                display: 'inline-block',
            }}
        >
            <span
                style={{
                    position: 'absolute',
                    right: -2,
                    top: -6,
                    width: 0,
                    height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderLeft: `8px solid ${color}`,
                }}
            />
        </span>
        {label}
    </span>
)
