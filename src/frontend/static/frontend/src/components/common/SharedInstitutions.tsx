import React from 'react'
import { Divider, Grid, GridColumn, Icon, List, ListContent, ListHeader, ListItem, Modal, ModalContent, ModalHeader, Segment, Table } from 'semantic-ui-react'
import { PaginatedTable } from './PaginatedTable'
import { DjangoInstitutionUserLimited } from '../../utils/django_interfaces'
import { TableCellWithTitle } from './TableCellWithTitle'

declare const urlGetUsersCandidatesLimited: string

export interface SharedInstitutionsProps {
    isOpen: boolean,
    institutions: [],
}
interface Props extends SharedInstitutionsProps {
    handleClose: VoidFunction
}

interface InstitutionUserListProps{
    institutionName: string,
    institutionId: number,
}
const InstitutionUserList = (props: InstitutionUserListProps) => {
    return (
        <>
            <PaginatedTable<DjangoInstitutionUserLimited>
                headerTitle={props.institutionName + ' users'}
                headers={[
                    { name: 'User name', serverCodeToSort: 'user__username' as any, width: 3 }
                ]}
                showSearchInput
                searchLabel='User name'
                searchPlaceholder='Search by User name'
                urlToRetrieveData={urlGetUsersCandidatesLimited + '/' + props.institutionId + '/'}
                updateWSKey='update_user_for_institution'
                mapFunction={(userCandidate: DjangoInstitutionUserLimited) => {
                    return (
                        <Table.Row key={userCandidate.user.id}>
                            <TableCellWithTitle value={userCandidate.user.username} />
                        </Table.Row>
                    )
                }}
            />
        </>
    )
}

export const SharedInstitutions = (props: Props) => {
    return (
        <Modal
            open={props.isOpen}
            closeIcon={<Icon name='close' size='large' onClick={() => props.handleClose()} />}
        >
            <ModalHeader>Select a Photo</ModalHeader>
            <ModalContent>

                <Segment>
                    <Grid columns={2} relaxed='very'>
                        <GridColumn>
                            <List selection verticalAlign='middle'>
                                <ListItem>
                                    <ListContent>
                                        <ListHeader>Helen</ListHeader>
                                    </ListContent>
                                </ListItem>
                            </List>
                        </GridColumn>
                        <Divider vertical />
                        <GridColumn>
                            <InstitutionUserList institutionName={'asd'} institutionId={4} />
                        </GridColumn>
                    </Grid>

                </Segment>
            </ModalContent>
        </Modal>
    )
}


