import React, { useMemo, useState } from 'react'
import { Loader, Message } from 'semantic-ui-react'
import { GeneRegulationFiltersPanel } from './GeneRegulationFiltersPanel'
import { GeneRegulationGraph } from './GeneRegulationGraph'
import { SelectedEdgesPanel } from './SelectedEdgesPanel'
import { TraversalSummaryPanel } from './TraversalSummaryPanel'
import { useGeneRegulationGraphQuery } from './useGeneRegulationGraphQuery'
import { GraphQueryFilter, SelectedEdgeInfo } from './types'

/** Props accepted by the gene regulation associations tab. */
interface GeneRegulationAssociationsPanelProps {
    /** Height assigned to the graph area. */
    height?: number | string;
    /** Width assigned to the graph area. */
    width?: number | string;
}

const DEFAULT_BRAF_GRAPH_FILTER: GraphQueryFilter = {
    rootNodeId: 'gene_braf',
    threshold: 0.5,
    traversalMode: 'both',
    maxLevels: 3,
}

/**
 * Renders the mock gene regulation associations experience for the selected biomarker molecule.
 * @param props Component props.
 * @param props.height Graph container height.
 * @param props.width Graph container width.
 * @returns The complete gene regulation associations tab.
 */
export const GeneRegulationAssociationsPanel = (props: GeneRegulationAssociationsPanelProps): JSX.Element => {
    const {
        height = 650,
        width = '100%',
    } = props
    const [selectedEdges, setSelectedEdges] = useState<SelectedEdgeInfo[]>([])
    const [appliedFilters, setAppliedFilters] = useState<GraphQueryFilter[]>([DEFAULT_BRAF_GRAPH_FILTER])
    const [editableFilters, setEditableFilters] = useState<GraphQueryFilter[]>([DEFAULT_BRAF_GRAPH_FILTER])

    const nextExpansionFilter = useMemo(() => ({
        threshold: editableFilters[0]?.threshold ?? DEFAULT_BRAF_GRAPH_FILTER.threshold,
        traversalMode: editableFilters[0]?.traversalMode ?? DEFAULT_BRAF_GRAPH_FILTER.traversalMode,
        maxLevels: editableFilters[0]?.maxLevels ?? DEFAULT_BRAF_GRAPH_FILTER.maxLevels,
    }), [editableFilters])

    const graphQueryParams = useMemo(() => ({
        filters: appliedFilters,
    }), [appliedFilters])

    const { data, loading, error } = useGeneRegulationGraphQuery(graphQueryParams)
    const hasPendingEditableFilterChanges = appliedFilters.length !== editableFilters.length || appliedFilters.some((filter, index) => {
        const editableFilter = editableFilters[index]

        if (!editableFilter) { return true }

        return filter.rootNodeId !== editableFilter.rootNodeId ||
            filter.threshold !== editableFilter.threshold ||
            filter.traversalMode !== editableFilter.traversalMode ||
            filter.maxLevels !== editableFilter.maxLevels
    })

    /**
     * Applies a node expansion immediately and keeps the editable state in sync.
     * @param filter Expansion filter created from the graph context menu.
     */
    const handleExpandGraphFromNode = (filter: GraphQueryFilter) => {
        setSelectedEdges([])
        setEditableFilters((prev) => {
            if (prev.some((item) => item.rootNodeId === filter.rootNodeId)) {
                setAppliedFilters(prev)
                return prev
            }

            const nextEditableFilters = [
                ...prev,
                filter,
            ]

            setAppliedFilters(nextEditableFilters)

            return nextEditableFilters
        })
    }

    /**
     * Stages the edition of a filter without applying the request yet.
     * @param rootNodeId Root node associated with the filter being edited.
     * @param partialFilter Partial values that should overwrite the current draft filter.
     */
    const handleEditableFilterUpdate = (rootNodeId: string, partialFilter: Partial<GraphQueryFilter>) => {
        setEditableFilters((prev) => prev.map((filter) => {
            if (filter.rootNodeId !== rootNodeId) { return filter }

            return {
                ...filter,
                ...partialFilter,
            }
        }))
    }

    /**
     * Removes an expansion from the editable request payload.
     * @param rootNodeId Root node identifier of the expansion to remove.
     */
    const handleEditableExpansionRemoval = (rootNodeId: string) => {
        setEditableFilters((prev) => prev.filter((filter, index) => index === 0 || filter.rootNodeId !== rootNodeId))
    }

    /** Keeps only the root filter in the editable request payload. */
    const handleEditableExpansionClear = () => {
        setEditableFilters((prev) => {
            if (prev.length === 0) { return [DEFAULT_BRAF_GRAPH_FILTER] }

            return [prev[0]]
        })
    }

    /** Restores the editable filters to the last filters applied to the graph. */
    const handleEditableFiltersReset = () => {
        setEditableFilters(appliedFilters.map((filter) => ({
            ...filter,
        })))
    }

    /** Applies the staged filters and triggers a new graph query. */
    const handleEditableFiltersApply = () => {
        setSelectedEdges([])
        setAppliedFilters(editableFilters)
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
                <GeneRegulationGraph
                    data={data}
                    height={height}
                    width={width}
                    selectedEdges={selectedEdges}
                    onSelectedEdgesChange={setSelectedEdges}
                    expandedNodeIds={appliedFilters.map((filter) => filter.rootNodeId)}
                    defaultExpansionFilter={nextExpansionFilter}
                    onExpandNode={handleExpandGraphFromNode}
                />
            )}

            {!loading && !error && data && (
                <GeneRegulationFiltersPanel
                    editableFilters={editableFilters}
                    hasPendingChanges={hasPendingEditableFilterChanges}
                    getNodeLabel={(nodeId) => data.nodes.find((node) => node.id === nodeId)?.label ?? nodeId}
                    onUpdateFilter={handleEditableFilterUpdate}
                    onClearExpansions={handleEditableExpansionClear}
                    onRemoveFilter={handleEditableExpansionRemoval}
                    onResetFilters={handleEditableFiltersReset}
                    onApplyFilters={handleEditableFiltersApply}
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
                        traversalMode={appliedFilters[0]?.traversalMode ?? DEFAULT_BRAF_GRAPH_FILTER.traversalMode}
                        selectedRootNode={data.nodes.find((node) => node.id === data.rootNodeId)?.label ?? null}
                        maxLevels={appliedFilters[0]?.maxLevels ?? DEFAULT_BRAF_GRAPH_FILTER.maxLevels}
                        depthSummary={data.outgoingSummary}
                        incomingSummary={data.incomingSummary}
                    />
                </div>
            )}
        </div>
    )
}
