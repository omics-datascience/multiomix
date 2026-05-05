import React from 'react'
import { Button, Dropdown, Icon, Label } from 'semantic-ui-react'
import { GraphQueryFilter, TraversalMode } from './types'

const traversalLabels: Record<TraversalMode, string> = {
    outgoing: 'Regulates',
    incoming: 'Regulated by',
    both: 'Both',
}

const traversalOptions = [
    { key: 'outgoing', value: 'outgoing', text: traversalLabels.outgoing },
    { key: 'incoming', value: 'incoming', text: traversalLabels.incoming },
    { key: 'both', value: 'both', text: traversalLabels.both },
]

/** Props accepted by the editable graph filters panel. */
interface GeneRegulationFiltersPanelProps {
    /** Draft filters currently being edited by the user. */
    editableFilters: GraphQueryFilter[];
    /** Indicates whether the draft differs from the last applied filters. */
    hasPendingChanges: boolean;
    /** Resolves the visible label for a node identifier. */
    getNodeLabel: (nodeId: string) => string;
    /** Updates one draft filter without querying the graph yet. */
    onUpdateFilter: (rootNodeId: string, partialFilter: Partial<GraphQueryFilter>) => void;
    /** Clears every expansion while keeping the root filter. */
    onClearExpansions: () => void;
    /** Removes a specific expansion from the draft filter list. */
    onRemoveFilter: (rootNodeId: string) => void;
    /** Restores the draft state from the last applied filters. */
    onResetFilters: () => void;
    /** Applies the draft filter list to the graph query. */
    onApplyFilters: () => void;
}

/**
 * Renders the editable list of filters used to build the graph request payload.
 * @param props Component props.
 * @param props.editableFilters Draft filters currently being edited in the UI.
 * @param props.hasPendingChanges Indicates whether the draft differs from the applied graph filters.
 * @param props.getNodeLabel Resolves the visible label for a graph node identifier.
 * @param props.onUpdateFilter Updates a single draft filter without querying the graph yet.
 * @param props.onClearExpansions Removes every draft expansion except for the root filter.
 * @param props.onRemoveFilter Removes a specific expansion from the draft request payload.
 * @param props.onResetFilters Restores the draft state from the last applied filters.
 * @param props.onApplyFilters Applies the current draft filters to the graph query.
 * @returns The editable filters panel rendered below the graph.
 */
export const GeneRegulationFiltersPanel = (props: GeneRegulationFiltersPanelProps): JSX.Element => {
    const {
        editableFilters,
        hasPendingChanges,
        getNodeLabel,
        onUpdateFilter,
        onClearExpansions,
        onRemoveFilter,
        onResetFilters,
        onApplyFilters,
    } = props

    return (
        <div
            style={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                background: '#ffffff',
                padding: 12,
                display: 'grid',
                gap: 12,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <div style={{ fontWeight: 700 }}>Active graph filters</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>
                        Edit filters here. Changes stay local until you click Filter. Reset restores the last applied state.
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
                {editableFilters.map((filter, index) => (
                    <div
                        key={filter.rootNodeId}
                        style={{
                            display: 'grid',
                            gap: 10,
                            border: '1px solid #e2e8f0',
                            borderRadius: 10,
                            background: index === 0 ? '#fff7ed' : '#f8fafc',
                            padding: 10,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 10,
                                flexWrap: 'wrap',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <strong>{getNodeLabel(filter.rootNodeId)}</strong>
                                <Label color={index === 0 ? 'orange' : 'blue'} size='tiny'>
                                    {index === 0 ? 'Initial root' : 'Expansion'}
                                </Label>
                            </div>

                            {index !== 0 && (
                                <Button
                                    type='button'
                                    size='mini'
                                    basic
                                    circular
                                    icon='close'
                                    onClick={() => onRemoveFilter(filter.rootNodeId)}
                                    title='Remove expansion'
                                />
                            )}
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(180px, 1fr) minmax(180px, 1fr) minmax(160px, auto)',
                                gap: 12,
                                alignItems: 'end',
                            }}
                        >
                            <div style={{ display: 'grid', gap: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#334155' }}>
                                    <span>Threshold</span>
                                    <strong>{filter.threshold.toFixed(1)}</strong>
                                </div>
                                <input
                                    type='range'
                                    min={0.1}
                                    max={0.9}
                                    step={0.1}
                                    value={filter.threshold}
                                    onChange={(event) => onUpdateFilter(filter.rootNodeId, {
                                        threshold: Number(Number(event.target.value).toFixed(1)),
                                    })}
                                />
                            </div>

                            <div style={{ display: 'grid', gap: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#334155' }}>
                                    <span>Depth</span>
                                    <strong>{filter.maxLevels}</strong>
                                </div>
                                <input
                                    type='range'
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={filter.maxLevels}
                                    onChange={(event) => onUpdateFilter(filter.rootNodeId, {
                                        maxLevels: Number(event.target.value),
                                    })}
                                />
                            </div>

                            <div style={{ display: 'grid', gap: 6 }}>
                                <span style={{ fontSize: 12, color: '#334155' }}>Regulation mode</span>
                                <Dropdown
                                    selection
                                    compact
                                    value={filter.traversalMode}
                                    options={traversalOptions}
                                    onChange={(_, data) => onUpdateFilter(filter.rootNodeId, {
                                        traversalMode: data.value as TraversalMode,
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    paddingTop: 4,
                    borderTop: '1px solid #e2e8f0',
                }}
            >
                <div>
                    <Button
                        size='small'
                        basic
                        color='red'
                        icon
                        labelPosition='left'
                        onClick={onClearExpansions}
                        disabled={editableFilters.length <= 1}
                    >
                        <Icon name='trash alternate outline' />
                        Clear expansions
                    </Button>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                        size='small'
                        basic
                        icon
                        labelPosition='left'
                        onClick={onResetFilters}
                        disabled={!hasPendingChanges}
                    >
                        <Icon name='undo' />
                        Reset to applied
                    </Button>

                    <Button
                        size='small'
                        primary
                        icon
                        labelPosition='left'
                        onClick={onApplyFilters}
                        disabled={!hasPendingChanges}
                    >
                        <Icon name='filter' />
                        Filter
                    </Button>
                </div>
            </div>
        </div>
    )
}
