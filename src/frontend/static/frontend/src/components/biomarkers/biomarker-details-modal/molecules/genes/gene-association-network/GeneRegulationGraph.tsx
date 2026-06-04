import React, { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape, { Core, ElementDefinition } from 'cytoscape'
import { NODE_COLORS, REGULATION_COLORS } from './graphStyle'
import { LegendArrow, LegendDot } from './legend'
import { FetchGeneRegulationGraphResponse, GraphQueryFilter, SelectedEdgeInfo, TraversalMode } from './types'

const MIN_ZOOM = 0.4
const MAX_ZOOM = 2
const ZOOM_STEP = 1.2

const traversalLabels: Record<TraversalMode, string> = {
    outgoing: 'Regulates',
    incoming: 'Regulated by',
    both: 'Both',
}

/**
 * Resolves the edge color according to the correlation sign.
 * @param correlation Correlation value stored in the graph edge.
 * @returns The color used to render the edge.
 */
const getEdgeColor = (correlation: number) => {
    if (correlation < 0) { return REGULATION_COLORS.down }

    return REGULATION_COLORS.up
}

/**
 * Maps the edge correlation strength into the rendered edge opacity.
 * @param correlation Correlation value stored in the graph edge.
 * @returns The opacity used to render the edge.
 */
const getEdgeOpacity = (correlation: number) => {
    const abs = Math.abs(correlation)

    if (abs >= 0.8) { return 0.95 }

    if (abs >= 0.6) { return 0.8 }

    return 0.7
}

/**
 * Maps the edge correlation strength into the rendered edge width.
 * @param correlation Correlation value stored in the graph edge.
 * @returns The width used to render the edge.
 */
const getEdgeWidth = (correlation: number) => {
    const abs = Math.abs(correlation)

    if (abs >= 0.9) { return 6 }

    if (abs >= 0.8) { return 5 }

    if (abs >= 0.7) { return 4 }

    return 3
}

/**
 * Converts the edge correlation sign into the label shown by the UI.
 * @param correlation Correlation value stored in the graph edge.
 * @returns The semantic direction label shown in tooltips and panels.
 */
const getDirectionLabel = (correlation: number): SelectedEdgeInfo['direction'] => {
    if (correlation < 0) { return 'Down-regulation' }

    return 'Up-regulation'
}

/** Tooltip state used while hovering graph edges. */
type TooltipState = {
    /** Whether the tooltip is currently visible. */
    visible: boolean;
    /** Horizontal position relative to the graph container. */
    x: number;
    /** Vertical position relative to the graph container. */
    y: number;
    /** Text shown inside the tooltip. */
    content: string;
}

/** Context menu state used when expanding a node from the graph. */
type ContextMenuState = {
    /** Whether the expansion menu is currently visible. */
    visible: boolean;
    /** Horizontal position relative to the graph container. */
    x: number;
    /** Vertical position relative to the graph container. */
    y: number;
    /** Node identifier being expanded. */
    nodeId: string;
    /** Visible label of the node being expanded. */
    nodeLabel: string;
    /** Threshold draft shown in the expansion form. */
    threshold: number;
    /** Traversal mode draft shown in the expansion form. */
    traversalMode: TraversalMode;
    /** Max depth draft shown in the expansion form. */
    maxLevels: number;
}

/** Props accepted by the Cytoscape-based regulation graph. */
interface GeneRegulationGraphProps {
    /** Graph payload currently rendered in Cytoscape. */
    data: FetchGeneRegulationGraphResponse | null;
    /** Height assigned to the graph area. */
    height?: number | string;
    /** Width assigned to the graph area. */
    width?: number | string;
    /** Edges currently selected by the user. */
    selectedEdges: SelectedEdgeInfo[];
    /** Callback used to sync edge selections with the side panel. */
    onSelectedEdgesChange: (edges: SelectedEdgeInfo[]) => void;
    /** Node identifiers already expanded into the current request. */
    expandedNodeIds: string[];
    /** Default expansion values reused when opening the node context menu. */
    defaultExpansionFilter: Omit<GraphQueryFilter, 'rootNodeId'>;
    /** Callback used to append a new node expansion to the query. */
    onExpandNode: (filter: GraphQueryFilter) => void;
}

/**
 * Renders the Cytoscape graph along with local zoom and expansion controls.
 * @param props Component props.
 * @returns The rendered graph with overlays for legend, zoom and node expansion.
 */
export const GeneRegulationGraph = (props: GeneRegulationGraphProps): JSX.Element => {
    const {
        data,
        height = 650,
        width = '100%',
        selectedEdges,
        onSelectedEdgesChange,
        expandedNodeIds,
        defaultExpansionFilter,
        onExpandNode,
    } = props
    const containerRef = useRef<HTMLDivElement | null>(null)
    const cyRef = useRef<Core | null>(null)
    const defaultExpansionFilterRef = useRef(defaultExpansionFilter)

    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        x: 0,
        y: 0,
        content: '',
    })
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        nodeId: '',
        nodeLabel: '',
        threshold: defaultExpansionFilter.threshold,
        traversalMode: defaultExpansionFilter.traversalMode,
        maxLevels: defaultExpansionFilter.maxLevels,
    })

    useEffect(() => {
        defaultExpansionFilterRef.current = defaultExpansionFilter
    }, [defaultExpansionFilter])

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
                        opacity: 0.82,
                        'underlay-color': '#64748b',
                        'underlay-opacity': 0.22,
                        'underlay-padding': 5,
                        width: 'mapData(edgeWidth, 3, 6, 4, 6)',
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

        for (const filter of data.filters) {
            const expandedRootNode = cy.getElementById(filter.rootNodeId)

            if (expandedRootNode.nonempty()) {
                expandedRootNode.addClass('root-node')
            }
        }

        const rootNode = cy.getElementById(data.rootNodeId)

        if (rootNode.nonempty()) {
            cy.center(rootNode)
        }

        /** Synchronizes the selected edge list shown in the side panel. */
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

            setContextMenu((prev) => ({
                ...prev,
                visible: false,
            }))

            if (edge.hasClass('edge-picked')) {
                edge.removeClass('edge-picked')
            } else {
                edge.addClass('edge-picked')
            }

            syncSelectedEdges()
        })

        cy.on('tap', 'node', () => {
            setContextMenu((prev) => ({
                ...prev,
                visible: false,
            }))
        })

        cy.on('cxttap', 'node', (evt) => {
            evt.originalEvent?.preventDefault()

            const node = evt.target

            setTooltip((prev) => ({
                ...prev,
                visible: false,
            }))

            setContextMenu({
                visible: true,
                x: evt.renderedPosition?.x ?? 0,
                y: evt.renderedPosition?.y ?? 0,
                nodeId: node.id(),
                nodeLabel: node.data('label') || node.id(),
                threshold: defaultExpansionFilterRef.current.threshold,
                traversalMode: defaultExpansionFilterRef.current.traversalMode,
                maxLevels: defaultExpansionFilterRef.current.maxLevels,
            })
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

    /**
     * Applies a centered zoom step from the overlay controls.
     * @param direction Zoom direction requested by the user.
     */
    const handleGraphZoom = (direction: 'in' | 'out') => {
        const cy = cyRef.current

        if (!cy) { return }

        const nextZoom = direction === 'in'
            ? Math.min(MAX_ZOOM, cy.zoom() * ZOOM_STEP)
            : Math.max(MIN_ZOOM, cy.zoom() / ZOOM_STEP)

        cy.zoom({
            level: nextZoom,
            renderedPosition: {
                x: cy.width() / 2,
                y: cy.height() / 2,
            },
        })
    }

    return (
        <div
            style={{ position: 'relative' }}
            onContextMenu={(event) => event.preventDefault()}
        >
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

            <div
                style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    display: 'grid',
                    gap: 6,
                    zIndex: 1000,
                }}
            >
                <button
                    type='button'
                    onClick={() => handleGraphZoom('in')}
                    title='Zoom in'
                    style={{
                        width: 34,
                        height: 34,
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        background: '#ffffff',
                        color: '#0f172a',
                        cursor: 'pointer',
                        fontSize: 18,
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
                    }}
                >
                    +
                </button>

                <button
                    type='button'
                    onClick={() => handleGraphZoom('out')}
                    title='Zoom out'
                    style={{
                        width: 34,
                        height: 34,
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        background: '#ffffff',
                        color: '#0f172a',
                        cursor: 'pointer',
                        fontSize: 20,
                        fontWeight: 700,
                        lineHeight: 1,
                        boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
                    }}
                >
                    -
                </button>
            </div>

            <div
                style={{
                    position: 'absolute',
                    left: 12,
                    bottom: 12,
                    display: 'grid',
                    gap: 6,
                    padding: '8px 10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.95)',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                    zIndex: 1000,
                }}
            >
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>Nodes:</span>
                    <LegendDot color={NODE_COLORS.Gene} label='Gene' />
                    <LegendDot color={NODE_COLORS.miRNA} label='miRNA' />
                    <LegendDot color={NODE_COLORS.CNA} label='CNA' />
                    <LegendDot color={NODE_COLORS.Methylation} label='Methylation' />
                    <LegendDot color={NODE_COLORS.Drug} label='Drug' />
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>Edges:</span>
                    <LegendArrow color={REGULATION_COLORS.down} label='Down-regulation' />
                    <LegendArrow color={REGULATION_COLORS.up} label='Up-regulation' />
                </div>
            </div>

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

            {contextMenu.visible && (
                <div
                    style={{
                        position: 'absolute',
                        left: contextMenu.x + 12,
                        top: contextMenu.y + 12,
                        width: 260,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                        boxShadow: '0 12px 30px rgba(15,23,42,0.18)',
                        padding: 10,
                        zIndex: 10000,
                    }}
                >
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                        {contextMenu.nodeLabel}
                    </div>

                    <div style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>
                        Configure this expansion before adding it to the graph request.
                    </div>

                    <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
                        <div style={{ display: 'grid', gap: 5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#334155' }}>
                                <span>Threshold</span>
                                <strong>{contextMenu.threshold.toFixed(1)}</strong>
                            </div>
                            <input
                                type='range'
                                min={0.1}
                                max={0.9}
                                step={0.1}
                                value={contextMenu.threshold}
                                disabled={expandedNodeIds.includes(contextMenu.nodeId)}
                                onChange={(event) => setContextMenu((prev) => ({
                                    ...prev,
                                    threshold: Number(Number(event.target.value).toFixed(1)),
                                }))}
                            />
                        </div>

                        <div style={{ display: 'grid', gap: 5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#334155' }}>
                                <span>Depth</span>
                                <strong>{contextMenu.maxLevels}</strong>
                            </div>
                            <input
                                type='range'
                                min={1}
                                max={10}
                                step={1}
                                value={contextMenu.maxLevels}
                                disabled={expandedNodeIds.includes(contextMenu.nodeId)}
                                onChange={(event) => setContextMenu((prev) => ({
                                    ...prev,
                                    maxLevels: Number(event.target.value),
                                }))}
                            />
                        </div>

                        <div style={{ display: 'grid', gap: 5 }}>
                            <span style={{ fontSize: 12, color: '#334155' }}>Regulation mode</span>
                            <select
                                value={contextMenu.traversalMode}
                                disabled={expandedNodeIds.includes(contextMenu.nodeId)}
                                onChange={(event) => setContextMenu((prev) => ({
                                    ...prev,
                                    traversalMode: event.target.value as TraversalMode,
                                }))}
                                style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 8,
                                    padding: '7px 8px',
                                    background: '#ffffff',
                                    color: '#0f172a',
                                }}
                            >
                                <option value='outgoing'>{traversalLabels.outgoing}</option>
                                <option value='incoming'>{traversalLabels.incoming}</option>
                                <option value='both'>{traversalLabels.both}</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type='button'
                        disabled={expandedNodeIds.includes(contextMenu.nodeId)}
                        onClick={() => {
                            onExpandNode({
                                rootNodeId: contextMenu.nodeId,
                                threshold: contextMenu.threshold,
                                traversalMode: contextMenu.traversalMode,
                                maxLevels: contextMenu.maxLevels,
                            })
                            setContextMenu((prev) => ({
                                ...prev,
                                visible: false,
                            }))
                        }}
                        style={{
                            width: '100%',
                            border: '1px solid #2563eb',
                            borderRadius: 8,
                            padding: '7px 10px',
                            background: expandedNodeIds.includes(contextMenu.nodeId) ? '#e2e8f0' : '#2563eb',
                            color: expandedNodeIds.includes(contextMenu.nodeId) ? '#64748b' : '#ffffff',
                            cursor: expandedNodeIds.includes(contextMenu.nodeId) ? 'not-allowed' : 'pointer',
                            fontWeight: 700,
                        }}
                    >
                        {expandedNodeIds.includes(contextMenu.nodeId) ? 'Already expanded' : 'Expand graph'}
                    </button>
                </div>
            )}
        </div>
    )
}
