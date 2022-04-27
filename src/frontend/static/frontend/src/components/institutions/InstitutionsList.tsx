import React from 'react'
import { List, Icon } from 'semantic-ui-react'
import { DjangoInstitution } from '../../utils/django_interfaces'
import { Nullable } from '../../utils/interfaces'
import '../../css/institutions.css'

/**
 * Component's props
 */
interface InstitutionsListProps {
    /** List of institutions */
    institutions: DjangoInstitution[],
    /** Callback of 'Show users' button */
    showUsers: (institution: DjangoInstitution) => void
    /** Selected institution to highlight */
    selectedInstitution: Nullable<DjangoInstitution>
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
                <List.Item key={institution.id} className={props.selectedInstitution !== null && institution.id === props.selectedInstitution.id ? 'selected listItem' : 'listItem'}>
                    <List.Content floated='right'>
                        {/* Edit button */}
                        <Icon
                            name='users'
                            color='blue'
                            className='clickable institutionsShowUsersIcon'
                            title='Show users '
                            onClick={() => props.showUsers(institution)}
                        />
                    </List.Content>
                    <List.Content>
                        <List.Header className='institutionsHeader'>{institution.name}</List.Header>
                        <List.Description className='institutionsDescription'>
                            {institution.location}

                            {institution.email} {institution.telephone_number}
                        </List.Description>
                    </List.Content>
                </List.Item>
            ))}
        </List>
    )
}
