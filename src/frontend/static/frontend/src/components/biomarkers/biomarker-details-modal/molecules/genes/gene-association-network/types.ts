/** Supported node categories shown in the regulation graph. */
export type NodeKind = 'Gene' | 'miRNA' | 'CNA' | 'Methylation' | 'Drug'

/** Traversal direction used when exploring associations from a root node. */
export type TraversalMode = 'outgoing' | 'incoming' | 'both'

/** Graph node rendered by Cytoscape. */
export type GraphNode = {
    /** Stable node identifier used by Cytoscape and the mock API. */
    id: string;
    /** Human-readable node label shown in the graph and side panels. */
    label: string;
    /** Biological or domain category used to color the node. */
    type: NodeKind;
    /** Visual size used by the graph layout. */
    size: number;
}

/** Graph edge rendered by Cytoscape. */
export type GraphEdge = {
    /** Stable edge identifier used to keep selections in sync. */
    id: string;
    /** Source node identifier. */
    source: string;
    /** Target node identifier. */
    target: string;
    /** Correlation score used to infer direction color and visibility. */
    correlation: number;
}

/** Filter payload used to query one graph root and its expansion settings. */
export type GraphQueryFilter = {
    /** Root node from which the traversal starts. */
    rootNodeId: string;
    /** Minimum absolute correlation required for edges to stay visible. */
    threshold: number;
    /** Which direction should be traversed from the root node. */
    traversalMode: TraversalMode;
    /** Maximum number of levels to traverse from the root node. */
    maxLevels: number;
}

/** Edge selection details rendered in the side panel after user interaction. */
export type SelectedEdgeInfo = {
    /** Stable edge identifier. */
    id: string;
    /** Visible label of the source node. */
    source: string;
    /** Visible label of the target node. */
    target: string;
    /** Correlation associated with the selected edge. */
    correlation: number;
    /** Regulation label derived from the correlation sign. */
    direction: 'Down-regulation' | 'Up-regulation';
}

/** Group of nodes found at the same traversal level. */
export type DepthSummaryItem = {
    /** Traversal level relative to the selected root. */
    depth: number;
    /** Visible labels of the nodes found at that level. */
    nodes: string[];
}

/** Request payload sent by the panel when asking for graph data. */
export type FetchGeneRegulationGraphParams = {
    /** Active root filters, including user-created expansions. */
    filters: GraphQueryFilter[];
}

/** Response payload consumed by the regulation graph UI. */
export type FetchGeneRegulationGraphResponse = {
    /** Root node of the primary filter used to center the graph. */
    rootNodeId: string;
    /** Nodes included after applying the active filters. */
    nodes: GraphNode[];
    /** Edges included after applying the active filters. */
    edges: GraphEdge[];
    /** Outgoing traversal summary for the current filter set. */
    outgoingSummary: DepthSummaryItem[];
    /** Incoming traversal summary for the current filter set. */
    incomingSummary: DepthSummaryItem[];
    /** Filters effectively used to generate the response. */
    filters: GraphQueryFilter[];
}
