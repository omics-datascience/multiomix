import React from 'react'

const LEVEL_COLORS = {
    level1: '#0ea5e9',
    level2: '#22c55e',
    level3: '#a855f7',
    other: '#94a3b8',
}

interface LevelBadgeProps {
    depth: number;
    incoming?: boolean;
}

/**
 * Displays the visual badge used to identify a traversal depth level.
 * @param props Component props.
 * @param props.depth Depth level represented by the badge.
 * @param props.incoming Whether the badge should use the incoming traversal style.
 * @returns The colored level badge rendered inline.
 */
export const LevelBadge = (props: LevelBadgeProps): JSX.Element => {
    const {
        depth,
        incoming = false,
    } = props
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
