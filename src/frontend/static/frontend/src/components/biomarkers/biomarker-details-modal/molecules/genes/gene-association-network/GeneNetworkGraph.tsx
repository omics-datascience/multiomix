import React, { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape, { Core, ElementDefinition } from 'cytoscape'
import { NODE_COLORS, REGULATION_COLORS } from './graphStyle'
import { FetchGeneGraphResponse, SelectedEdgeInfo } from './types'

const getEdgeColor = (correlation: number) => {
    if (correlation < 0) { return REGULATION_COLORS.down }

    return REGULATION_COLORS.up
}

const getEdgeOpacity = (correlation: number) => {
    const abs = Math.abs(correlation)

    if (abs >= 0.8) { return 0.95 }

    if (abs >= 0.6) { return 0.8 }

    return 0.7
}

const getEdgeWidth = (correlation: number) => {
    const abs = Math.abs(correlation)

    if (abs >= 0.9) { return 6 }

    if (abs >= 0.8) { return 5 }

    if (abs >= 0.7) { return 4 }

    return 3
}

const getDirectionLabel = (correlation: number): SelectedEdgeInfo['direction'] => {
    if (correlation < 0) { return 'Down-regulation' }

    return 'Up-regulation'
}

type TooltipState = {
    visible: boolean;
    x: number;
    y: number;
    content: string;
}

type Props = {
    data: FetchGeneGraphResponse | null;
    height?: number | string;
    width?: number | string;
    selectedEdges: SelectedEdgeInfo[];
    onSelectedEdgesChange: (edges: SelectedEdgeInfo[]) => void;
}

export const GeneNetworkGraph = ({
    data,
    height = 650,
    width = '100%',
    selectedEdges,
    onSelectedEdgesChange,
}: Props): JSX.Element => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const cyRef = useRef<Core | null>(null)

    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        x: 0,
        y: 0,
        content: '',
    })

    const elements = useMemo<ElementDefinition[]>(() => {
        if (!data) { return [] }

        const nodes: ElementDefinition[] = data.nodes.map((node) => ({
            data: {
                ...node,
            },
        }))

        const edges: ElementDefinition[] = data.edges.map((edge) => ({
            data: {
                ...edge,
                edgeColor: getEdgeColor(edge.correlation),
                edgeOpacity: getEdgeOpacity(edge.correlation),
                edgeWidth: getEdgeWidth(edge.correlation),
                directionLabel: getDirectionLabel(edge.correlation),
            },
        }))

        return [...nodes, ...edges]
    }, [data])

    useEffect(() => {
        if (!containerRef.current || !data) { return }

        if (cyRef.current) {
            cyRef.current.destroy()
            cyRef.current = null
        }

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
                    selector: 'node[type = "Gene"]',
                    style: {
                        'background-color': NODE_COLORS.Gene,
                        'text-outline-color': NODE_COLORS.Gene,
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
                        'target-arrow-shape': 'triangle',
                        'target-arrow-color': 'data(edgeColor)',
                        'arrow-scale': 1.15,
                    },
                },
                {
                    selector: 'edge.edge-picked',
                    style: {
                        opacity: 1,
                        'underlay-color': '#000000',
                        'underlay-opacity': 1,
                        'underlay-padding': 9,
                        width: 'mapData(edgeWidth, 3, 6, 5, 8)',
                        'z-index': 999,
                    },
                },
                {
                    selector: 'node.root-node',
                    style: {
                        'border-color': '#f59e0b',
                        'border-width': 6,
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

        const rootNode = cy.getElementById(data.rootNodeId)

        if (rootNode.nonempty()) {
            rootNode.addClass('root-node')
            cy.center(rootNode)
        }

        const syncSelectedEdges = () => {
            const picked = cy
                .edges('.edge-picked')
                .toArray()
                .map((edge: any) => ({
                    id: edge.id(),
                    source: edge.source().data('label') || edge.data('source'),
                    target: edge.target().data('label') || edge.data('target'),
                    correlation: edge.data('correlation'),
                    direction: edge.data('directionLabel'),
                }))

            onSelectedEdgesChange(picked)
        }

        cy.on('tap', 'edge', (evt) => {
            const edge = evt.target

            if (edge.hasClass('edge-picked')) {
                edge.removeClass('edge-picked')
            } else {
                edge.addClass('edge-picked')
            }

            syncSelectedEdges()
        })

        cy.on('mouseover', 'edge', (evt) => {
            const edge = evt.target
            const correlation = edge.data('correlation')
            const direction = edge.data('directionLabel')

            setTooltip({
                visible: true,
                x: evt.renderedPosition?.x ?? 0,
                y: evt.renderedPosition?.y ?? 0,
                content: `${direction} | correlation: ${correlation}`,
            })
        })

        cy.on('mousemove', 'edge', (evt) => {
            setTooltip((prev) => ({
                ...prev,
                x: evt.renderedPosition?.x ?? prev.x,
                y: evt.renderedPosition?.y ?? prev.y,
                visible: true,
            }))
        })

        cy.on('mouseout', 'edge', () => {
            setTooltip((prev) => ({
                ...prev,
                visible: false,
            }))
        })

        return () => {
            cy.destroy()
            cyRef.current = null
        }
    }, [data, elements, onSelectedEdgesChange])

    useEffect(() => {
        const cy = cyRef.current

        if (!cy) { return }

        cy.edges().removeClass('edge-picked')

        for (const edge of selectedEdges) {
            const cyEdge = cy.getElementById(edge.id)

            if (cyEdge.nonempty()) {
                cyEdge.addClass('edge-picked')
            }
        }
    }, [selectedEdges])

    return (
        <div style={{ position: 'relative' }}>
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

            {tooltip.visible && (
                <div
                    style={{
                        position: 'absolute',
                        left: tooltip.x + 10,
                        top: tooltip.y + 10,
                        background: '#111827',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        pointerEvents: 'none',
                        zIndex: 9999,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    )
}
