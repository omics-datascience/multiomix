import React from 'react'

type LegendItemProps = {
    color: string;
    label: string;
}

/**
 * Renders a colored dot item used by the graph legend.
 * @param props Component props.
 * @param props.color Color shown in the legend swatch.
 * @param props.label Visible legend label.
 * @returns The node legend item.
 */
export const LegendDot = (props: LegendItemProps): JSX.Element => {
    const { color, label } = props

    return (
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
}

/**
 * Renders an arrow item used by the graph edge legend.
 * @param props Component props.
 * @param props.color Color shown in the legend arrow.
 * @param props.label Visible legend label.
 * @returns The edge legend item.
 */
export const LegendArrow = (props: LegendItemProps): JSX.Element => {
    const { color, label } = props

    return (
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
}
