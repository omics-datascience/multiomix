import React from 'react'
import { Label } from 'semantic-ui-react'
import { SemanticCOLORS } from 'semantic-ui-react/dist/commonjs/generic'
import { DjangoUserFile } from '../../../utils/django_interfaces'

/**
 * Component's props
 */
interface UserFileTypeLabelProps {
    dataset: DjangoUserFile
}

/**
 * Renders a Label with UserFile type (private, institution, public, etc) information
 * @param props Component's props
 * @returns Component
 */
export const UserFileTypeLabel = (props: UserFileTypeLabelProps) => {
    const hasInstitutions = props.dataset.institutions.length > 0

    const typeTitle = hasInstitutions
        ? `Shared with ${props.dataset.institutions.length} institutions`
        : undefined

    let typeDescription: string
    let labelColor: SemanticCOLORS

    if (hasInstitutions) {
        typeDescription = props.dataset.institutions.map((institution) => institution.name).join(', ')
        labelColor = 'grey'
    } else {
        if (props.dataset.is_public) {
            typeDescription = 'Public'
            labelColor = 'blue'
        } else {
            typeDescription = 'Private'
            labelColor = 'red'
        }
    }

    return (
        <Label className='fluid' color={labelColor} title={typeTitle}>
            {typeDescription}
        </Label>
    )
}
