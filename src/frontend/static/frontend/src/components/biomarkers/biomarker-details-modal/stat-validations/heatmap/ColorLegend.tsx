import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { InteractionData } from './Heatmap'

/** ColorLegend's props. */
type ColorLegendProps = {
    height: number;
    width: number;
    min: number;
    max: number;
    colorScale: d3.ScaleLinear<string, string, never>;
    interactionData: InteractionData | null;
}

const COLOR_LEGEND_MARGIN = { top: 0, right: 0, bottom: 50, left: 0 }

/**
 * Renders a color legend for the heatmap.
 * @param props Component props.
 * @returns ColorLegend component.
 */
export const ColorLegend = (props: ColorLegendProps) => {
    const {
        height,
        colorScale,
        width,
        interactionData,
        min,
        max
    } = props
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const boundsWidth =
        width - COLOR_LEGEND_MARGIN.right - COLOR_LEGEND_MARGIN.left
    const boundsHeight =
        height - COLOR_LEGEND_MARGIN.top - COLOR_LEGEND_MARGIN.bottom

    const xScale = d3.scaleLinear().range([min, boundsWidth]).domain([min, max])

    const allTicks = xScale.ticks(4).map((tick) => {
        return (
            <React.Fragment key={tick}>
                <line
                    x1={xScale(tick)}
                    x2={xScale(tick)}
                    y1={0}
                    y2={boundsHeight + 10}
                    stroke='black'
                />
                <text
                    x={xScale(tick)}
                    y={boundsHeight + 20}
                    fontSize={9}
                    textAnchor='middle'
                >
                    {tick}
                </text>
            </React.Fragment>
        )
    })

    const hoveredValue = interactionData?.value
    const x = hoveredValue ? xScale(hoveredValue) : null
    const triangleWidth = 9
    const triangleHeight = 6
    const triangle = x
        ? (
            <polygon
                points={`${x},0 ${x - triangleWidth / 2},${-triangleHeight} ${x + triangleWidth / 2
                },${-triangleHeight}`}
                fill='grey'
            />
        )
        : null

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')

        if (!context) {
            return
        }

        for (let i = 0; i < boundsWidth; ++i) {
            context.fillStyle = colorScale((max * i) / boundsWidth)
            context.fillRect(i, 0, 1, boundsHeight)
        }
    }, [width, height])

    return (
        <div style={{ width, height }}>
            <div
                style={{
                    position: 'relative',
                    transform: `translate(${COLOR_LEGEND_MARGIN.left}px, ${COLOR_LEGEND_MARGIN.top}px`
                }}
            >
                <canvas ref={canvasRef} width={boundsWidth} height={boundsHeight} />
                <svg
                    width={boundsWidth}
                    height={boundsHeight}
                    style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
                >
                    {allTicks}
                    {triangle}
                </svg>
            </div>
        </div>
    )
}
