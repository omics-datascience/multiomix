import React from 'react'
import { DifferentialExpressionAnalysis } from './types'
import { Icon, Modal, Tab, TabPane } from 'semantic-ui-react'
import { DifferentialExpressionModalResultsTableView } from './DifferentialExpressionModalResultsTableView'
import { DifferentialExpressionModalResultsVolcanoPlot } from './DifferentialExpressionModalResultsVolcanoPlot'
import { useIntl } from 'react-intl'

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
    const intl = useIntl()
    /* Tab panes for results modal */
    const panes = [
        {
            menuItem: intl.formatMessage({ id: 'common.table' }),
            render: () => (
                <TabPane>
                    <DifferentialExpressionModalResultsTableView differentialExpressionAnalysisId={props.differentialExpressionAnalysis?.id as number} />
                </TabPane>
            )
        },
        {
            menuItem: intl.formatMessage({ id: 'differentialExpressionModalResults.tab.volcanoPlot' }),
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
                    {intl.formatMessage({ id: 'differentialExpressionModalResults.header' }, { name: props.differentialExpressionAnalysis?.name })}
                </Modal.Header>
                <Modal.Content scrolling>
                    <Tab panes={panes} />
                </Modal.Content>
            </>
        </Modal>
    )
}
