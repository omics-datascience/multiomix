import React, { useContext, useEffect, useRef, useState } from 'react'
import { Button, Divider, Grid, GridColumn, Icon, List, ListContent, ListHeader, ListItem, Modal, ModalContent, ModalHeader, Segment, Select, Table } from 'semantic-ui-react'
import { PaginatedTable } from '../../common/PaginatedTable'
import { DjangoInstitutionUserLimited } from '../../../utils/django_interfaces'
import { TableCellWithTitle } from '../../common/TableCellWithTitle'
import { getDjangoHeader } from '../../../utils/util_functions'
import ky from 'ky'
import { SemanticListItem } from '../../../utils/interfaces'
import { CurrentUserContext } from '../../Base'

declare const urlGetUsersCandidatesLimited: string
declare const urlGetInstitutionsNonInExperiment: string
declare const urlShareExperimentToInstitution: string
declare const urlGetSharedInstitution: string
declare const urlPostRemoveInstitution: string

export interface SharedInstitutionsProps {
    isOpen: boolean,
    institutions: { id: number, name: string }[],
    experimentId: number,
    isAdding: boolean,
    user: { id: number, username: string }
}
interface Props extends SharedInstitutionsProps {
    handleClose: VoidFunction,
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => void,
}

interface InstitutionUserListProps {
    institutionName: string,
    institutionId: number,
}

const InstitutionUserList = (props: InstitutionUserListProps) => {
    return (
        <div key={props.institutionId} style={{ padding: '0 1rem 0 0' }}>
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
        </div>
    )
}

export const SharedInstitutions = (props: Props) => {
    const [activeInstitution, setActiveInstitution] = useState<{ id: number, name: string }>({ id: 0, name: '' })
    const [listOfInstitutionNonPart, setListOfInstitutionNonPart] = useState<SemanticListItem[]>([])
    const [institutionIdToAdd, setInstitutionIdToAdd] = useState<number>(0)
    const abortController = useRef(new AbortController())
    const [institutionList, setInstitutionList] = useState<{ id: number, name: string }[]>([])
    const [isLoadingInstitution, setIsLoadingInstitution] = useState<boolean>(false)
    const currentUser = useContext(CurrentUserContext)

    /**
     * Function to search institutions that are not in experiment.
     */
    const InstitutionsistNonInExperiment = () => {
        const myHeaders = getDjangoHeader()

        const url = `${urlGetInstitutionsNonInExperiment}/${props.experimentId}/`

        ky.get(url, { headers: myHeaders, signal: abortController.current.signal }).then((response) => {
            response.json().then((jsonResponse: { id: number, name: string }[]) => {
                setListOfInstitutionNonPart(jsonResponse.map(institution => ({ key: institution.id.toString(), value: institution.id.toString(), text: institution.name })))
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting users ->', err)
        })
    }

    /**
     * Function to search institutions.
     */
    const usersListInstitution = () => {
        const myHeaders = getDjangoHeader()

        const url = `${urlGetSharedInstitution}/${props.experimentId}/`

        ky.get(url, { headers: myHeaders, signal: abortController.current.signal }).then((response) => {
            response.json().then((jsonResponse: { id: number, name: string }[]) => {
                setInstitutionList(jsonResponse)

                if (!(jsonResponse.map(item => item.id).includes(activeInstitution.id))) {
                    setActiveInstitution(jsonResponse.length ? jsonResponse[0] : { id: 0, name: '' })
                }
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting users ->', err)
        })
    }

    /**
     * Function to add institution to experiment.
     */
    const handleAddInstitution = () => {
        if (institutionIdToAdd) {
            setIsLoadingInstitution(true)
            const myHeaders = getDjangoHeader()
            const body = {
                institutionId: institutionIdToAdd,
                experimentId: props.experimentId
            }
            ky.post(urlShareExperimentToInstitution, { headers: myHeaders, signal: abortController.current.signal, json: body }).then((response) => {
                response.json().then(() => {
                    InstitutionsistNonInExperiment()
                    usersListInstitution()
                }).catch((err) => {
                    console.error('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                console.error('Error getting users ->', err)
            }).finally(() => setIsLoadingInstitution(false))
        }
    }

    /**
     * Remove a institution from shared
     * @param institutionId institution id to remove
     */
    const handleRemoveInstitution = (institutionId: number) => {
        setIsLoadingInstitution(true)
        const settings = {
            headers: getDjangoHeader(),
            json: {
                experimentId: props.experimentId,
                institutionId
            }
        }

        ky.post(urlPostRemoveInstitution, settings).then((response) => {
            response.json().then(() => {
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error removing institution ->', err)
        }).finally(() => {
            setIsLoadingInstitution(false)
            InstitutionsistNonInExperiment()
            usersListInstitution()
        })
    }

    useEffect(() => {
        if (props.experimentId) {
            InstitutionsistNonInExperiment()
            usersListInstitution()
        }
    }, [props.experimentId])

    return (
        <Modal
            onClose={() => props.handleClose()}
            open={props.isOpen}
            closeIcon={<Icon name='close' size='large' onClick={() => props.handleClose()} />}
            style={{ width: '80%' }}
        >
            <ModalHeader>Shared institutions</ModalHeader>
            <ModalContent>
                {
                    props.user.id === currentUser?.id &&
                    (
                        <>
                            <Select
                                placeholder='Select a institution to share'
                                options={listOfInstitutionNonPart}
                                value={institutionIdToAdd.toString()}
                                onChange={(_e, { value }) => setInstitutionIdToAdd(Number(value))}
                            />
                            <Button
                                className='margin-left-5'
                                disabled={!institutionIdToAdd || isLoadingInstitution}
                                onClick={() => props.handleChangeConfirmModalState(true, 'Share experiment', 'Are you sure to share experiment to institution?', handleAddInstitution)}
                            >
                                Add institution
                            </Button>
                        </>
                    )
                }

                <Segment>
                    <Grid columns={2}>
                        <GridColumn>
                            <List selection verticalAlign='middle'>
                                <div
                                    style={{
                                        maxHeight: '400px',
                                        overflowY: 'auto'
                                    }}
                                >
                                    {institutionList.map(institution => (
                                        <ListItem key={institution.id} active={activeInstitution.id === institution.id}>
                                            <div style={{ display: 'flex', alignContent: 'center', flexDirection: 'row' }}>
                                                <div style={{ flex: 1 }}>
                                                    <ListContent onClick={() => setActiveInstitution(institution)}>
                                                        <ListHeader>
                                                            {institution.name}
                                                        </ListHeader>
                                                    </ListContent>
                                                </div>
                                                {currentUser?.id === props.user.id &&
                                                    (
                                                        <Icon
                                                            name='trash'
                                                            className='clickable'
                                                            disabled={isLoadingInstitution}
                                                            color='red'
                                                            title='Remove institution'
                                                            onClick={() => props.handleChangeConfirmModalState(true, 'Stop sharing experiment', 'Are you sure to stop sharing experiment to this institution?', () => handleRemoveInstitution(institution.id))}
                                                        />
                                                    )
                                                }
                                            </div>
                                        </ListItem>
                                    ))}
                                </div>
                            </List>
                        </GridColumn>
                        <Divider vertical />
                        <GridColumn>
                            {
                                activeInstitution.id
                                    ? (
                                        <InstitutionUserList institutionName={activeInstitution.name} institutionId={activeInstitution.id} />
                                    )
                                    : null
                            }
                        </GridColumn>
                    </Grid>
                </Segment>
            </ModalContent>
        </Modal>
    )
}
