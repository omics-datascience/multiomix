import React from 'react'
import { Card, Icon, Label, DropdownMenuProps } from 'semantic-ui-react'
import { DjangoExperiment, DjangoTag, ExperimentState } from '../../../utils/django_interfaces'
import { LastExperimentTypeAndMethodInfo } from './LastExperimentTypeAndMethodInfo'
import { LastExperimentTagInfo } from './LastExperimentTagInfo'
import { getExperimentStateObj, formatDateLocale } from '../../../utils/util_functions'
import { SeeResultButton } from '../all-experiments-view/SeeResultButton'
import { DeleteExperimentButton } from '../all-experiments-view/DeleteExperimentButton'
import { Nullable } from '../../../utils/interfaces'

/**
 * Component's props
 */
interface LastExperimentCardProps {
    experiment: DjangoExperiment,
    experimentWhichIsSelectingTag: Nullable<DjangoExperiment>,
    tagOptions: DropdownMenuProps[],
    newTag: DjangoTag,
    addingTag: boolean,
    seeResult: (experiment: DjangoExperiment) => void,
    selectTagForLastExperiment: (selectedTagId: number, selectedExperiment: DjangoExperiment) => void,
    confirmExperimentDeletion: (experiment: DjangoExperiment) => void,
    selectExperimentToAssignTag: (experiment: DjangoExperiment) => void,
    handleAddTagInputsChange: (name: string, value: any) => void
    handleKeyDown: (e) => void
}

/**
 * Renders a user experiment data in a Semantic UI Card in User's last experiments list
 * @param props Component's props
 * @returns Component
 */
export const LastExperimentCard = (props: LastExperimentCardProps) => {
    const experiment = props.experiment // For a short reference
    const experimentState = getExperimentStateObj(experiment.state)

    // If the result was truncated due to a larger size than the specified in settings.py, it alerts to the user
    let trunc_alert
    if (experiment.result_final_row_count !== experiment.result_total_row_count) {
        const truncTitle = `The result has been truncated due its size. Has ${experiment.result_total_row_count}, truncated to ${experiment.result_final_row_count}`
        trunc_alert = (
            <Card.Meta className="margin-top-2" title={truncTitle}>
                <Label color="red">Truncated</Label>
            </Card.Meta>
        )
    } else {
        trunc_alert = null
    }

    return (
        <Card fluid className="experiment-data-card">
            <Card.Content textAlign="left">
                <Card.Header className='experiment-data-card-header'>
                    <span title={experiment.name} className='last-experiment-name ellipsis'>
                        {experiment.name}
                    </span>

                    {/* Delete button */}
                    {/* TODO: remove this, is a temporal fix to prevent errors in server */}
                    {!(experiment.state === ExperimentState.IN_PROCESS || experiment.state === ExperimentState.WAITING_FOR_QUEUE) &&
                        <DeleteExperimentButton experiment={experiment} className='pull-right' onClick={() => props.confirmExperimentDeletion(experiment)} />
                    }

                    {/* See result button */}
                    <SeeResultButton experiment={experiment} seeResult={props.seeResult} className='pull-right'/>
                </Card.Header>
                <Card.Meta className='experiment-data-card-submit-date'>
                    {formatDateLocale(experiment.submit_date, 'L')}
                </Card.Meta>
                <Card.Meta title={experiment.description} className='experiment-data-card-description ellipsis'>
                    {experiment.description ? experiment.description : '-'}
                </Card.Meta>
                <Card.Meta title={experimentState.title}>
                    State: <Icon name={experimentState.iconName} color={experimentState.color} loading={experimentState.loading}/>
                </Card.Meta>

                {/* Truncated label */}
                {trunc_alert}

                {/* Type of the experiment */}
                <LastExperimentTypeAndMethodInfo
                    experimentType={props.experiment.type}
                    correlationMethod={props.experiment.correlation_method}
                />

                {/* Tag of the experiment */}
                <LastExperimentTagInfo
                    experiment={props.experiment}
                    experimentWhichIsSelectingTag={props.experimentWhichIsSelectingTag}
                    selectExperimentToAssignTag={props.selectExperimentToAssignTag}
                    tagOptions={props.tagOptions}
                    selectTag={props.selectTagForLastExperiment}
                    newTag={props.newTag}
                    addingTag={props.addingTag}
                    handleKeyDown={props.handleKeyDown}
                    handleAddTagInputsChange={props.handleAddTagInputsChange}
                />
            </Card.Content>
        </Card>
    )
}
