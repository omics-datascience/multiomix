import React from 'react'
import Plot from 'react-plotly.js'

type VolcanoPoint = {
    id: string | number;
    label?: string;
    log2FC: number; // X axis
    pValue: number;// it converts to Y axis -log10(pValue)
}

interface VolcanoPlotProps {
    data: VolcanoPoint[];
    fcThreshold?: number; // umbral of |log2FC|
    pThreshold?: number; // umbral of p-value
}

const VolcanoPlot: React.FC<VolcanoPlotProps> = ({
    data,
    fcThreshold = 1, // default |log2FC| > 1
    pThreshold = 0.05, // default p < 0.05
}) => {
    // Converts tp -log10(p)
    const transformP = (p: number) => -Math.log10(p)

    // Separate in 3 groups: up, down, no significativos
    const upregulated = data.filter(
        d => d.log2FC >= fcThreshold && d.pValue <= pThreshold
    )
    const downregulated = data.filter(
        d => d.log2FC <= -fcThreshold && d.pValue <= pThreshold
    )
    const nonsignificant = data.filter(
        d => !upregulated.includes(d) && !downregulated.includes(d)
    )

    return (
        <Plot
            data={[
                {
                    x: upregulated.map(d => d.log2FC),
                    y: upregulated.map(d => transformP(d.pValue)),
                    text: upregulated.map(d => d.label ?? d.id),
                    mode: 'markers',
                    type: 'scattergl',
                    name: 'Up',
                    marker: { size: 6 },
                    hovertemplate:
                    'log2FC: %{x:.2f}<br>-log10(p): %{y:.2f}<br>%{text}<extra></extra>',
                },
                {
                    x: downregulated.map(d => d.log2FC),
                    y: downregulated.map(d => transformP(d.pValue)),
                    text: downregulated.map(d => d.label ?? d.id),
                    mode: 'markers',
                    type: 'scattergl',
                    name: 'Down',
                    marker: { size: 6 },
                    hovertemplate:
                        'log2FC: %{x:.2f}<br>-log10(p): %{y:.2f}<br>%{text}<extra></extra>',
                },
                {
                    x: nonsignificant.map(d => d.log2FC),
                    y: nonsignificant.map(d => transformP(d.pValue)),
                    text: nonsignificant.map(d => d.label ?? d.id),
                    mode: 'markers',
                    type: 'scattergl',
                    name: 'No sig.',
                    marker: { size: 4, opacity: 0.6 },
                    hovertemplate:
                    'log2FC: %{x:.2f}<br>-log10(p): %{y:.2f}<br>%{text}<extra></extra>',
                },
            ]}
            layout={{
                title: 'Volcano plot',
                xaxis: {
                    title: 'log2(Fold Change)',
                    zeroline: true,
                    zerolinewidth: 1,
                },
                yaxis: {
                    title: '-log10(p-value)',
                    zeroline: false,
                },
                hovermode: 'closest',
                showlegend: true,
                margin: { l: 60, r: 20, t: 40, b: 50 },
            }}
            config={{
                responsive: true,
                displayModeBar: true,
            }}
            key={`${fcThreshold}-${pThreshold}`}
            style={{ width: '100%', height: '500px' }}
        />
    )
}

export default VolcanoPlot
