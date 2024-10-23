import React from 'react'
import { Label, SemanticCOLORS } from 'semantic-ui-react'
import { ClusteringAlgorithm } from '../types'

/** ClusteringAlgorithmLabel props. */
interface ClusteringAlgorithmLabelProps {
    /** ClusteringAlgorithm value. */
    clusteringAlgorithm: ClusteringAlgorithm,
    /** className prop. */
    className?: string
}

/**
 * Renders a Label for the ClusteringAlgorithm enum.
 * @param props Component props.
 * @returns Component.
 */
export const ClusteringAlgorithmLabel = (props: ClusteringAlgorithmLabelProps) => {
    let color: SemanticCOLORS
    let description: string

    switch (props.clusteringAlgorithm) {
        case ClusteringAlgorithm.K_MEANS:
            color = 'green'
            description = 'KMeans'
            break
        case ClusteringAlgorithm.SPECTRAL:
            color = 'blue'
            description = 'Spectral'
            break
        case ClusteringAlgorithm.BK_MEANS:
            color = 'blue'
            description = 'Bisecting KMeans'
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
