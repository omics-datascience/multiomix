import React, { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape, { Core, ElementDefinition, NodeSingular } from 'cytoscape'
import { Button, Dropdown, Icon, Label } from 'semantic-ui-react'

type NodeKind = 'mRNA' | 'miRNA' | 'CNA' | 'Methylation' | 'Drug'

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
    mRNA: '#4f46e5',
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

    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        x: 0,
        y: 0,
        content: '',
    })

    const [selectedEdges, setSelectedEdges] = useState<SelectedEdgeInfo[]>([])
    const [selectedRootNode, setSelectedRootNode] = useState<string | null>(null)
    const [depthSummary, setDepthSummary] = useState<DepthSummaryItem[]>([])
    const [incomingSummary, setIncomingSummary] = useState<DepthSummaryItem[]>([])

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
        setSelectedRootNode(null)
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
                    node.removeClass('depth-root')
                    node.removeClass('depth-level-1')
                    node.removeClass('depth-level-2')
                    node.removeClass('depth-level-3')
                    node.removeClass('incoming-level-1')
                    node.removeClass('incoming-level-2')
                    node.removeClass('incoming-level-3')
                    node.removeClass('fade-unrelated')
                    node.removeClass('fade-level-1')
                    node.removeClass('fade-level-2')
                    node.removeClass('fade-level-3')
                    node.removeClass('fade-level-4plus')
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

        const walkOutgoing = (root: NodeSingular) => {
            const visitedNodes = new Map<string, number>()
            const summaryMap = new Map<number, string[]>()

            const queue: Array<{ node: NodeSingular; depth: number }> = [{ node: root, depth: 0 }]
            visitedNodes.set(root.id(), 0)

            while (queue.length > 0) {
                const current = queue.shift()

                if (!current) { continue }

                const { node, depth } = current
                const outgoers = node.outgoers('edge')

                outgoers.forEach((edge: any) => {
                    const target = edge.target()
                    const nextDepth = depth + 1

                    edge.addClass('depth-path-outgoing')

                    if (!visitedNodes.has(target.id()) || nextDepth < visitedNodes.get(target.id())!) {
                        visitedNodes.set(target.id(), nextDepth)

                        if (nextDepth === 1) {
                            target.addClass('depth-level-1')
                        } else if (nextDepth === 2) {
                            target.addClass('depth-level-2')
                        } else {
                            target.addClass('depth-level-3')
                        }

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

        const walkIncoming = (root: NodeSingular) => {
            const visitedNodes = new Map<string, number>()
            const summaryMap = new Map<number, string[]>()

            const queue: Array<{ node: NodeSingular; depth: number }> = [{ node: root, depth: 0 }]
            visitedNodes.set(root.id(), 0)

            while (queue.length > 0) {
                const current = queue.shift()

                if (!current) { continue }

                const { node, depth } = current
                const incomers = node.incomers('edge')

                incomers.forEach((edge: any) => {
                    const source = edge.source()
                    const nextDepth = depth + 1

                    edge.addClass('depth-path-incoming')

                    if (!visitedNodes.has(source.id()) || nextDepth < visitedNodes.get(source.id())!) {
                        visitedNodes.set(source.id(), nextDepth)

                        if (nextDepth === 1) {
                            source.addClass('incoming-level-1')
                        } else if (nextDepth === 2) {
                            source.addClass('incoming-level-2')
                        } else {
                            source.addClass('incoming-level-3')
                        }

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

        const applyTraversal = (root: NodeSingular, mode: TraversalMode) => {
            clearTraversal()

            cy.batch(() => {
                root.addClass('depth-root')
            })

            const outgoing = mode === 'outgoing' || mode === 'both'
                ? walkOutgoing(root)
                : { visitedNodes: new Map<string, number>(), summary: [] }

            const incoming = mode === 'incoming' || mode === 'both'
                ? walkIncoming(root)
                : { visitedNodes: new Map<string, number>(), summary: [] }

            applyProgressiveFading(root, outgoing.visitedNodes, incoming.visitedNodes)

            setSelectedRootNode(root.data('label'))
            setDepthSummary(outgoing.summary)
            setIncomingSummary(incoming.summary)
        }

        cy.on('tap', 'node', (evt) => {
            const node = evt.target
            applyTraversal(node, traversalMode)
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

        return () => {
            cy.destroy()
            cyRef.current = null
        }
    }, [elements, traversalMode])

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
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <LegendDot color={NODE_COLORS.mRNA} label='mRNA' />
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
                : LEVEL_COLORS.level3

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
