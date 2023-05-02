import React from 'react'
import { Label, SemanticCOLORS } from 'semantic-ui-react'
import { FitnessFunction } from '../types'

/** FitnessFunctionLabel props. */
interface FitnessFunctionLabelProps {
    /** FitnessFunction value. */
    fitnessFunction: FitnessFunction,
    /** `fluid` prop of the Label component. Default `true`. */
    fluid?: boolean,
    /** className prop. */
    className?: string
}

/**
 * Renders a Label for the FitnessFunction enum.
 * @param props Component props.
 * @returns Component.
 */
export const FitnessFunctionLabel = (props: FitnessFunctionLabelProps) => {
    let color: SemanticCOLORS
    let description: string
    let title: string
    switch (props.fitnessFunction) {
        case FitnessFunction.CLUSTERING:
            color = 'olive'
            description = 'Clustering'
            title = description
            break
        case FitnessFunction.SVM:
            color = 'green'
            description = 'SVM'
            title = 'Survival SVM'
            break
        case FitnessFunction.RF:
            color = 'blue'
            description = 'RF'
            title = 'Random Forest'
            break
        default:
            color = 'blue'
            description = ''
            title = ''
            break
    }

    return (
        <Label
            color={color}
            className={`${props.className ?? ''} ${props.fluid !== false ? 'fluid' : ''} align-center`}
            title={title}
        >
            {description}
        </Label>
    )
}
