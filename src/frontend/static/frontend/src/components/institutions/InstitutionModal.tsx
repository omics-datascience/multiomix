import React from 'react'
import {
    ModalHeader,
    ModalContent,
    Modal,
    Icon,
    Segment,
    Table
} from 'semantic-ui-react'
import { DjangoInstitution, DjangoUserCandidates } from '../../utils/django_interfaces'
import { Nullable } from '../../utils/interfaces'
import { PaginatedTable } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'

declare const urlGetUsersCandidates: string

export enum InstitutionModalActions {
  READ,
  EDIT,
}

export interface InstitutionModalState {
  isOpen: boolean,
  action: InstitutionModalActions
  institution: Nullable<DjangoInstitution>
}

interface Props extends InstitutionModalState {
  /* Close modal function */
  handleCloseModal: () => void;
}

/**
 *  Institution modal
 * @param {Props} props  Props for component
 * @returns Component
 */
export const InstitutionModal = (props: Props) => {
    return (
        <Modal
            onClose={props.handleCloseModal}
            open={props.isOpen && props.institution !== null}
            closeIcon={<Icon name='close' size='large' />}
        >
            <ModalHeader>{props.institution?.name}</ModalHeader>
            <ModalContent>
                <Segment>
                    <PaginatedTable<DjangoUserCandidates>
                        headerTitle={props.institution?.name + ' candidates'}
                        headers={[
                            { name: 'User name', serverCodeToSort: 'username', width: 3 },
                            { name: 'Email', serverCodeToSort: 'email', width: 1 }
                        ]}
                        defaultSortProp={{ sortField: 'upload_date', sortOrderAscendant: false }}
                        showSearchInput
                        searchLabel='User name'
                        searchPlaceholder='Search by User name'
                        urlToRetrieveData={urlGetUsersCandidates}
                        updateWSKey='user_for_institution'
                        mapFunction={(userCandidate: DjangoUserCandidates) => {
                            return (
                                <Table.Row key={userCandidate.id as number}>
                                    <TableCellWithTitle value={userCandidate.username} />
                                    <TableCellWithTitle value={userCandidate.email} />
                                    <Table.Cell width={1}>
                                        {/* Details button */}
                                        <Icon
                                            name='chart bar'
                                            className='clickable'
                                            color='blue'
                                            title='Details'
                                            onClick={() => { }}
                                        />

                                        {/* Edit button */}
                                        <Icon
                                            name='pencil'
                                            className='clickable margin-left-5'
                                            color={/* canEditMolecules ? */ 'yellow' /* : 'orange' */}
                                            title={`Edit`}
                                            onClick={() => { }}
                                        />
                                    </Table.Cell>
                                </Table.Row>
                            )
                        }}
                    />
                </Segment>
            </ModalContent>
        </Modal >
    )
}
