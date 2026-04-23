import React from 'react'

const LEVEL_COLORS = {
    level1: '#0ea5e9',
    level2: '#22c55e',
    level3: '#a855f7',
    other: '#94a3b8',
}

export const LevelBadge = ({
    depth,
    incoming = false,
}: {
    depth: number;
    incoming?: boolean;
}) => {
    const color =
        depth === 1
            ? LEVEL_COLORS.level1
            : depth === 2
                ? LEVEL_COLORS.level2
                : depth === 3
                    ? LEVEL_COLORS.level3
                    : LEVEL_COLORS.other

    return (
        <span
            style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: '#ffffff',
                border: `3px ${incoming ? 'double' : 'solid'} ${color}`,
                display: 'inline-block',
                boxSizing: 'border-box',
                flexShrink: 0,
            }}
        />
    )
}
