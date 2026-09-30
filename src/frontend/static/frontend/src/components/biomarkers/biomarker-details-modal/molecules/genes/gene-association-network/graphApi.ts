import { MOCK_EDGES, MOCK_EXPANSION_EDGES_BY_ROOT, MOCK_NODES } from './mockNetworkData'
import {
    DepthSummaryItem,
    FetchGeneRegulationGraphParams,
    FetchGeneRegulationGraphResponse,
    GraphEdge,
    GraphQueryFilter,
} from './types'

const FALLBACK_FILTER: GraphQueryFilter = {
    rootNodeId: 'gene_braf',
    threshold: 0.5,
    traversalMode: 'both',
    maxLevels: 3,
}

type TraversalWalkResult = {
    visitedNodes: Map<string, number>;
    includedEdgeIds: Set<string>;
    summary: DepthSummaryItem[];
}

/**
 * Simulates the latency of the future backend integration.
 * @param ms Milliseconds to wait before resolving the mock request.
 * @returns A promise resolved after the requested delay.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Validates whether an edge should remain visible for the current threshold.
 * @param correlation Correlation value stored in the graph edge.
 * @param threshold Threshold required for the edge to stay visible.
 * @returns Whether the edge passes the active threshold.
 */
const passesThreshold = (correlation: number, threshold: number) =>
    Math.abs(correlation) >= threshold

/**
 * Resolves the label to display for a node identifier.
 * @param nodeId Graph node identifier.
 * @returns The visible label associated with the node.
 */
const getNodeLabel = (nodeId: string) =>
    MOCK_NODES.find((node) => node.id === nodeId)?.label ?? nodeId

/**
 * Returns the base graph plus the mock branch associated with a root node expansion.
 * @param rootNodeId Root node identifier used for the expansion.
 * @returns The list of edges available for that root node.
 */
const getEdgesForFilter = (rootNodeId: string) => [
    ...MOCK_EDGES,
    ...(MOCK_EXPANSION_EDGES_BY_ROOT[rootNodeId] ?? []),
]

/**
 * Converts the raw traversal map into a sorted depth summary structure.
 * @param map Traversal map keyed by depth.
 * @returns The normalized list of depth summary items.
 */
const buildSummary = (map: Map<number, string[]>) =>
    Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([depth, nodes]): DepthSummaryItem => ({
            depth,
            nodes: [...nodes].sort((a, b) => a.localeCompare(b)),
        }))

/**
 * Merges summaries coming from all active root filters.
 * @param summaries Summary lists produced for each active root filter.
 * @returns A merged summary grouped by depth.
 */
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

/**
 * Traverses outward edges from a root node respecting the selected depth limit.
 * @param rootNodeId Root node identifier used as traversal origin.
 * @param edges Edges currently visible for the filter.
 * @param maxLevels Maximum number of depth levels to walk.
 * @returns The visited nodes, kept edges and outgoing level summary.
 */
const walkOutgoing = (rootNodeId: string, edges: GraphEdge[], maxLevels: number): TraversalWalkResult => {
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

/**
 * Traverses inward edges from a root node respecting the selected depth limit.
 * @param rootNodeId Root node identifier used as traversal origin.
 * @param edges Edges currently visible for the filter.
 * @param maxLevels Maximum number of depth levels to walk.
 * @returns The visited nodes, kept edges and incoming level summary.
 */
const walkIncoming = (rootNodeId: string, edges: GraphEdge[], maxLevels: number): TraversalWalkResult => {
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

/**
 * Builds the partial graph response for a single root filter.
 * @param filter Active filter to resolve for one root node.
 * @returns The partial graph payload generated for that filter.
 */
const collectFilterResponse = (filter: GraphQueryFilter): FetchGeneRegulationGraphResponse => {
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

/**
 * Combines all active filter responses into a single graph payload for the UI.
 * @param filters Active filters currently applied to the graph.
 * @returns The merged graph payload rendered by the panel.
 */
const collectResponse = (filters: GraphQueryFilter[]): FetchGeneRegulationGraphResponse => {
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

/**
 * Resolves the mock graph request used by the gene regulation associations tab.
 * @param params Active graph filters that would later be forwarded to the backend.
 * @returns A promise with the merged graph payload for all active filters.
 */
export const fetchGeneRegulationGraph = (
    params: FetchGeneRegulationGraphParams
): Promise<FetchGeneRegulationGraphResponse> =>
    sleep(350).then(() => collectResponse(params.filters))
