import React from 'react'
import { getStateObj, getExperimentTypeObj, getExperimentCorrelationMethodInfo, formatDateLocale } from '../../../utils/util_functions'
import { DjangoExperiment, ExperimentState } from '../../../utils/django_interfaces'
import { Table, Icon } from 'semantic-ui-react'
import { SeeResultButton } from './SeeResultButton'
import { DeleteExperimentButton } from './DeleteExperimentButton'
import { SourcePopup } from './SourcePopup'
import { TableCellWithTitle } from '../../common/TableCellWithTitle'
import { ClinicalSourcePopup } from './ClinicalSourcePopup'

declare const urlDownloadFullResult: string

/**
 * Component's props
 */
interface AllExperimentRowProps {
    experiment: DjangoExperiment,
    showPopup: boolean,
    openPopup: (experimentId: number) => void,
    closePopup: () => void,
    getAllUserExperiments: (retryIfNotFound?: boolean) => void,
    seeResult: (experiment: DjangoExperiment) => void,
    editExperiment: (experiment: DjangoExperiment) => void,
    confirmExperimentDeletion: (experiment: DjangoExperiment) => void
}

/**
 * Renders a row of the AllExperimentsView's table
 * @param props Component's props
 * @returns Component
 */
export const AllExperimentsRow = (props: AllExperimentRowProps) => {
    const experiment = props.experiment // For short

    // Generates Experiment's state info
    const experimentState = getStateObj(experiment.state)

    // Generates ExperimentType info
    const experimentTypeInfo = getExperimentTypeObj(experiment.type, 'ExperimentType')

    // Generates Experiment correlation method info
    const experimentCorrelationMethodInfo = getExperimentCorrelationMethodInfo(experiment.correlation_method)

    // Number of combinations
    const finalRowCount = experiment.result_final_row_count ?? '-'
    const evaluatedRowCount = experiment.evaluated_row_count ?? finalRowCount

    return (
        <Table.Row key={`${experiment.id}`}>
            <TableCellWithTitle value={experiment.name}/>
            <TableCellWithTitle value={experiment.description}/>
            <TableCellWithTitle value={formatDateLocale(experiment.submit_date, 'LLL')} />
            <Table.Cell>
                <Icon title={experimentState.title} name={experimentState.iconName} color={experimentState.color} loading={experimentState.loading}/>
            </Table.Cell>
            <Table.Cell>{experimentTypeInfo.description}</Table.Cell>
            <Table.Cell>{experimentCorrelationMethodInfo.description}</Table.Cell>
            <Table.Cell
                title={
                    `The result consists of ${finalRowCount} combinations obtained from a total of ${evaluatedRowCount} evaluated combinations`
                }
            >
                {finalRowCount} / {evaluatedRowCount}
            </Table.Cell>
            <Table.Cell>
                <ClinicalSourcePopup
                    experiment={props.experiment}
                    // It's not necessary to have survival tuples as user could want to link clinical data for CorrelationGraph
                    showOnlyClinicalDataWithSurvivalTuples={false}
                    showPopup={props.showPopup}
                    openPopup={props.openPopup}
                    closePopup={props.closePopup}
                    onSuccessCallback={props.getAllUserExperiments}
                />
            </Table.Cell>
            <Table.Cell>{experiment.tag ? experiment.tag.name : '-'}</Table.Cell>
            <Table.Cell>
                {/* Download mRNA */}
                <SourcePopup
                    source={experiment.mRNA_source}
                    iconName='file'
                    iconColor='blue'
                    downloadButtonTitle='Download source mRNA file'
                />

                {/* Download GEM file */}
                <SourcePopup
                    source={experiment.gem_source}
                    iconName='file alternate'
                    iconColor='teal'
                    downloadButtonTitle={`Download ${experimentTypeInfo.description} source file`}
                />
            </Table.Cell>
            <Table.Cell>
                {/* See results button */}
                <SeeResultButton experiment={experiment} seeResult={props.seeResult}/>

                {/* Download button */}
                <Icon
                    name='cloud download'
                    color='blue'
                    className='clickable margin-left-5'
                    title='Download result'
                    onClick={() => window.open(`${urlDownloadFullResult}/${props.experiment.id}`, '_blank')}
                    disabled={props.experiment.state !== ExperimentState.COMPLETED || !props.experiment.result_final_row_count}
                />

                {/* Edit button */}
                <Icon
                    name='pencil'
                    className='clickable margin-left-5'
                    color='yellow'
                    title='Edit'
                    onClick={() => props.editExperiment(experiment)}
                    disabled={experiment.state !== ExperimentState.COMPLETED}
                />

                {/* Delete button */}
                {/* TODO: remove this, is a temporal fix to prevent errors in server. A stop thread function should be implemented */}
                {!(experiment.state === ExperimentState.IN_PROCESS || experiment.state === ExperimentState.WAITING_FOR_QUEUE) &&
                    <DeleteExperimentButton experiment={experiment} onClick={() => props.confirmExperimentDeletion(experiment)}/>
                }
            </Table.Cell>
        </Table.Row>
    )
}
