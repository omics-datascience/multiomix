import React from 'react'
import { Card, Label } from 'semantic-ui-react'
import { ExperimentType, CorrelationMethod } from '../../../utils/django_interfaces'
import { getExperimentTypeObj, getExperimentCorrelationMethodInfo } from '../../../utils/util_functions'

/**
 * Component's props
 */
interface LastExperimentTypeInfoProps {
    experimentType: ExperimentType,
    correlationMethod: CorrelationMethod
}

/**
 * Renders a Label with the type of the experiment (miRNA, CNA, Methylation, etc)
 * and a label with correlation method used (Spearman, Kendall, Pearson, etc)
 * @param props Component's props
 * @returns Component
 */
export const LastExperimentTypeAndMethodInfo = (props: LastExperimentTypeInfoProps) => {
    // Generates ExperimentType info
    const experimentTypeInfo = getExperimentTypeObj(props.experimentType, 'ExperimentType')

    // Generates Experiment correlation method info
    const experimentCorrelationMethodInfo = getExperimentCorrelationMethodInfo(props.correlationMethod)

    return (
        <Card.Meta className="margin-top-2">
            <Label color={experimentTypeInfo.color} size='tiny'>
                {experimentTypeInfo.description}
            </Label>
            <Label color={experimentCorrelationMethodInfo.color} size='tiny'>
                {experimentCorrelationMethodInfo.description}
            </Label>
        </Card.Meta>
    )
}
