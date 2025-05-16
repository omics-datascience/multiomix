import React, { useContext, useEffect, useRef, useState } from 'react'
import { Button, Divider, Grid, GridColumn, Icon, List, ListContent, ListHeader, ListItem, Modal, ModalContent, ModalHeader, Segment, Select, Table } from 'semantic-ui-react'
import ky from 'ky'
import { DjangoInstitutionUserLimited } from '../../utils/django_interfaces'
import { PaginatedTable } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { CurrentUserContext } from '../Base'
import { SemanticListItem } from '../../utils/interfaces'
import { getDjangoHeader } from '../../utils/util_functions'

declare const urlGetUsersCandidatesLimitedBiomarker: string
declare const urlGetInstitutionsNonInExperimentBiomarker: string
declare const urlShareBiomarkerToInstitution: string
declare const urlGetSharedInstitutionBiomarker: string
declare const urlPostRemoveInstitutionBiomarker: string

export interface SharedInstitutionsBiomarkerProps {
    isOpen: boolean,
    institutions: { id: number, name: string }[],
    biomarkerId: number,
    isAdding: boolean,
    user: { id: number, username: string }
}
interface Props extends SharedInstitutionsBiomarkerProps {
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
                urlToRetrieveData={urlGetUsersCandidatesLimitedBiomarker + '/' + props.institutionId + '/'}
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

export const SharedInstitutionsBiomarker = (props: Props) => {
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

        const url = `${urlGetInstitutionsNonInExperimentBiomarker}/${props.biomarkerId}/`

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

        const url = `${urlGetSharedInstitutionBiomarker}/${props.biomarkerId}/`

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
                biomarkerId: props.biomarkerId
            }
            ky.post(urlShareBiomarkerToInstitution, { headers: myHeaders, signal: abortController.current.signal, json: body }).then((response) => {
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
                biomarkerId: props.biomarkerId,
                institutionId
            }
        }

        ky.post(urlPostRemoveInstitutionBiomarker, settings).then((response) => {
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
        if (props.biomarkerId) {
            InstitutionsistNonInExperiment()
            usersListInstitution()
        }
    }, [props.biomarkerId])

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
                                onClick={() => props.handleChangeConfirmModalState(true, 'Share experiment', 'Are you sure to share biomarker to institution?', handleAddInstitution)}
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
                                                    )}
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
