import React from 'react'
import { Label, SemanticCOLORS } from 'semantic-ui-react'
import { BiomarkerOrigin } from './types'

/** BiomarkerOriginLabel props. */
interface BiomarkerOriginLabelProps {
    /** Biomarker's origin. */
    biomarkerOrigin: BiomarkerOrigin
}

/**
 * Renders a Label for the Biomarker's origin
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerOriginLabel = (props: BiomarkerOriginLabelProps) => {
    let color: SemanticCOLORS
    let description: string

    switch (props.biomarkerOrigin) {
        case BiomarkerOrigin.MANUAL:
            color = 'blue'
            description = 'Manual'
            break
        case BiomarkerOrigin.FEATURE_SELECTION:
            color = 'olive'
            description = 'Feature Selection'
            break
        default:
            color = 'blue'
            description = ''
            break
    }

    return (
        <Label
            color={color}
            className='fluid align-center'
            title={description}
        >
            {description}
        </Label>
    )
}
