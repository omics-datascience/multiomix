import React, { useMemo, useState } from 'react'
import { Loader, Message } from 'semantic-ui-react'
import { GraphControls } from './GraphControls'
import { GeneNetworkGraph } from './GeneNetworkGraph'
import { SelectedEdgesPanel } from './SelectedEdgesPanel'
import { TraversalSummaryPanel } from './TraversalSummaryPanel'
import { useGeneGraphQuery } from './useGeneGraphQuery'
import { SelectedEdgeInfo, TraversalMode } from './types'

type Props = {
    height?: number | string;
    width?: number | string;
}

export const GeneExpressionRegulationAssociationNetworkPanel = ({
    height = 650,
    width = '100%',
}: Props) => {
    const [threshold, setThreshold] = useState<number>(0.5)
    const [traversalMode, setTraversalMode] = useState<TraversalMode>('outgoing')
    const [maxLevels, setMaxLevels] = useState<number>(3)
    const [selectedEdges, setSelectedEdges] = useState<SelectedEdgeInfo[]>([])

    const queryParams = useMemo(() => ({
        rootNodeId: 'gene_braf',
        threshold,
        traversalMode,
        maxLevels,
    }), [threshold, traversalMode, maxLevels])

    const { data, loading, error } = useGeneGraphQuery(queryParams)

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <GraphControls
                threshold={threshold}
                onThresholdChange={(value) => {
                    setSelectedEdges([])
                    setThreshold(value)
                }}
                maxLevels={maxLevels}
                onMaxLevelsChange={(value) => {
                    setSelectedEdges([])
                    setMaxLevels(value)
                }}
                traversalMode={traversalMode}
                onTraversalModeChange={(value) => {
                    setSelectedEdges([])
                    setTraversalMode(value)
                }}
            />

            {loading && (
                <div
                    style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        background: '#ffffff',
                        padding: 24,
                    }}
                >
                    <Loader active inline='centered' content='Loading mock graph...' />
                </div>
            )}

            {error && (
                <Message negative>
                    <Message.Header>Error fetching graph</Message.Header>
                    <p>{error}</p>
                </Message>
            )}

            {!loading && !error && data && (
                <GeneNetworkGraph
                    data={data}
                    height={height}
                    width={width}
                    selectedEdges={selectedEdges}
                    onSelectedEdgesChange={setSelectedEdges}
                />
            )}

            {!loading && !error && data && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                    }}
                >
                    <SelectedEdgesPanel
                        selectedEdges={selectedEdges}
                        onRemoveEdge={(edgeId) => setSelectedEdges((prev) => prev.filter((edge) => edge.id !== edgeId))}
                        onClearAll={() => setSelectedEdges([])}
                    />

                    <TraversalSummaryPanel
                        traversalMode={traversalMode}
                        selectedRootNode={data.nodes.find((node) => node.id === data.rootNodeId)?.label ?? null}
                        maxLevels={maxLevels}
                        depthSummary={data.outgoingSummary}
                        incomingSummary={data.incomingSummary}
                    />
                </div>
            )}
        </div>
    )
}
