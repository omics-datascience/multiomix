import { MOCK_EDGES, MOCK_NODES } from './mockNetworkData'
import {
    DepthSummaryItem,
    FetchGeneGraphParams,
    FetchGeneGraphResponse,
    GraphEdge,
    TraversalMode,
} from './types'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const passesThreshold = (correlation: number, threshold: number) =>
    Math.abs(correlation) >= threshold

const buildSummary = (map: Map<number, string[]>) =>
    Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([depth, nodes]): DepthSummaryItem => ({
            depth,
            nodes: [...nodes].sort((a, b) => a.localeCompare(b)),
        }))

const walkOutgoing = (rootNodeId: string, edges: GraphEdge[], maxLevels: number) => {
    const visitedNodes = new Map<string, number>()
    const includedEdgeIds = new Set<string>()
    const summaryMap = new Map<number, string[]>()

    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: rootNodeId, depth: 0 }]
    visitedNodes.set(rootNodeId, 0)

    while (queue.length > 0) {
        const current = queue.shift()

        if (!current) { continue }

        const { nodeId, depth } = current

        if (depth >= maxLevels) { continue }

        const outgoingEdges = edges.filter((edge) => edge.source === nodeId)

        for (const edge of outgoingEdges) {
            const nextDepth = depth + 1

            if (nextDepth > maxLevels) { continue }

            includedEdgeIds.add(edge.id)

            if (!visitedNodes.has(edge.target) || nextDepth < visitedNodes.get(edge.target)!) {
                visitedNodes.set(edge.target, nextDepth)

                const targetLabel = MOCK_NODES.find((node) => node.id === edge.target)?.label ?? edge.target
                const arr = summaryMap.get(nextDepth) || []

                if (!arr.includes(targetLabel)) {
                    arr.push(targetLabel)
                    summaryMap.set(nextDepth, arr)
                }

                queue.push({ nodeId: edge.target, depth: nextDepth })
            }
        }
    }

    return {
        visitedNodes,
        includedEdgeIds,
        summary: buildSummary(summaryMap),
    }
}

const walkIncoming = (rootNodeId: string, edges: GraphEdge[], maxLevels: number) => {
    const visitedNodes = new Map<string, number>()
    const includedEdgeIds = new Set<string>()
    const summaryMap = new Map<number, string[]>()

    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: rootNodeId, depth: 0 }]
    visitedNodes.set(rootNodeId, 0)

    while (queue.length > 0) {
        const current = queue.shift()

        if (!current) { continue }

        const { nodeId, depth } = current

        if (depth >= maxLevels) { continue }

        const incomingEdges = edges.filter((edge) => edge.target === nodeId)

        for (const edge of incomingEdges) {
            const nextDepth = depth + 1

            if (nextDepth > maxLevels) { continue }

            includedEdgeIds.add(edge.id)

            if (!visitedNodes.has(edge.source) || nextDepth < visitedNodes.get(edge.source)!) {
                visitedNodes.set(edge.source, nextDepth)

                const sourceLabel = MOCK_NODES.find((node) => node.id === edge.source)?.label ?? edge.source
                const arr = summaryMap.get(nextDepth) || []

                if (!arr.includes(sourceLabel)) {
                    arr.push(sourceLabel)
                    summaryMap.set(nextDepth, arr)
                }

                queue.push({ nodeId: edge.source, depth: nextDepth })
            }
        }
    }

    return {
        visitedNodes,
        includedEdgeIds,
        summary: buildSummary(summaryMap),
    }
}

const collectResponse = (
    rootNodeId: string,
    traversalMode: TraversalMode,
    threshold: number,
    maxLevels: number
): FetchGeneGraphResponse => {
    const thresholdEdges = MOCK_EDGES.filter((edge) =>
        passesThreshold(edge.correlation, threshold)
    )

    const outgoing = traversalMode === 'outgoing' || traversalMode === 'both'
        ? walkOutgoing(rootNodeId, thresholdEdges, maxLevels)
        : {
            visitedNodes: new Map<string, number>(),
            includedEdgeIds: new Set<string>(),
            summary: [] as DepthSummaryItem[],
        }

    const incoming = traversalMode === 'incoming' || traversalMode === 'both'
        ? walkIncoming(rootNodeId, thresholdEdges, maxLevels)
        : {
            visitedNodes: new Map<string, number>(),
            includedEdgeIds: new Set<string>(),
            summary: [] as DepthSummaryItem[],
        }

    const includedEdgeIds = new Set<string>([
        ...Array.from(outgoing.includedEdgeIds),
        ...Array.from(incoming.includedEdgeIds),
    ])

    const edges = thresholdEdges.filter((edge) => includedEdgeIds.has(edge.id))

    const includedNodeIdsFromEdges = new Set<string>()

    for (const edge of edges) {
        includedNodeIdsFromEdges.add(edge.source)
        includedNodeIdsFromEdges.add(edge.target)
    }

    // Keep the root visible even when no edges match the current filters.
    includedNodeIdsFromEdges.add(rootNodeId)

    const nodes = MOCK_NODES.filter((node) => includedNodeIdsFromEdges.has(node.id))

    const validLabels = new Set(nodes.map((node) => node.label))

    const outgoingSummary = outgoing.summary
        .map((item) => ({
            depth: item.depth,
            nodes: item.nodes.filter((label) => validLabels.has(label)),
        }))
        .filter((item) => item.nodes.length > 0)

    const incomingSummary = incoming.summary
        .map((item) => ({
            depth: item.depth,
            nodes: item.nodes.filter((label) => validLabels.has(label)),
        }))
        .filter((item) => item.nodes.length > 0)

    return {
        rootNodeId,
        nodes,
        edges,
        outgoingSummary,
        incomingSummary,
    }
}

export const fetchGeneGraph = async (
    params: FetchGeneGraphParams
): Promise<FetchGeneGraphResponse> => {
    await sleep(350)

    return collectResponse(
        params.rootNodeId,
        params.traversalMode,
        params.threshold,
        params.maxLevels
    )
}
