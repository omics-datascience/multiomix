import React from 'react'
import { DifferentialExpressionAnalysis } from './types'
import { Icon, Modal, Tab, TabPane } from 'semantic-ui-react'
import { DifferentialExpressionModalResultsTableView } from './DifferentialExpressionModalResultsTableView'
import { DifferentialExpressionModalResultsVolcanoPlot } from './DifferentialExpressionModalResultsVolcanoPlot'

interface DifferentialExpressionModalResultsProps {
    /* Whether the results modal is open */
    isOpen: boolean
    /* Differential expression analysis results to display */
    differentialExpressionAnalysis: DifferentialExpressionAnalysis | null
    /* Callback to close the modal */
    closeModal: () => void
}

/* Differential expression results modal component */
export const DifferentialExpressionModalResults = (props: DifferentialExpressionModalResultsProps) => {
    /* Tab panes for results modal */
    const panes = [
        {
            menuItem: 'Table',
            render: () => (
                <TabPane>
                    <DifferentialExpressionModalResultsTableView differentialExpressionAnalysisId={props.differentialExpressionAnalysis?.id as number} />
                </TabPane>
            )
        },
        {
            menuItem: 'Volcano Plot',
            render: () => (
                <TabPane>
                    <DifferentialExpressionModalResultsVolcanoPlot differentialExpressionAnalysisId={props.differentialExpressionAnalysis?.id as number} />
                </TabPane>
            )
        },
    ]

    return (
        <Modal
            open={props.isOpen}
            closeIcon={<Icon name='close' size='large' />}
            closeOnEscape={false}
            closeOnDimmerClick={false}
            closeOnDocumentClick={false}
            className='space-modal large-modal'
            onClose={props.closeModal}
        >
            <>
                <Modal.Header>
                    Differential Expression Analysis Results - {props.differentialExpressionAnalysis?.name}
                </Modal.Header>
                <Modal.Content scrolling>
                    <Tab panes={panes} />
                </Modal.Content>
            </>
        </Modal>
    )
}
