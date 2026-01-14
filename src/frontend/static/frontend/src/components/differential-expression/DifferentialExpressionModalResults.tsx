import React, { useMemo } from 'react'
import { DifferentialExpressionAnalysis } from './types'
import { Icon, Modal, Tab, TabPane } from 'semantic-ui-react'
import { DifferentialExpressionModalResultsTableView } from './DifferentialExpressionModalResultsTableView'
import { DifferentialExpressionModalResultsVolcanoPlot } from './DifferentialExpressionModalResultsVolcanoPlot'

interface DifferentialExpressionModalResultsProps {
    isOpen: boolean
    differentialExpressionAnalysis: DifferentialExpressionAnalysis | null
    closeModal: () => void
}

export const DifferentialExpressionModalResults = (props: DifferentialExpressionModalResultsProps) => {
    const panes = useMemo(() => [
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
    ], [props.differentialExpressionAnalysis?.id])
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
