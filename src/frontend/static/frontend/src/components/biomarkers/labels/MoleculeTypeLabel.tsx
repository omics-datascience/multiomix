import React from 'react'
import { Label, SemanticCOLORS } from 'semantic-ui-react'
import { MoleculeType } from '../../../utils/interfaces'

/** MoleculeTypeLabel props. */
interface MoleculeTypeLabelProps {
    /** MoleculeType value. */
    moleculeType: MoleculeType,
    /** `fluid` prop of the Label component. Default `true`. */
    fluid?: boolean,
    /** className prop. */
    className?: string
}

/**
 * Renders a Label for the MoleculeType enum.
 * @param props Component props.
 * @returns Component.
 */
export const MoleculeTypeLabel = (props: MoleculeTypeLabelProps) => {
    let color: SemanticCOLORS
    let description: string

    switch (props.moleculeType) {
        case MoleculeType.MRNA:
            color = 'blue'
            description = 'mRNA'
            break
        case MoleculeType.MIRNA:
            color = 'orange'
            description = 'miRNA'
            break
        case MoleculeType.CNA:
            color = 'yellow'
            description = 'CNA'
            break
        case MoleculeType.METHYLATION:
            color = 'olive'
            description = 'Methylation'
            break
        default:
            color = 'blue'
            description = ''
            break
    }

    return (
        <Label
            color={color}
            className={`${props.className ?? ''} ${props.fluid !== false ? 'fluid' : ''} align-center`}
        >
            {description}
        </Label>
    )
}
