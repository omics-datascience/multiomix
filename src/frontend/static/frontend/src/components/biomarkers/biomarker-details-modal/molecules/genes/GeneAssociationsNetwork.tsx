import React, { useEffect, useMemo, useRef } from 'react'
import cytoscape, { Core, ElementDefinition } from 'cytoscape'

type NodeKind = 'mRNA' | 'miRNA' | 'CNA' | 'Methylation' | 'Drug'

type Props = {
    height?: number | string;
    width?: number | string;
}

const NODE_COLORS: Record<NodeKind, string> = {
    mRNA: '#4f46e5',
    miRNA: '#db2777',
    CNA: '#f59e0b',
    Methylation: '#10b981',
    Drug: '#64748b',
}

const getEdgeColor = (correlation: number) => {
    if (correlation <= -0.5) { return '#dc2626' }

    if (correlation >= 0.5) { return '#2563eb' }

    return '#cbd5e1'
}

const getEdgeOpacity = (correlation: number) => {
    const abs = Math.abs(correlation)

    if (abs >= 0.8) { return 0.95 }
    if (abs >= 0.6) { return 0.8 }
    if (abs >= 0.5) { return 0.65 }

    return 0.22
}

const getEdgeWidth = (correlation: number) => {
    const abs = Math.abs(correlation)

    if (abs >= 0.9) { return 6 }
    if (abs >= 0.8) { return 5 }
    if (abs >= 0.7) { return 4 }
    if (abs >= 0.5) { return 3 }

    return 1.5
}

export const GeneExpressionRegulationNetworkPanel = ({
    height = 650,
    width = '100%',
}: Props) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const cyRef = useRef<Core | null>(null)

    const elements = useMemo<ElementDefinition[]>(() => {
        const nodes: ElementDefinition[] = [
            { data: { id: 'mrna_pcna', label: 'PCNA', type: 'mRNA', size: 58 } },
            { data: { id: 'mrna_fen1', label: 'FEN1', type: 'mRNA', size: 54 } },
            { data: { id: 'mrna_rad51', label: 'RAD51', type: 'mRNA', size: 36 } },
            { data: { id: 'mrna_pold1', label: 'POLD1', type: 'mRNA', size: 32 } },
            { data: { id: 'mrna_lig1', label: 'LIG1', type: 'mRNA', size: 30 } },
            { data: { id: 'mir_21', label: 'miR-21', type: 'miRNA', size: 28 } },
            { data: { id: 'mir_34a', label: 'miR-34a', type: 'miRNA', size: 28 } },
            { data: { id: 'mir_155', label: 'miR-155', type: 'miRNA', size: 28 } },
            { data: { id: 'mir_200c', label: 'miR-200c', type: 'miRNA', size: 28 } },
            { data: { id: 'cna_8q24', label: 'CNA 8q24', type: 'CNA', size: 34 } },
            { data: { id: 'cna_17p_loss', label: '17p loss', type: 'CNA', size: 34 } },
            { data: { id: 'cna_1q_gain', label: '1q gain', type: 'CNA', size: 34 } },
            { data: { id: 'meth_mlh1', label: 'MLH1 meth', type: 'Methylation', size: 32 } },
            { data: { id: 'meth_mgmt', label: 'MGMT meth', type: 'Methylation', size: 32 } },
            { data: { id: 'drug_olaparib', label: 'Olaparib', type: 'Drug', size: 34 } },
            { data: { id: 'drug_cisplatin', label: 'Cisplatin', type: 'Drug', size: 34 } },
            { data: { id: 'drug_temozolomide', label: 'Temozolomide', type: 'Drug', size: 34 } },
            { data: { id: 'mrna_apex2', label: 'APEX2', type: 'mRNA', size: 32 } },
        ]

        const rawEdges = [
            ['mrna_pcna', 'mrna_fen1', 0.92],
            ['mrna_pcna', 'mrna_rad51', 0.87],
            ['mrna_pcna', 'mrna_pold1', 0.83],
            ['mrna_pcna', 'mrna_lig1', 0.79],
            ['mrna_pcna', 'mrna_apex2', 0.72],
            ['mrna_fen1', 'mrna_rad51', 0.76],
            ['mrna_fen1', 'mrna_pold1', 0.81],
            ['mrna_fen1', 'mrna_apex2', 0.69],
            ['mrna_rad51', 'mrna_apex2', 0.64],
            ['mrna_pold1', 'mrna_lig1', 0.71],
            ['mrna_lig1', 'mrna_apex2', 0.58],

            ['mir_21', 'mrna_pcna', -0.74],
            ['mir_21', 'mrna_fen1', -0.68],
            ['mir_21', 'mrna_rad51', -0.61],
            ['mir_34a', 'mrna_pcna', -0.71],
            ['mir_34a', 'mrna_pold1', -0.66],
            ['mir_155', 'mrna_rad51', -0.78],
            ['mir_155', 'mrna_apex2', -0.57],
            ['mir_200c', 'mrna_lig1', -0.63],
            ['mir_200c', 'mrna_fen1', -0.55],

            ['cna_8q24', 'mrna_pcna', 0.67],
            ['cna_8q24', 'mrna_fen1', 0.54],
            ['cna_17p_loss', 'mrna_rad51', -0.58],
            ['cna_17p_loss', 'mrna_apex2', -0.52],
            ['cna_1q_gain', 'mrna_pold1', 0.62],
            ['cna_1q_gain', 'mrna_lig1', 0.57],
            ['meth_mlh1', 'mrna_pcna', -0.53],
            ['meth_mlh1', 'mrna_apex2', -0.64],
            ['meth_mgmt', 'mrna_rad51', -0.59],
            ['meth_mgmt', 'mrna_fen1', -0.51],

            ['drug_olaparib', 'mrna_rad51', -0.69],
            ['drug_olaparib', 'mrna_fen1', -0.56],
            ['drug_cisplatin', 'mrna_pcna', -0.52],
            ['drug_cisplatin', 'mrna_lig1', -0.55],
            ['drug_temozolomide', 'meth_mgmt', 0.73],
            ['drug_temozolomide', 'mrna_apex2', -0.51],

            ['mir_21', 'cna_8q24', 0.22],
            ['mir_34a', 'meth_mlh1', -0.18],
            ['drug_olaparib', 'drug_cisplatin', 0.31],
            ['mrna_pcna', 'drug_temozolomide', -0.27],
            ['cna_1q_gain', 'mrna_apex2', 0.33],
        ] as const

        const edges: ElementDefinition[] = rawEdges.map(([source, target, correlation], index) => ({
            data: {
                id: `e_${index + 1}`,
                source,
                target,
                correlation,
                edgeColor: getEdgeColor(correlation),
                edgeOpacity: getEdgeOpacity(correlation),
                edgeWidth: getEdgeWidth(correlation),
            },
            classes: Math.abs(correlation) < 0.5 ? 'weak-edge' : '',
        }))

        return [...nodes, ...edges]
    }, [])

    useEffect(() => {
        if (!containerRef.current) { return }

        const cy = cytoscape({
            container: containerRef.current,
            elements,
            wheelSensitivity: 0.18,
            minZoom: 0.4,
            maxZoom: 2,
            style: [
                {
                    selector: 'node',
                    style: {
                        label: 'data(label)',
                        width: 'data(size)',
                        height: 'data(size)',
                        shape: 'ellipse',
                        'background-color': '#64748b',
                        color: '#ffffff',
                        'font-size': 12,
                        'font-weight': 600,
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'text-wrap': 'wrap',
                        'text-max-width': 90 as any,
                        'text-outline-color': '#475569',
                        'text-outline-width': 3,
                        'border-width': 2,
                        'border-color': '#ffffff',
                    },
                },
                {
                    selector: 'node[type = "mRNA"]',
                    style: {
                        'background-color': NODE_COLORS.mRNA,
                        'text-outline-color': NODE_COLORS.mRNA,
                    },
                },
                {
                    selector: 'node[type = "miRNA"]',
                    style: {
                        'background-color': NODE_COLORS.miRNA,
                        'text-outline-color': NODE_COLORS.miRNA,
                    },
                },
                {
                    selector: 'node[type = "CNA"]',
                    style: {
                        'background-color': NODE_COLORS.CNA,
                        'text-outline-color': NODE_COLORS.CNA,
                    },
                },
                {
                    selector: 'node[type = "Methylation"]',
                    style: {
                        'background-color': NODE_COLORS.Methylation,
                        'text-outline-color': NODE_COLORS.Methylation,
                    },
                },
                {
                    selector: 'node[type = "Drug"]',
                    style: {
                        'background-color': NODE_COLORS.Drug,
                        'text-outline-color': NODE_COLORS.Drug,
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        width: 'data(edgeWidth)',
                        'line-color': 'data(edgeColor)',
                        opacity: 'data(edgeOpacity)' as any,
                        'curve-style': 'bezier',
                    },
                },
                {
                    selector: 'edge.weak-edge',
                    style: {
                        'line-style': 'dashed',
                    },
                },
                {
                    selector: ':selected',
                    style: {
                        'border-color': '#f8fafc',
                        'border-width': 5,
                        'line-color': '#0f172a',
                        'target-arrow-color': '#0f172a',
                        'source-arrow-color': '#0f172a',
                    },
                },
                {
                    selector: '.faded',
                    style: {
                        opacity: 0.12,
                    },
                },
            ],
            layout: {
                name: 'cose',
                animate: true,
                randomize: true,
                fit: true,
                padding: 40,
                gravity: 1,
                nodeRepulsion: 9000,
                idealEdgeLength: 90,
                componentSpacing: 80,
            },
        })

        cyRef.current = cy

        cy.on('tap', 'node', (evt) => {
            const node = evt.target
            const neighborhood = node.closedNeighborhood()

            cy.elements().addClass('faded')
            neighborhood.removeClass('faded')
        })

        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                cy.elements().removeClass('faded')
                cy.elements().unselect()
            }
        })

        return () => {
            cy.destroy()
            cyRef.current = null
        }
    }, [elements])

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    padding: 12,
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    background: '#ffffff',
                }}
            >
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <LegendDot color={NODE_COLORS.mRNA} label='mRNA' />
                    <LegendDot color={NODE_COLORS.miRNA} label='miRNA' />
                    <LegendDot color={NODE_COLORS.CNA} label='CNA' />
                    <LegendDot color={NODE_COLORS.Methylation} label='Methylation' />
                    <LegendDot color={NODE_COLORS.Drug} label='Drug' />
                    <LegendLine color='#dc2626' label='[-1, -0.5] down' />
                    <LegendLine color='#2563eb' label='[0.5, 1] up' />
                </div>
            </div>

            <div
                ref={containerRef}
                style={{
                    width,
                    height,
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    background: '#f8fafc',
                }}
            />
        </div>
    )
}

const LegendDot = ({ color, label }: { color: string; label: string }) => (
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

const LegendLine = ({ color, label }: { color: string; label: string }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
        <span
            style={{
                width: 18,
                height: 0,
                borderTop: `3px solid ${color}`,
                display: 'inline-block',
            }}
        />
        {label}
    </span>
)
