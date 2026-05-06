import React from 'react'
import { Button, Icon } from 'semantic-ui-react'
import { SelectedEdgeInfo } from './types'

/** SelectedEdgesPanel props. */
interface SelectedEdgesPanelProps {
    /** Edges currently selected in the graph. */
    selectedEdges: SelectedEdgeInfo[];
    /** Callback used to deselect a single edge. */
    onRemoveEdge: (edgeId: string) => void;
    /** Callback used to clear the entire edge selection. */
    onClearAll: () => void;
}

/**
 * Lists the edges selected by the user and exposes quick cleanup actions.
 * @param props Component props.
 * @returns The selected edges panel rendered below the graph.
 */
export const SelectedEdgesPanel = (props: SelectedEdgesPanelProps): JSX.Element => {
    const {
        selectedEdges,
        onRemoveEdge,
        onClearAll,
    } = props
    return (
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
                <div style={{ fontWeight: 700 }}>Selected edges</div>

                <Button
                    size='small'
                    basic
                    color='red'
                    icon
                    labelPosition='left'
                    onClick={onClearAll}
                    disabled={selectedEdges.length === 0}
                >
                    <Icon name='trash alternate outline' />
                    Clear
                </Button>
            </div>

            {selectedEdges.length === 0
                ? (
                    <div style={{ color: '#64748b', fontSize: 13 }}>
                        Click multiple edges to inspect each correlation value.
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
                                        <strong>{edge.source}</strong> -&gt; <strong>{edge.target}</strong>
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
                                    onClick={() => onRemoveEdge(edge.id)}
                                    title='Deselect'
                                />
                            </div>
                        ))}
                    </div>
                )}
        </div>
    )
}
