import React, { useState } from 'react'
import { Renderer } from './Renderer'
import { ColorLegend } from './ColorLegend'
import * as d3 from 'd3'
import { THRESHOLDS, COLORS, COLOR_LEGEND_HEIGHT } from './constants'
import { Tooltip } from './Tooltip'

/** Heatmap's props. */
type HeatmapProps = {
    width: number;
    height: number;
    min: number;
    max: number;
    data: { x: number | string; y: string; value: number }[];
};

/** Interaction data for the tooltip. */
export type InteractionData = {
    xLabel: string;
    yLabel: string;
    xPos: number;
    yPos: number;
    value: number | null;
};

/**
 * Renders a HeatMap chart. Taken from https://www.react-graph-gallery.com/heatmap.
 * @param props Component props.
 * @returns Heatmap component.
 */
export const Heatmap = (props: HeatmapProps) => {
    const { width, height, data, min, max } = props
    const [hoveredCell, setHoveredCell] = useState<InteractionData | null>(null)

    // Computes color range
    const colorScale = d3
        .scaleLinear<string>()
        .domain(THRESHOLDS.map((t) => t * max))
        .range(COLORS)

    return (
        <div style={{ position: 'relative' }}>
            <Renderer
                width={width}
                height={height - COLOR_LEGEND_HEIGHT}
                data={data}
                setHoveredCell={setHoveredCell}
                colorScale={colorScale}
            />
            <Tooltip
                interactionData={hoveredCell}
                width={width}
                height={height - COLOR_LEGEND_HEIGHT}
            />
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <ColorLegend
                    height={COLOR_LEGEND_HEIGHT}
                    width={200}
                    colorScale={colorScale}
                    interactionData={hoveredCell}
                    min={min}
                    max={max}
                />
            </div>
        </div>
    )
}
