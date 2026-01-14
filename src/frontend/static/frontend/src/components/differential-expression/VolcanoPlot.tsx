import React from 'react'
import Plot from 'react-plotly.js'

type VolcanoPoint = {
    id: string | number
    label?: string
    log2FC: number // X axis
    pValue: number // p-value (we plot -log10(p))
}

interface VolcanoPlotProps {
    data: VolcanoPoint[]
    fcThreshold?: number
    pThreshold?: number
    showThresholds: boolean
}

export const VolcanoPlot = ({
    data,
    fcThreshold = 1,
    pThreshold = 0.05,
    showThresholds
}: VolcanoPlotProps) => {
    const transformP = (p: number) => -Math.log10(p)

    const significant = data.filter(
        (d) => Math.abs(d.log2FC) >= fcThreshold && d.pValue <= pThreshold
    )

    const nonsignificant = data.filter(
        (d) => !(Math.abs(d.log2FC) >= fcThreshold && d.pValue <= pThreshold)
    )
    const pLineY = transformP(pThreshold)

    const thresholdShapes = showThresholds
        ? [
        // p-value threshold (horizontal)
            {
                type: 'line',
                xref: 'paper',
                x0: 0,
                x1: 1,
                yref: 'y',
                y0: pLineY,
                y1: pLineY,
                line: { dash: 'dash', width: 1 },
            },
            // +log2FC threshold
            {
                type: 'line',
                xref: 'x',
                x0: fcThreshold,
                x1: fcThreshold,
                yref: 'paper',
                y0: 0,
                y1: 1,
                line: { dash: 'dash', width: 1 },
            },
            // -log2FC threshold
            {
                type: 'line',
                xref: 'x',
                x0: -fcThreshold,
                x1: -fcThreshold,
                yref: 'paper',
                y0: 0,
                y1: 1,
                line: { dash: 'dash', width: 1 },
            },
        ]
        : []

    return (
        <Plot
            key={`${fcThreshold}-${pThreshold}`}
            data={[
                {
                    x: significant.map((d) => d.log2FC),
                    y: significant.map((d) => transformP(d.pValue)),
                    text: significant.map((d) => d.label ?? d.id),
                    mode: 'markers',
                    type: 'scattergl',
                    name: 'Significant',
                    marker: { size: 6 },
                    hovertemplate:
            '<b>Significant</b><br>' +
            'log2FC: %{x:.2f}<br>' +
            '-log10(p): %{y:.2f}<br>' +
            '%{text}' +
            '<extra></extra>',
                },
                {
                    x: nonsignificant.map((d) => d.log2FC),
                    y: nonsignificant.map((d) => transformP(d.pValue)),
                    text: nonsignificant.map((d) => d.label ?? d.id),
                    mode: 'markers',
                    type: 'scattergl',
                    name: 'Not significant',
                    marker: { size: 4, opacity: 0.6 },
                    hovertemplate:
            '<b>Not significant</b><br>' +
            'log2FC: %{x:.2f}<br>' +
            '-log10(p): %{y:.2f}<br>' +
            '%{text}' +
            '<extra></extra>',
                },
            ]}
            layout={{
                title: 'Volcano Plot',
                hovermode: 'closest',
                showlegend: true,
                margin: { l: 90, r: 40, t: 50, b: 70 },

                // Axis labels (normal, not floating)
                xaxis: {
                    title: { text: 'log2(Fold Change)', standoff: 20 },
                    zeroline: false,
                },
                yaxis: {
                    title: { text: '-log10(p-value)', standoff: 10 },
                    zeroline: false,
                },
                shapes: thresholdShapes,
            }}
            config={{
                responsive: true,
                displayModeBar: true,
            }}
            style={{ width: '100%', height: '500px' }}
        />
    )
}
