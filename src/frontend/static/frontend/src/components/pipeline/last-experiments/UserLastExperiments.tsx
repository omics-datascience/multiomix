import React from 'react'
import { DjangoExperiment, DjangoTag } from '../../../utils/django_interfaces'
import { Card, Label, DropdownMenuProps } from 'semantic-ui-react'
import { LastExperimentCard } from '../last-experiments/LastExperimentCard'
import { Nullable } from '../../../utils/interfaces'

interface UserLastExperimentsProps {
    experiments: DjangoExperiment[],
    gettingExperiments: boolean,
    experimentWhichIsSelectingTag: Nullable<DjangoExperiment>,
    tagOptions: DropdownMenuProps[],
    newTag: DjangoTag,
    addingTag: boolean,
    seeResult: (DjangoExperiment) => void,
    selectExperimentToAssignTag: (experiment: DjangoExperiment) => void,
    selectTagForLastExperiment: (selectedTagId: number, selectedExperiment: DjangoExperiment) => void,
    confirmExperimentDeletion: (DjangoExperiment) => void,
    handleAddTagInputsChange: (name: string, value: any) => void
    handleKeyDown: (e) => void
}

/**
 * Renders the panel where user can see his last N experiments (N configured in settings.py).
 * Renders the list of experiments, with its tag info, experiment type,
 * buttons to delete the experiment, etc
 * @param props Component's props
 * @returns Component
 */
export const UserLastExperiments = (props: UserLastExperimentsProps) => {
    const experimentsList = props.experiments.map((experiment) => {
        return (
            <LastExperimentCard
                key={experiment.id}
                experiment={experiment}
                seeResult={props.seeResult}
                experimentWhichIsSelectingTag={props.experimentWhichIsSelectingTag}
                selectExperimentToAssignTag={props.selectExperimentToAssignTag}
                tagOptions={props.tagOptions}
                selectTagForLastExperiment={props.selectTagForLastExperiment}
                confirmExperimentDeletion={props.confirmExperimentDeletion}
                newTag={props.newTag}
                addingTag={props.addingTag}
                handleKeyDown={props.handleKeyDown}
                handleAddTagInputsChange={props.handleAddTagInputsChange}
            />
        )
    })

    return (
        <div className="align-center">
            <Label className="margin-bottom-5 full-width" color="blue" size="large">Last analysis</Label>

            {/* Experiments list */}
            <Card.Group id='last-experiments-cards-group'>
                {experimentsList}
            </Card.Group>
        </div>
    )
}
