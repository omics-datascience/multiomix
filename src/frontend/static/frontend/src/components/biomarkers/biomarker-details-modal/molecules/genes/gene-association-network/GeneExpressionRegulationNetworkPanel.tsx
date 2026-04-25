import React, { useMemo, useState } from 'react'
import { Loader, Message } from 'semantic-ui-react'
import { ActiveGraphFiltersPanel } from './ActiveGraphFiltersPanel'
import { GeneNetworkGraph } from './GeneNetworkGraph'
import { SelectedEdgesPanel } from './SelectedEdgesPanel'
import { TraversalSummaryPanel } from './TraversalSummaryPanel'
import { useGeneGraphQuery } from './useGeneGraphQuery'
import { GraphQueryFilter, SelectedEdgeInfo } from './types'

type Props = {
    height?: number | string;
    width?: number | string;
}

const DEFAULT_ROOT_FILTER: GraphQueryFilter = {
    rootNodeId: 'gene_braf',
    threshold: 0.5,
    traversalMode: 'both',
    maxLevels: 3,
}

export const GeneExpressionRegulationAssociationNetworkPanel = ({
    height = 650,
    width = '100%',
}: Props) => {
    const [selectedEdges, setSelectedEdges] = useState<SelectedEdgeInfo[]>([])
    const [filters, setFilters] = useState<GraphQueryFilter[]>([DEFAULT_ROOT_FILTER])
    const [draftFilters, setDraftFilters] = useState<GraphQueryFilter[]>([DEFAULT_ROOT_FILTER])

    const defaultExpansionFilter = useMemo(() => ({
        threshold: draftFilters[0]?.threshold ?? DEFAULT_ROOT_FILTER.threshold,
        traversalMode: draftFilters[0]?.traversalMode ?? DEFAULT_ROOT_FILTER.traversalMode,
        maxLevels: draftFilters[0]?.maxLevels ?? DEFAULT_ROOT_FILTER.maxLevels,
    }), [draftFilters])

    const queryParams = useMemo(() => ({
        filters,
    }), [filters])

    const { data, loading, error } = useGeneGraphQuery(queryParams)
    const hasPendingFilterChanges = filters.length !== draftFilters.length || filters.some((filter, index) => {
        const draftFilter = draftFilters[index]

        if (!draftFilter) { return true }

        return filter.rootNodeId !== draftFilter.rootNodeId ||
            filter.threshold !== draftFilter.threshold ||
            filter.traversalMode !== draftFilter.traversalMode ||
            filter.maxLevels !== draftFilter.maxLevels
    })

    const handleExpandNode = (filter: GraphQueryFilter) => {
        setSelectedEdges([])
        setDraftFilters((prev) => {
            if (prev.some((item) => item.rootNodeId === filter.rootNodeId)) {
                setFilters(prev)
                return prev
            }

            const nextFilters = [
                ...prev,
                filter,
            ]

            setFilters(nextFilters)

            return nextFilters
        })
    }

    const handleUpdateFilter = (rootNodeId: string, partialFilter: Partial<GraphQueryFilter>) => {
        setDraftFilters((prev) => prev.map((filter) => {
            if (filter.rootNodeId !== rootNodeId) { return filter }

            return {
                ...filter,
                ...partialFilter,
            }
        }))
    }

    const handleRemoveFilter = (rootNodeId: string) => {
        setDraftFilters((prev) => prev.filter((filter, index) => index === 0 || filter.rootNodeId !== rootNodeId))
    }

    const handleClearExpansions = () => {
        setDraftFilters((prev) => {
            if (prev.length === 0) { return [DEFAULT_ROOT_FILTER] }

            return [prev[0]]
        })
    }

    const handleResetFilters = () => {
        setDraftFilters(filters.map((filter) => ({
            ...filter,
        })))
    }

    const handleApplyFilters = () => {
        setSelectedEdges([])
        setFilters(draftFilters)
    }

    return (
        <div style={{ display: 'grid', gap: 12 }}>
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
                    expandedNodeIds={filters.map((filter) => filter.rootNodeId)}
                    defaultExpansionFilter={defaultExpansionFilter}
                    onExpandNode={handleExpandNode}
                />
            )}

            {!loading && !error && data && (
                <ActiveGraphFiltersPanel
                    filters={draftFilters}
                    hasPendingChanges={hasPendingFilterChanges}
                    getNodeLabel={(nodeId) => data.nodes.find((node) => node.id === nodeId)?.label ?? nodeId}
                    onUpdateFilter={handleUpdateFilter}
                    onClearExpansions={handleClearExpansions}
                    onRemoveFilter={handleRemoveFilter}
                    onResetFilters={handleResetFilters}
                    onApplyFilters={handleApplyFilters}
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
                        traversalMode={filters[0]?.traversalMode ?? DEFAULT_ROOT_FILTER.traversalMode}
                        selectedRootNode={data.nodes.find((node) => node.id === data.rootNodeId)?.label ?? null}
                        maxLevels={filters[0]?.maxLevels ?? DEFAULT_ROOT_FILTER.maxLevels}
                        depthSummary={data.outgoingSummary}
                        incomingSummary={data.incomingSummary}
                    />
                </div>
            )}
        </div>
    )
}
