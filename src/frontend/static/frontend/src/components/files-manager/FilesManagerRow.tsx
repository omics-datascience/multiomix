import React from 'react'
import { formatDateLocale, getFileTypeName } from '../../utils/util_functions'
import { DjangoUserFile } from '../../utils/django_interfaces'
import { Table, Icon } from 'semantic-ui-react'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { TagLabel } from '../common/TagLabel'

declare const downloadFileURL: string

/**
 * Component's props
 */
interface FilesManagerRowProps {
    file: DjangoUserFile,
    confirmFileDeletion: (file: DjangoUserFile) => void,
    editCallback: (file: DjangoUserFile) => void
}

/**
 * Renders a row of the FilesManagerView's table
 * @param props Component's props
 * @returns Component
 */
export const FilesManagerRow = (props: FilesManagerRowProps) => {
    const file = props.file // For short

    // Generates Experiment's state info
    // const experimentState = getStateObj(experiment.state)

    // const isFinished = !(experiment.state === ExperimentState.IN_PROCESS ||
    //     experiment.state === ExperimentState.WAITING_FOR_QUEUE ||
    //     experiment.state === ExperimentState.STOPPING)

    // Generates ExperimentType info
    // const experimentTypeInfo = getExperimentTypeObj(experiment.type, 'ExperimentType')

    // Generates Experiment correlation method info
    // const experimentCorrelationMethodInfo = getExperimentCorrelationMethodInfo(experiment.correlation_method)

    // // Number of combinations
    // const finalRowCount = experiment.result_final_row_count ?? '-'
    // const evaluatedRowCount = experiment.evaluated_row_count ?? finalRowCount

    const canEditOrDelete = file.is_private_or_institution_admin
    const institutionsNames = file.institutions.map((institution) => institution.name).join(', ')

    return (
        <Table.Row key={`${file.id}`}>
            <TableCellWithTitle value={file.name}/>
            <TableCellWithTitle value={file.description !== null ? file.description : 'No description'}/>
            <Table.Cell>{getFileTypeName(file.file_type)}</Table.Cell>
            <TableCellWithTitle value={formatDateLocale(file.upload_date as string, 'LLL')} />
            <Table.Cell>
                {props.file.institutions.length > 0 &&
                        <Icon
                            name='building'
                            size='large'
                            title={`This dataset is shared with ${institutionsNames}`}
                        />
                }
            </Table.Cell>
            <Table.Cell><TagLabel tag={props.file.tag}/></Table.Cell>
            <Table.Cell>
                {/* Shows a download button if specified */}
                <Icon
                    name='cloud download'
                    color='blue'
                    className='clickable margin-left-5'
                    title='Download result'
                    onClick={() => window.open(`${downloadFileURL}${file.id}`, '_blank')}
                />

                {/* Users can modify or delete own files or the ones which belongs to an
                Institution which the user is admin of */}
                {canEditOrDelete &&
                    <React.Fragment>
                        {/* Shows a edit button if specified */}
                        <Icon
                            name='pencil'
                            className='clickable margin-left-5'
                            color='yellow'
                            title='Edit'
                            onClick={() => props.editCallback(props.file)}
                        />

                        {/* Shows a delete button if specified */}
                        <Icon
                            name='trash'
                            className='clickable margin-left-5'
                            color='red'
                            title='Delete experiment'
                            onClick={() => props.confirmFileDeletion(props.file)}
                        />
                    </React.Fragment>
                }

                {/* Extra information: */}
                <Icon
                    name='info'
                    className='margin-left-2'
                    color='blue'
                    title={`The column "${file.column_used_as_index}" will be used as index`}
                />

                {/* NaNs warning */}
                {file.contains_nan_values &&
                    <Icon
                        name='warning sign'
                        className='margin-left-2'
                        color='yellow'
                        title='The dataset contains NaN values'
                    />
                }
            </Table.Cell>
        </Table.Row>
    )
}
