import { MOCK_EDGES, MOCK_EXPANSION_EDGES_BY_ROOT, MOCK_NODES } from './mockNetworkData'
import {
    DepthSummaryItem,
    FetchGeneGraphParams,
    FetchGeneGraphResponse,
    GraphEdge,
    GraphQueryFilter,
} from './types'

const FALLBACK_FILTER: GraphQueryFilter = {
    rootNodeId: 'gene_braf',
    threshold: 0.5,
    traversalMode: 'both',
    maxLevels: 3,
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const passesThreshold = (correlation: number, threshold: number) =>
    Math.abs(correlation) >= threshold

const getNodeLabel = (nodeId: string) =>
    MOCK_NODES.find((node) => node.id === nodeId)?.label ?? nodeId

const getEdgesForFilter = (rootNodeId: string) => [
    ...MOCK_EDGES,
    ...(MOCK_EXPANSION_EDGES_BY_ROOT[rootNodeId] ?? []),
]

const buildSummary = (map: Map<number, string[]>) =>
    Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([depth, nodes]): DepthSummaryItem => ({
            depth,
            nodes: [...nodes].sort((a, b) => a.localeCompare(b)),
        }))

const mergeSummaries = (summaries: DepthSummaryItem[][]) => {
    const summaryMap = new Map<number, Set<string>>()

    for (const summary of summaries) {
        for (const item of summary) {
            const nodes = summaryMap.get(item.depth) ?? new Set<string>()

            for (const node of item.nodes) {
                nodes.add(node)
            }

            summaryMap.set(item.depth, nodes)
        }
    }

    return Array.from(summaryMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([depth, nodes]): DepthSummaryItem => ({
            depth,
            nodes: Array.from(nodes).sort((a, b) => a.localeCompare(b)),
        }))
}

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

                const targetLabel = getNodeLabel(edge.target)
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

                const sourceLabel = getNodeLabel(edge.source)
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

const collectFilterResponse = (filter: GraphQueryFilter): FetchGeneGraphResponse => {
    const thresholdEdges = getEdgesForFilter(filter.rootNodeId).filter((edge) =>
        passesThreshold(edge.correlation, filter.threshold)
    )

    const outgoing = filter.traversalMode === 'outgoing' || filter.traversalMode === 'both'
        ? walkOutgoing(filter.rootNodeId, thresholdEdges, filter.maxLevels)
        : {
            visitedNodes: new Map<string, number>(),
            includedEdgeIds: new Set<string>(),
            summary: [] as DepthSummaryItem[],
        }

    const incoming = filter.traversalMode === 'incoming' || filter.traversalMode === 'both'
        ? walkIncoming(filter.rootNodeId, thresholdEdges, filter.maxLevels)
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

    includedNodeIdsFromEdges.add(filter.rootNodeId)

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
        rootNodeId: filter.rootNodeId,
        nodes,
        edges,
        outgoingSummary,
        incomingSummary,
        filters: [filter],
    }
}

const collectResponse = (filters: GraphQueryFilter[]): FetchGeneGraphResponse => {
    const safeFilters = filters.length > 0 ? filters : [FALLBACK_FILTER]
    const responses = safeFilters.map(collectFilterResponse)
    const nodeIds = new Set<string>()
    const edgesById = new Map<string, GraphEdge>()

    for (const response of responses) {
        for (const node of response.nodes) {
            nodeIds.add(node.id)
        }

        for (const edge of response.edges) {
            edgesById.set(edge.id, edge)
        }
    }

    return {
        rootNodeId: safeFilters[0].rootNodeId,
        nodes: MOCK_NODES.filter((node) => nodeIds.has(node.id)),
        edges: Array.from(edgesById.values()),
        outgoingSummary: mergeSummaries(responses.map((response) => response.outgoingSummary)),
        incomingSummary: mergeSummaries(responses.map((response) => response.incomingSummary)),
        filters: safeFilters,
    }
}

export const fetchGeneGraph = async (
    params: FetchGeneGraphParams
): Promise<FetchGeneGraphResponse> => {
    await sleep(350)

    return collectResponse(params.filters)
}
