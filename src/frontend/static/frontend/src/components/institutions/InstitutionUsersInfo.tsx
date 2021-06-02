import React, { useContext } from 'react'
import { List, Icon, Header, Segment } from 'semantic-ui-react'
import { DjangoInstitution, DjangoUser } from '../../utils/django_interfaces'
import { Nullable } from '../../utils/interfaces'
import { CurrentUserContext } from '../Base'

/**
 * Component's props
 */
interface InstitutionUsersInfoProps {
    /** Selected Institution to show its users */
    selectedInstitution: Nullable<DjangoInstitution>,
    /** Callback to show a modal to remove an User from a the selected Institution */
    confirmFileDeletion: (institutionUser: DjangoUser) => void
}

/**
 * Renders an Institution's Users info and some extra functionality like
 * add a User to the Institution
 * @param props Component's props
 * @returns Component
 */
export const InstitutionUsersInfo = (props: InstitutionUsersInfoProps) => {
    const currentUser = useContext(CurrentUserContext)
    const selectedInstitution = props.selectedInstitution

    if (!selectedInstitution) {
        return null
    }

    return (
        <div>
            <Header textAlign="center">
                <Icon name='users' />
                <Header.Content>Users in {selectedInstitution.name}</Header.Content>
            </Header>

            <Segment>
                <List divided relaxed verticalAlign='middle'>
                    {selectedInstitution.users.map((institutionUser) => (
                        <List.Item key={institutionUser.username as string}>
                            <List.Content floated='right'>
                                {/* Remove from Institution button */}
                                {institutionUser.id !== currentUser?.id &&
                                    <Icon
                                        name='remove user'
                                        color='red'
                                        className='clickable'
                                        title='Remove user from institution '
                                        onClick={() => { props.confirmFileDeletion(institutionUser) }}
                                    />
                                }
                            </List.Content>
                            <List.Content>
                                <List.Header>{institutionUser.username}</List.Header>
                            </List.Content>
                        </List.Item>
                    ))}
                </List>
            </Segment>
        </div>
    )
}
