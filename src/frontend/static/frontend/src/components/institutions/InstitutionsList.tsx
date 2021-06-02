import React from 'react'
import { List, Icon } from 'semantic-ui-react'
import { DjangoInstitution } from '../../utils/django_interfaces'

/**
 * Component's props
 */
interface InstitutionsListProps {
    /** List of institutions */
    institutions: DjangoInstitution[],
    /** Callback of 'Show users' button */
    showUsers: (institution: DjangoInstitution) => void
}

/**
 * Renders a list of Institutions the current User belongs to
 * @param props Component's props
 * @returns Component
 */
export const InstitutionsList = (props: InstitutionsListProps) => {
    return (
        <List className="margin-top-5" divided relaxed verticalAlign='middle'>
            {props.institutions.map((institution) => (
                <List.Item key={institution.id} >
                    <List.Content floated='right'>
                        {/* Edit button */}
                        <Icon
                            name='users'
                            color='blue'
                            className='clickable'
                            title='Show users '
                            onClick={() => props.showUsers(institution)}
                        />
                    </List.Content>
                    <List.Content>
                        <List.Header>{institution.name}</List.Header>
                        <List.Description>
                            {institution.location}

                            {institution.email} {institution.telephone_number}
                        </List.Description>
                    </List.Content>
                </List.Item>
            ))}
        </List>
    )
}
