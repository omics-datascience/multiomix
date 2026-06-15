import React from 'react'
import { Label } from 'semantic-ui-react'
import { SemanticCOLORS } from 'semantic-ui-react/dist/commonjs/generic'
import { DjangoUserFile } from '../../../utils/django_interfaces'
import { useIntl } from 'react-intl'

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
    const intl = useIntl()
    const hasInstitutions = props.dataset.institutions.length > 0

    const typeTitle = hasInstitutions
        ? intl.formatMessage({ id: 'userFileTypeLabel.sharedWithInstitutions' }, { count: props.dataset.institutions.length })
        : undefined

    let typeDescription: string
    let labelColor: SemanticCOLORS

    if (hasInstitutions) {
        typeDescription = props.dataset.institutions.map((institution) => institution.name).join(', ')
        labelColor = 'grey'
    } else {
        if (props.dataset.is_public) {
            typeDescription = intl.formatMessage({ id: 'userFileTypeLabel.public' })
            labelColor = 'blue'
        } else {
            typeDescription = intl.formatMessage({ id: 'userFileTypeLabel.private' })
            labelColor = 'red'
        }
    }

    return (
        <Label className='fluid' color={labelColor} title={typeTitle}>
            {typeDescription}
        </Label>
    )
}
