import React, { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape, { Core, ElementDefinition, NodeSingular } from 'cytoscape'
import { Button, Dropdown, Icon, Label } from 'semantic-ui-react'

type NodeKind = 'Gene' | 'miRNA' | 'CNA' | 'Methylation' | 'Drug'

type Props = {
    height?: number | string;
    width?: number | string;
}

type TooltipState = {
    visible: boolean;
    x: number;
    y: number;
    content: string;
}

type SelectedEdgeInfo = {
    id: string;
    source: string;
    target: string;
    correlation: number;
    direction: 'Down regulate' | 'Up regulate';
}

type DepthSummaryItem = {
    depth: number;
    nodes: string[];
}

type TraversalMode = 'outgoing' | 'incoming' | 'both'

const NODE_COLORS: Record<NodeKind, string> = {
    Gene: '#4f46e5',
    miRNA: '#db2777',
    CNA: '#f59e0b',
    Methylation: '#10b981',
    Drug: '#64748b',
}

const LEVEL_COLORS = {
    root: '#f59e0b',
    level1: '#0ea5e9',
    level2: '#22c55e',
    level3: '#a855f7',
}

const roundThreshold = (value: number) => Number(value.toFixed(1))

const getEdgeColor = (correlation: number, threshold: number) => {
    if (correlation <= -threshold) { return '#dc2626' }

    if (correlation >= threshold) { return '#2563eb' }

    return 'transparent'
}

const getEdgeOpacity = (correlation: number, threshold: number) => {
    const abs = Math.abs(correlation)

    if (abs < threshold) { return 0 }

    if (abs >= 0.8) { return 0.95 }

    if (abs >= 0.6) { return 0.8 }

    return 0.7
}

const getEdgeWidth = (correlation: number, threshold: number) => {
    const abs = Math.abs(correlation)

    if (abs < threshold) { return 0 }

    if (abs >= 0.9) { return 6 }

    if (abs >= 0.8) { return 5 }

    if (abs >= 0.7) { return 4 }

    return 3
}

const getDirectionLabel = (
    correlation: number,
    threshold: number
): SelectedEdgeInfo['direction'] => {
    if (correlation <= -threshold) { return 'Down regulate' }

    return 'Up regulate'
}

const traversalOptions = [
    { key: 'outgoing', value: 'outgoing', text: 'Regula' },
    { key: 'incoming', value: 'incoming', text: 'Es regulado por' },
    { key: 'both', value: 'both', text: 'Ambos' },
]

export const GeneExpressionRegulationNetworkPanel = ({
    height = 650,
    width = '100%',
}: Props) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const cyRef = useRef<Core | null>(null)

    const [threshold, setThreshold] = useState<number>(0.5)
    const [traversalMode, setTraversalMode] = useState<TraversalMode>('outgoing')
    const [maxLevels, setMaxLevels] = useState<number>(3)

    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        x: 0,
        y: 0,
        content: '',
    })

    const [selectedEdges, setSelectedEdges] = useState<SelectedEdgeInfo[]>([])
    const [selectedRootNode, setSelectedRootNode] = useState<string | null>('BRAF')
    const [depthSummary, setDepthSummary] = useState<DepthSummaryItem[]>([])
    const [incomingSummary, setIncomingSummary] = useState<DepthSummaryItem[]>([])

    const elements = useMemo<ElementDefinition[]>(() => {
        const nodes: ElementDefinition[] = [
            { data: { id: 'gene_braf', label: 'BRAF', type: 'Gene', size: 64, isRoot: true } },
            { data: { id: 'gene_mek1', label: 'MEK1', type: 'Gene', size: 44 } },
            { data: { id: 'gene_erk1', label: 'ERK1', type: 'Gene', size: 40 } },
            { data: { id: 'gene_myc', label: 'MYC', type: 'Gene', size: 38 } },
            { data: { id: 'gene_ccnd1', label: 'CCND1', type: 'Gene', size: 38 } },
            { data: { id: 'gene_dusp6', label: 'DUSP6', type: 'Gene', size: 34 } },
            { data: { id: 'gene_fos', label: 'FOS', type: 'Gene', size: 34 } },
            { data: { id: 'gene_elk1', label: 'ELK1', type: 'Gene', size: 32 } },
            { data: { id: 'gene_map3k8', label: 'MAP3K8', type: 'Gene', size: 30 } },
            { data: { id: 'gene_spry2', label: 'SPRY2', type: 'Gene', size: 30 } },
            { data: { id: 'mir_17', label: 'miR-17', type: 'miRNA', size: 28 } },
            { data: { id: 'mir_21', label: 'miR-21', type: 'miRNA', size: 28 } },
            { data: { id: 'cna_7q34', label: '7q34 gain', type: 'CNA', size: 34 } },
            { data: { id: 'meth_rassf1', label: 'RASSF1 meth', type: 'Methylation', size: 34 } },
            { data: { id: 'drug_vemurafenib', label: 'Vemurafenib', type: 'Drug', size: 34 } },
        ]

        const rawEdges = [
            ['gene_braf', 'gene_mek1', 0.92],
            ['gene_braf', 'gene_erk1', 0.84],
            ['gene_braf', 'gene_dusp6', 0.72],
            ['gene_braf', 'gene_fos', 0.69],

            ['gene_mek1', 'gene_erk1', 0.88],
            ['gene_mek1', 'gene_elk1', 0.76],
            ['gene_mek1', 'gene_ccnd1', 0.67],

            ['gene_erk1', 'gene_myc', 0.81],
            ['gene_erk1', 'gene_fos', 0.79],
            ['gene_erk1', 'gene_spry2', 0.62],

            ['gene_fos', 'gene_ccnd1', 0.58],
            ['gene_elk1', 'gene_myc', 0.61],

            ['mir_17', 'gene_braf', -0.66],
            ['mir_21', 'gene_mek1', -0.57],

            ['cna_7q34', 'gene_braf', 0.73],
            ['meth_rassf1', 'gene_braf', -0.54],
            ['drug_vemurafenib', 'gene_braf', -0.89],

            ['gene_map3k8', 'gene_mek1', 0.55],
            ['gene_braf', 'gene_map3k8', 0.52],

            ['gene_spry2', 'gene_braf', -0.32],
            ['drug_vemurafenib', 'gene_mek1', -0.41],
        ] as const

        const edges: ElementDefinition[] = rawEdges
            .filter(([, , correlation]) => Math.abs(correlation) >= threshold)
            .map(([source, target, correlation], index) => ({
                data: {
                    id: `e_${index + 1}`,
                    source,
                    target,
                    correlation,
                    edgeColor: getEdgeColor(correlation, threshold),
                    edgeOpacity: getEdgeOpacity(correlation, threshold),
                    edgeWidth: getEdgeWidth(correlation, threshold),
                    directionLabel: getDirectionLabel(correlation, threshold),
                },
            }))

        return [...nodes, ...edges]
    }, [threshold])

    useEffect(() => {
        if (!containerRef.current) { return }

        if (cyRef.current) {
            cyRef.current.destroy()
            cyRef.current = null
        }

        setSelectedEdges([])
        setDepthSummary([])
        setIncomingSummary([])
        setTooltip({
            visible: false,
            x: 0,
            y: 0,
            content: '',
        })

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
                        opacity: 1,
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
                    selector: 'edge.depth-path-outgoing',
                    style: {
                        width: 7,
                    },
                },
                {
                    selector: 'edge.depth-path-incoming',
                    style: {
                        width: 7,
                        'line-style': 'dotted',
                        'target-arrow-shape': 'triangle',
                    },
                },
                {
                    selector: 'node.depth-root',
                    style: {
                        'border-color': LEVEL_COLORS.root,
                        'border-width': 6,
                        opacity: 1,
                    },
                },
                {
                    selector: 'node.depth-level-1',
                    style: {
                        'border-color': LEVEL_COLORS.level1,
                        'border-width': 5,
                    },
                },
                {
                    selector: 'node.depth-level-2',
                    style: {
                        'border-color': LEVEL_COLORS.level2,
                        'border-width': 5,
                    },
                },
                {
                    selector: 'node.depth-level-3',
                    style: {
                        'border-color': LEVEL_COLORS.level3,
                        'border-width': 5,
                    },
                },
                {
                    selector: 'node.depth-level-4, node.depth-level-5, node.depth-level-6, node.depth-level-7, node.depth-level-8, node.depth-level-9, node.depth-level-10',
                    style: {
                        'border-color': '#94a3b8',
                        'border-width': 5,
                    },
                },
                {
                    selector: 'node.incoming-level-1',
                    style: {
                        'border-style': 'double',
                        'border-color': LEVEL_COLORS.level1,
                        'border-width': 5,
                    },
                },
                {
                    selector: 'node.incoming-level-2',
                    style: {
                        'border-style': 'double',
                        'border-color': LEVEL_COLORS.level2,
                        'border-width': 5,
                    },
                },
                {
                    selector: 'node.incoming-level-3',
                    style: {
                        'border-style': 'double',
                        'border-color': LEVEL_COLORS.level3,
                        'border-width': 5,
                    },
                },
                {
                    selector: 'node.incoming-level-4, node.incoming-level-5, node.incoming-level-6, node.incoming-level-7, node.incoming-level-8, node.incoming-level-9, node.incoming-level-10',
                    style: {
                        'border-style': 'double',
                        'border-color': '#94a3b8',
                        'border-width': 5,
                    },
                },
                {
                    selector: 'node:selected',
                    style: {
                        'border-color': '#f8fafc',
                        'border-width': 5,
                    },
                },
                {
                    selector: '.fade-unrelated',
                    style: {
                        opacity: 0.12,
                    },
                },
                {
                    selector: '.fade-level-1',
                    style: {
                        opacity: 1,
                    },
                },
                {
                    selector: '.fade-level-2',
                    style: {
                        opacity: 0.72,
                    },
                },
                {
                    selector: '.fade-level-3',
                    style: {
                        opacity: 0.45,
                    },
                },
                {
                    selector: '.fade-level-4plus',
                    style: {
                        opacity: 0.25,
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

        const syncSelectedEdges = () => {
            const picked = cy
                .edges('.edge-picked')
                .toArray()
                .map((edge: any) => {
                    const sourceNode = edge.source()
                    const targetNode = edge.target()

                    return {
                        id: edge.id(),
                        source: sourceNode.data('label') || edge.data('source'),
                        target: targetNode.data('label') || edge.data('target'),
                        correlation: edge.data('correlation'),
                        direction: edge.data('directionLabel'),
                    }
                })

            setSelectedEdges(picked)
        }

        const clearTraversal = () => {
            cy.batch(() => {
                cy.nodes().forEach((node: any) => {
                    const classesToRemove = [
                        'depth-root',
                        'fade-unrelated',
                        'fade-level-1',
                        'fade-level-2',
                        'fade-level-3',
                        'fade-level-4plus',
                    ]

                    classesToRemove.forEach((cls) => node.removeClass(cls))

                    for (let i = 1; i <= 10; i += 1) {
                        node.removeClass(`depth-level-${i}`)
                        node.removeClass(`incoming-level-${i}`)
                    }
                })

                cy.edges().forEach((edge: any) => {
                    edge.removeClass('depth-path-outgoing')
                    edge.removeClass('depth-path-incoming')
                    edge.removeClass('fade-unrelated')
                    edge.removeClass('fade-level-1')
                    edge.removeClass('fade-level-2')
                    edge.removeClass('fade-level-3')
                    edge.removeClass('fade-level-4plus')
                })
            })

            setSelectedRootNode(null)
            setDepthSummary([])
            setIncomingSummary([])
        }

        const assignFadeClass = (ele: any, level: number) => {
            ele.removeClass('fade-unrelated')
            ele.removeClass('fade-level-1')
            ele.removeClass('fade-level-2')
            ele.removeClass('fade-level-3')
            ele.removeClass('fade-level-4plus')

            if (level <= 1) {
                ele.addClass('fade-level-1')
                return
            }

            if (level === 2) {
                ele.addClass('fade-level-2')
                return
            }

            if (level === 3) {
                ele.addClass('fade-level-3')
                return
            }

            ele.addClass('fade-level-4plus')
        }

        const applyProgressiveFading = (
            root: NodeSingular,
            outgoingVisited: Map<string, number>,
            incomingVisited: Map<string, number>
        ) => {
            cy.batch(() => {
                cy.nodes().forEach((node: any) => {
                    if (node.id() === root.id()) {
                        assignFadeClass(node, 1)
                        return
                    }

                    const outDepth = outgoingVisited.get(node.id())
                    const inDepth = incomingVisited.get(node.id())

                    if (outDepth == null && inDepth == null) {
                        node.addClass('fade-unrelated')
                        return
                    }

                    const bestDepth = Math.min(
                        outDepth ?? Number.POSITIVE_INFINITY,
                        inDepth ?? Number.POSITIVE_INFINITY
                    )

                    assignFadeClass(node, bestDepth)
                })

                cy.edges().forEach((edge: any) => {
                    const sourceId = edge.data('source')
                    const targetId = edge.data('target')

                    const outSource = outgoingVisited.get(sourceId)
                    const outTarget = outgoingVisited.get(targetId)
                    const inSource = incomingVisited.get(sourceId)
                    const inTarget = incomingVisited.get(targetId)

                    const outgoingRelated = outSource != null && outTarget != null
                    const incomingRelated = inSource != null && inTarget != null

                    if (!outgoingRelated && !incomingRelated) {
                        edge.addClass('fade-unrelated')
                        return
                    }

                    const candidateDepths: number[] = []

                    if (outgoingRelated) {
                        candidateDepths.push(Math.max(outSource!, outTarget!))
                    }

                    if (incomingRelated) {
                        candidateDepths.push(Math.max(inSource!, inTarget!))
                    }

                    const bestDepth = Math.min(...candidateDepths)
                    assignFadeClass(edge, bestDepth)
                })
            })
        }

        const walkOutgoing = (root: NodeSingular, maxDepth: number) => {
            const visitedNodes = new Map<string, number>()
            const summaryMap = new Map<number, string[]>()

            const queue: Array<{ node: NodeSingular; depth: number }> = [{ node: root, depth: 0 }]
            visitedNodes.set(root.id(), 0)

            while (queue.length > 0) {
                const current = queue.shift()

                if (!current) { continue }

                const { node, depth } = current

                if (depth >= maxDepth) { continue }

                const outgoers = node.outgoers('edge')

                outgoers.forEach((edge: any) => {
                    const target = edge.target()
                    const nextDepth = depth + 1

                    if (nextDepth > maxDepth) { return }

                    edge.addClass('depth-path-outgoing')

                    if (!visitedNodes.has(target.id()) || nextDepth < visitedNodes.get(target.id())!) {
                        visitedNodes.set(target.id(), nextDepth)
                        target.addClass(`depth-level-${nextDepth}`)

                        const arr = summaryMap.get(nextDepth) || []
                        const label = target.data('label')

                        if (!arr.includes(label)) {
                            arr.push(label)
                            summaryMap.set(nextDepth, arr)
                        }

                        queue.push({ node: target, depth: nextDepth })
                    }
                })
            }

            const summary = Array.from(summaryMap.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([depth, nodes]) => ({ depth, nodes }))

            return { visitedNodes, summary }
        }

        const walkIncoming = (root: NodeSingular, maxDepth: number) => {
            const visitedNodes = new Map<string, number>()
            const summaryMap = new Map<number, string[]>()

            const queue: Array<{ node: NodeSingular; depth: number }> = [{ node: root, depth: 0 }]
            visitedNodes.set(root.id(), 0)

            while (queue.length > 0) {
                const current = queue.shift()

                if (!current) { continue }

                const { node, depth } = current

                if (depth >= maxDepth) { continue }

                const incomers = node.incomers('edge')

                incomers.forEach((edge: any) => {
                    const source = edge.source()
                    const nextDepth = depth + 1

                    if (nextDepth > maxDepth) { return }

                    edge.addClass('depth-path-incoming')

                    if (!visitedNodes.has(source.id()) || nextDepth < visitedNodes.get(source.id())!) {
                        visitedNodes.set(source.id(), nextDepth)
                        source.addClass(`incoming-level-${nextDepth}`)

                        const arr = summaryMap.get(nextDepth) || []
                        const label = source.data('label')

                        if (!arr.includes(label)) {
                            arr.push(label)
                            summaryMap.set(nextDepth, arr)
                        }

                        queue.push({ node: source, depth: nextDepth })
                    }
                })
            }

            const summary = Array.from(summaryMap.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([depth, nodes]) => ({ depth, nodes }))

            return { visitedNodes, summary }
        }

        const applyTraversal = (root: NodeSingular, mode: TraversalMode, levels: number) => {
            clearTraversal()

            cy.batch(() => {
                root.addClass('depth-root')
            })

            const outgoing = mode === 'outgoing' || mode === 'both'
                ? walkOutgoing(root, levels)
                : { visitedNodes: new Map<string, number>(), summary: [] }

            const incoming = mode === 'incoming' || mode === 'both'
                ? walkIncoming(root, levels)
                : { visitedNodes: new Map<string, number>(), summary: [] }

            applyProgressiveFading(root, outgoing.visitedNodes, incoming.visitedNodes)

            setSelectedRootNode(root.data('label'))
            setDepthSummary(outgoing.summary)
            setIncomingSummary(incoming.summary)
        }

        cy.on('tap', 'node', (evt) => {
            const node = evt.target
            applyTraversal(node, traversalMode, maxLevels)
        })

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

        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                cy.elements().unselect()
                setTooltip((prev) => ({ ...prev, visible: false }))
                clearTraversal()
            }
        })

        const defaultRoot = cy.getElementById('gene_braf')

        if (defaultRoot && defaultRoot.nonempty()) {
            applyTraversal(defaultRoot, traversalMode, maxLevels)
            cy.center(defaultRoot)
        }

        return () => {
            cy.destroy()
            cyRef.current = null
        }
    }, [elements, traversalMode, maxLevels])

    const removeSelectedEdgeFromList = (edgeId: string) => {
        const cy = cyRef.current

        if (!cy) { return }

        const edge = cy.getElementById(edgeId)

        if (edge && edge.nonempty() && edge.hasClass('edge-picked')) {
            edge.removeClass('edge-picked')
        }

        setSelectedEdges((prev) => prev.filter((item) => item.id !== edgeId))
    }

    const clearAllSelectedEdges = () => {
        const cy = cyRef.current

        if (!cy) {
            setSelectedEdges([])
            return
        }

        cy.edges('.edge-picked').removeClass('edge-picked')
        setSelectedEdges([])
    }

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <div
                style={{
                    display: 'grid',
                    gap: 12,
                    padding: 12,
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    background: '#ffffff',
                }}
            >
                <div style={{ display: 'grid', gap: 10 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            Correlation threshold
                        </div>

                        <Label>
                            Visible when correlation ≤ -{threshold.toFixed(1)} or ≥ {threshold.toFixed(1)}
                        </Label>
                    </div>

                    <input
                        type='range'
                        min={0.1}
                        max={0.9}
                        step={0.1}
                        value={threshold}
                        onChange={(e) => {
                            setThreshold(roundThreshold(Number(e.target.value)))
                        }}
                        style={{
                            width: '100%',
                            accentColor: '#2563eb',
                            cursor: 'pointer',
                        }}
                    />

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 12,
                            color: '#64748b',
                        }}
                    >
                        <span>±0.1</span>
                        <span>±0.5</span>
                        <span>±0.9</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            Cantidad máxima de niveles
                        </div>

                        <Label>
                            {maxLevels} nivel{maxLevels > 1 ? 'es' : ''}
                        </Label>
                    </div>

                    <input
                        type='range'
                        min={1}
                        max={10}
                        step={1}
                        value={maxLevels}
                        onChange={(e) => {
                            setMaxLevels(Number(e.target.value))
                        }}
                        style={{
                            width: '100%',
                            accentColor: '#16a34a',
                            cursor: 'pointer',
                        }}
                    />

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 12,
                            color: '#64748b',
                        }}
                    >
                        <span>1</span>
                        <span>5</span>
                        <span>10</span>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                            Análisis del nodo:
                        </span>

                        <Dropdown
                            selection
                            value={traversalMode}
                            options={traversalOptions}
                            onChange={(_, data) => setTraversalMode(data.value as TraversalMode)}
                        />

                        <Label color='orange'>
                            Nodo inicial: BRAF
                        </Label>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <LegendDot color={NODE_COLORS.Gene} label='Gene' />
                        <LegendDot color={NODE_COLORS.miRNA} label='miRNA' />
                        <LegendDot color={NODE_COLORS.CNA} label='CNA' />
                        <LegendDot color={NODE_COLORS.Methylation} label='Methylation' />
                        <LegendDot color={NODE_COLORS.Drug} label='Drug' />
                        <LegendArrow color='#dc2626' label='Down regulate' />
                        <LegendArrow color='#2563eb' label='Up regulate' />
                    </div>
                </div>
            </div>

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

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                }}
            >
                <div
                    style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        background: '#ffffff',
                        padding: 12,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                            gap: 12,
                        }}
                    >
                        <div style={{ fontWeight: 700 }}>Aristas seleccionadas</div>

                        <Button
                            size='small'
                            basic
                            color='red'
                            icon
                            labelPosition='left'
                            onClick={clearAllSelectedEdges}
                            disabled={selectedEdges.length === 0}
                        >
                            <Icon name='trash alternate outline' />
                            Clear
                        </Button>
                    </div>

                    {selectedEdges.length === 0
                        ? (
                            <div style={{ color: '#64748b', fontSize: 13 }}>
                                Hacé click en múltiples aristas para ver el valor de cada una.
                            </div>
                        )
                        : (
                            <div style={{ display: 'grid', gap: 8 }}>
                                {selectedEdges.map((edge) => (
                                    <div
                                        key={edge.id}
                                        style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 8,
                                            padding: '8px 10px',
                                            background: '#f8fafc',
                                            fontSize: 13,
                                            color: '#334155',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ marginBottom: 4 }}>
                                                <strong>{edge.source}</strong> → <strong>{edge.target}</strong>
                                            </div>
                                            <div>Direction: {edge.direction}</div>
                                            <div>Correlation: {edge.correlation}</div>
                                        </div>

                                        <Button
                                            type='button'
                                            size='mini'
                                            basic
                                            circular
                                            icon='close'
                                            onClick={() => removeSelectedEdgeFromList(edge.id)}
                                            title='Deseleccionar'
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                </div>

                <div
                    style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        background: '#ffffff',
                        padding: 12,
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                        {traversalMode === 'outgoing'
                            ? 'Nivel de profundidad'
                            : traversalMode === 'incoming'
                                ? 'Nivel de regulación ascendente'
                                : 'Niveles de relación'}
                    </div>

                    {!selectedRootNode
                        ? (
                            <div style={{ color: '#64748b', fontSize: 13 }}>
                                Seleccioná un nodo para calcular niveles.
                            </div>
                        )
                        : (
                            <div style={{ display: 'grid', gap: 10 }}>
                                <div style={{ fontSize: 13, color: '#334155' }}>
                                    Nodo raíz: <strong>{selectedRootNode}</strong>
                                </div>

                                <div style={{ fontSize: 13, color: '#334155' }}>
                                    Límite de búsqueda: <strong>{maxLevels}</strong> nivel{maxLevels > 1 ? 'es' : ''}
                                </div>

                                {(traversalMode === 'outgoing' || traversalMode === 'both') && (
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                                            Regula
                                        </div>

                                        {depthSummary.length === 0
                                            ? (
                                                <div style={{ color: '#64748b', fontSize: 13 }}>
                                                    No regula nodos visibles con el threshold actual.
                                                </div>
                                            )
                                            : (
                                                depthSummary.map((item) => (
                                                    <div
                                                        key={`out-${item.depth}`}
                                                        style={{
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: 8,
                                                            padding: '8px 10px',
                                                            background: '#f8fafc',
                                                            fontSize: 13,
                                                            color: '#334155',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                            <LevelBadge depth={item.depth} />
                                                            <strong>Nivel {item.depth}</strong>
                                                        </div>
                                                        <div>{item.nodes.join(', ')}</div>
                                                    </div>
                                                ))
                                            )}
                                    </div>
                                )}

                                {(traversalMode === 'incoming' || traversalMode === 'both') && (
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                                            Es regulado por
                                        </div>

                                        {incomingSummary.length === 0
                                            ? (
                                                <div style={{ color: '#64748b', fontSize: 13 }}>
                                                    No tiene reguladores visibles con el threshold actual.
                                                </div>
                                            )
                                            : (
                                                incomingSummary.map((item) => (
                                                    <div
                                                        key={`in-${item.depth}`}
                                                        style={{
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: 8,
                                                            padding: '8px 10px',
                                                            background: '#f8fafc',
                                                            fontSize: 13,
                                                            color: '#334155',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                            <LevelBadge depth={item.depth} incoming />
                                                            <strong>Nivel {item.depth}</strong>
                                                        </div>
                                                        <div>{item.nodes.join(', ')}</div>
                                                    </div>
                                                ))
                                            )}
                                    </div>
                                )}
                            </div>
                        )}
                </div>
            </div>
        </div>
    )
}

const LevelBadge = ({ depth, incoming = false }: { depth: number; incoming?: boolean }) => {
    const color =
        depth === 1
            ? LEVEL_COLORS.level1
            : depth === 2
                ? LEVEL_COLORS.level2
                : depth === 3
                    ? LEVEL_COLORS.level3
                    : '#94a3b8'

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

const LegendArrow = ({ color, label }: { color: string; label: string }) => (
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
