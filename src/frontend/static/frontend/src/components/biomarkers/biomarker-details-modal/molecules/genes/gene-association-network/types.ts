export type NodeKind = 'Gene' | 'miRNA' | 'CNA' | 'Methylation' | 'Drug'

export type TraversalMode = 'outgoing' | 'incoming' | 'both'

export type GraphNode = {
    id: string;
    label: string;
    type: NodeKind;
    size: number;
}

export type GraphEdge = {
    id: string;
    source: string;
    target: string;
    correlation: number;
}

export type SelectedEdgeInfo = {
    id: string;
    source: string;
    target: string;
    correlation: number;
    direction: 'Down-regulation' | 'Up-regulation';
}

export type DepthSummaryItem = {
    depth: number;
    nodes: string[];
}

export type FetchGeneGraphParams = {
    rootNodeId: string;
    threshold: number;
    traversalMode: TraversalMode;
    maxLevels: number;
}

export type FetchGeneGraphResponse = {
    rootNodeId: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    outgoingSummary: DepthSummaryItem[];
    incomingSummary: DepthSummaryItem[];
}
