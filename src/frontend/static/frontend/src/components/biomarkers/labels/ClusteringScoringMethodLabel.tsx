import React from 'react'
import { Label, SemanticCOLORS } from 'semantic-ui-react'
import { ClusteringScoringMethod } from '../types'

/** ClusteringScoringMethodLabel props. */
interface ClusteringScoringMethodLabelProps {
    /** ClusteringScoringMethod value. */
    scoreMethod: ClusteringScoringMethod,
    /** className prop. */
    className?: string
}

/**
 * Renders a Label for the ClusteringScoringMethod enum.
 * @param props Component props.
 * @returns Component.
 */
export const ClusteringScoringMethodLabel = (props: ClusteringScoringMethodLabelProps) => {
    let color: SemanticCOLORS
    let description: string
    switch (props.scoreMethod) {
        case ClusteringScoringMethod.C_INDEX:
            color = 'green'
            description = 'C-Index'
            break
        case ClusteringScoringMethod.LOG_LIKELIHOOD:
            color = 'blue'
            description = 'Log Likelihood'
            break
        default:
            color = 'blue'
            description = ''
            break
    }

    return (
        <Label color={color} className={`align-center ${props.className ?? ''}`}>
            {description}
        </Label>
    )
}
