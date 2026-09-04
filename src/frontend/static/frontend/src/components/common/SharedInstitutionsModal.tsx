import React, { ReactNode } from 'react'
import { Button, Grid, GridColumn, Icon, List, ListContent, ListHeader, ListItem, Modal, ModalContent, ModalHeader, Segment, Select, Table } from 'semantic-ui-react'
import { DjangoInstitutionUserLimited } from '../../utils/django_interfaces'
import { SemanticListItem } from '../../utils/interfaces'
import { PaginatedTable } from './PaginatedTable'
import '../../css/shared-institutions.css'

export interface SharedInstitution {
    id: number,
    name: string
}

interface SharedInstitutionsModalProps {
    isOpen: boolean,
    title: ReactNode,
    selectPlaceholder: string,
    addButtonText: string,
    availableInstitutions: SemanticListItem[],
    selectedInstitutionToAdd: string | null,
    sharedInstitutions: SharedInstitution[],
    selectedInstitution: SharedInstitution | null,
    usersUrl: string,
    usersHeaderTitle: (institutionName: string) => string,
    userNameLabel: string,
    searchUserNamePlaceholder: string,
    removeInstitutionTitle: string,
    isLoading: boolean,
    canManage: boolean,
    onClose: VoidFunction,
    onInstitutionToAddChange: (value: string | null) => void,
    onAddInstitution: VoidFunction,
    onSelectInstitution: (institution: SharedInstitution) => void,
    onRemoveInstitution: (institutionId: number) => void,
}

interface InstitutionUserListProps {
    institutionName: string,
    institutionId: number,
    usersUrl: string,
    usersHeaderTitle: (institutionName: string) => string,
    userNameLabel: string,
    searchUserNamePlaceholder: string,
}

const InstitutionUserList = (props: InstitutionUserListProps) => {
    return (
        <div key={props.institutionId} className='shared-institutions-users'>
            <PaginatedTable<DjangoInstitutionUserLimited>
                key={props.institutionId}
                headerTitle={props.usersHeaderTitle(props.institutionName)}
                headers={[
                    { name: props.userNameLabel, serverCodeToSort: 'user__username' as any, width: 3 }
                ]}
                showSearchInput
                searchLabel={props.userNameLabel}
                searchPlaceholder={props.searchUserNamePlaceholder}
                urlToRetrieveData={`${props.usersUrl}/${props.institutionId}/`}
                updateWSKey='update_user_for_institution'
                mapFunction={(userCandidate: DjangoInstitutionUserLimited) => {
                    return (
                        <Table.Row key={userCandidate.user.id}>
                            <Table.Cell>
                                <Icon name='user' color='blue' />
                                {userCandidate.user.username}
                            </Table.Cell>
                        </Table.Row>
                    )
                }}
            />
        </div>
    )
}

export const SharedInstitutionsModal = (props: SharedInstitutionsModalProps) => {
    return (
        <Modal
            onClose={props.onClose}
            open={props.isOpen}
            closeIcon={<Icon name='close' size='large' onClick={props.onClose} />}
            style={{ width: '70%', maxWidth: '1100px' }}
        >
            <ModalHeader>{props.title}</ModalHeader>
            <ModalContent>
                {props.canManage && (
                    <div className='shared-institutions-controls'>
                        <Select
                            fluid
                            placeholder={props.selectPlaceholder}
                            options={props.availableInstitutions}
                            value={props.selectedInstitutionToAdd ?? ''}
                            clearable
                            onChange={(_event, { value }) => props.onInstitutionToAddChange(value ? String(value) : null)}
                        />
                        <Button
                            disabled={!props.selectedInstitutionToAdd || props.isLoading}
                            onClick={props.onAddInstitution}
                        >
                            {props.addButtonText}
                        </Button>
                    </div>
                )}

                <Segment className='shared-institutions-panel'>
                    <Grid columns={2} stackable>
                        <GridColumn width={5}>
                            <List selection verticalAlign='middle' className='shared-institutions-list'>
                                <div
                                    className='list shared-institutions-items'
                                    style={{
                                        maxHeight: '400px',
                                        overflowY: 'auto'
                                    }}
                                >
                                    {props.sharedInstitutions.map(institution => (
                                        <ListItem
                                            key={institution.id}
                                            active={props.selectedInstitution?.id === institution.id}
                                            className='shared-institutions-item'
                                            onClick={() => props.onSelectInstitution(institution)}
                                        >
                                            <div className='shared-institutions-item-content'>
                                                <Icon name='building' color='blue' />
                                                <ListContent>
                                                    <ListHeader>{institution.name}</ListHeader>
                                                </ListContent>
                                                {props.canManage && (
                                                    <Icon
                                                        name='trash'
                                                        className='clickable'
                                                        disabled={props.isLoading}
                                                        color='red'
                                                        title={props.removeInstitutionTitle}
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            props.onRemoveInstitution(institution.id)
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </ListItem>
                                    ))}
                                </div>
                            </List>
                        </GridColumn>
                        <GridColumn width={11} className='shared-institutions-users-column'>
                            {props.selectedInstitution
                                ? (
                                    <InstitutionUserList
                                        institutionName={props.selectedInstitution.name}
                                        institutionId={props.selectedInstitution.id}
                                        usersUrl={props.usersUrl}
                                        usersHeaderTitle={props.usersHeaderTitle}
                                        userNameLabel={props.userNameLabel}
                                        searchUserNamePlaceholder={props.searchUserNamePlaceholder}
                                    />
                                )
                                : null}
                        </GridColumn>
                    </Grid>
                </Segment>
            </ModalContent>
        </Modal>
    )
}
