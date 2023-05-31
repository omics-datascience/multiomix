import React from 'react'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { Biomarker, InferenceExperimentForTable } from '../../types'
import { Button, Form, Icon, Table } from 'semantic-ui-react'
import { TableCellWithTitle } from '../../../common/TableCellWithTitle'
import { formatDateLocale } from '../../../../utils/util_functions'
import { BiomarkerStateLabel } from '../../BiomarkerStateLabel'
import { FitnessFunctionLabel } from '../../labels/FitnessFunctionLabel'

declare const urlBiomarkerInferenceExperiments: string

/** InferenceExperimentsTable props. */
interface InferenceExperimentsTableProps {
    /** Selected Biomarker instance to get its inference experiments. */
    selectedBiomarker: Biomarker,
    /** Callback to open the modal to add a new inference experiment analysis. */
    setOpenModalNewInferenceExperiment: (openModalNewInferenceExperiment: boolean) => void,
    /** Callback to open the modal with the results for a InferenceExperiment instance. */
    openInferenceResult: (inferenceExperiment: InferenceExperimentForTable) => void
}

/**
 * Renders a table with all the inference experiments for a specific Biomarker.
 * @param props Component props.
 * @returns Component.
 */
export const InferenceExperimentsTable = (props: InferenceExperimentsTableProps) => {
    return (
        <PaginatedTable<InferenceExperimentForTable>
            headerTitle='Inference experiments'
            headers={[
                { name: 'Name', serverCodeToSort: 'name', width: 3 },
                { name: 'Description', serverCodeToSort: 'description', width: 4 },
                { name: 'State', serverCodeToSort: 'state', textAlign: 'center' },
                { name: 'Model', serverCodeToSort: 'model', width: 1 },
                { name: 'Date', serverCodeToSort: 'created' },
                { name: 'Actions' }
            ]}
            queryParams={{ biomarker_pk: props.selectedBiomarker.id }}
            defaultSortProp={{ sortField: 'created', sortOrderAscendant: false }}
            showSearchInput
            searchLabel='Name'
            searchPlaceholder='Search by name or description'
            urlToRetrieveData={urlBiomarkerInferenceExperiments}
            customElements={[
                <Form.Field key={1} className='biomarkers--button--modal' title='New inference experiment'>
                    <Button primary icon onClick={() => { props.setOpenModalNewInferenceExperiment(true) }}>
                        <Icon name='add' />
                    </Button>
                </Form.Field>
            ]}
            updateWSKey='update_prediction_experiment'
            mapFunction={(inferenceExperiment: InferenceExperimentForTable) => {
                return (
                    <Table.Row key={inferenceExperiment.id as number}>
                        <TableCellWithTitle value={inferenceExperiment.name} />
                        <TableCellWithTitle value={inferenceExperiment.description ?? ''} />
                        <Table.Cell textAlign='center'>
                            {/* NOTE: inference experiments have the same states as Biomarker */}
                            <BiomarkerStateLabel biomarkerState={inferenceExperiment.state} />
                        </Table.Cell>
                        <Table.Cell><FitnessFunctionLabel fitnessFunction={inferenceExperiment.model} /></Table.Cell>
                        <TableCellWithTitle value={formatDateLocale(inferenceExperiment.created as string, 'LLL')} />
                        <Table.Cell width={1}>
                            <React.Fragment>
                                <Icon
                                    name='chart area'
                                    onClick={() => { props.openInferenceResult(inferenceExperiment) }}
                                    className='clickable'
                                    color='blue'
                                    title='See results'
                                />
                            </React.Fragment>
                        </Table.Cell>
                    </Table.Row>
                )
            }}
        />
    )
}
