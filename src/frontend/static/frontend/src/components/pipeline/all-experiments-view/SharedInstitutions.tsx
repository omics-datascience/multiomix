import React, { useContext, useEffect, useRef, useState } from 'react'
import { Button, Icon, List, ListContent, ListHeader, ListItem, Modal, ModalContent, ModalHeader, Select, Tab, Table } from 'semantic-ui-react'
import { PaginatedTable } from '../../common/PaginatedTable'
import { DjangoInstitutionUserLimited } from '../../../utils/django_interfaces'
import { getDjangoHeader } from '../../../utils/util_functions'
import ky from 'ky'
import { SemanticListItem } from '../../../utils/interfaces'
import { CurrentUserContext } from '../../Base'
import { useIntl } from 'react-intl'
import '../../../css/shared-institutions.css'

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
    const intl = useIntl()
    return (
        <div key={props.institutionId} style={{ padding: '0 1rem 0 0' }}>
            <PaginatedTable<DjangoInstitutionUserLimited>
                key={props.institutionId}
                headerTitle={`${props.institutionName} ${intl.formatMessage({ id: 'sharedInstitutions.users' })}`}
                headers={[
                    { name: intl.formatMessage({ id: 'sharedInstitutions.userName' }), serverCodeToSort: 'user__username' as any, width: 3 }
                ]}
                showSearchInput
                searchLabel={intl.formatMessage({ id: 'sharedInstitutions.userName' })}
                searchPlaceholder={intl.formatMessage({ id: 'sharedInstitutions.searchUserName' })}
                urlToRetrieveData={urlGetUsersCandidatesLimited + '/' + props.institutionId + '/'}
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

export const SharedInstitutions = (props: Props) => {
    const [activeInstitution, setActiveInstitution] = useState<{ id: number, name: string }>({ id: 0, name: '' })
    const [listOfInstitutionNonPart, setListOfInstitutionNonPart] = useState<SemanticListItem[]>([])
    const [institutionIdToAdd, setInstitutionIdToAdd] = useState<string | null>(null)
    const abortController = useRef(new AbortController())
    const [institutionList, setInstitutionList] = useState<{ id: number, name: string }[]>([])
    const [isLoadingInstitution, setIsLoadingInstitution] = useState<boolean>(false)
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0)
    const currentUser = useContext(CurrentUserContext)
    const intl = useIntl()

    /**
     * Function to search institutions that are not in experiment.
     */
    const InstitutionsistNonInExperiment = () => {
        const myHeaders = getDjangoHeader()

        const url = `${urlGetInstitutionsNonInExperiment}/${props.experimentId}/`

        ky.get(url, { headers: myHeaders, signal: abortController.current.signal }).then((response) => {
            response.json<{ id: number, name: string }[]>().then((jsonResponse) => {
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
            response.json<{ id: number, name: string }[]>().then((jsonResponse) => {
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
                institutionId: Number(institutionIdToAdd),
                experimentId: props.experimentId
            }
            ky.post(urlShareExperimentToInstitution, { headers: myHeaders, signal: abortController.current.signal, json: body }).then((response) => {
                response.json().then(() => {
                    setInstitutionIdToAdd(null)
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
        if (props.isOpen && props.experimentId) {
            setActiveTabIndex(0)
            setInstitutionIdToAdd(null)
            InstitutionsistNonInExperiment()
            usersListInstitution()
        }
    }, [props.experimentId, props.isOpen])

    const canManage = props.user.id === currentUser?.id
    const panes = [
        {
            menuItem: intl.formatMessage({ id: 'sharedInstitutions.institutions' }),
            render: () => (
                <Tab.Pane className='shared-institutions-tab-pane'>
                    <List celled selection size='large' verticalAlign='middle'>
                        <div
                            style={{
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}
                        >
                            {institutionList.map(institution => (
                                <ListItem
                                    key={institution.id}
                                    active={activeInstitution.id === institution.id}
                                    style={{ display: 'flex', alignItems: 'center' }}
                                >
                                    <Icon name='building' color='blue' />
                                    <ListContent
                                        style={{ flex: 1 }}
                                        onClick={() => {
                                            setActiveInstitution(institution)
                                            setActiveTabIndex(1)
                                        }}
                                    >
                                        <ListHeader>{institution.name}</ListHeader>
                                    </ListContent>
                                    {canManage && (
                                        <Icon
                                            name='trash'
                                            className='clickable'
                                            disabled={isLoadingInstitution}
                                            color='red'
                                            title={intl.formatMessage({ id: 'sharedInstitutions.removeInstitution' })}
                                            onClick={() => props.handleChangeConfirmModalState(
                                                true,
                                                intl.formatMessage({ id: 'sharedInstitutions.stopSharing' }),
                                                intl.formatMessage({ id: 'sharedInstitutions.confirmStopSharing' }),
                                                () => handleRemoveInstitution(institution.id)
                                            )}
                                        />
                                    )}
                                </ListItem>
                            ))}
                        </div>
                    </List>
                </Tab.Pane>
            )
        },
        {
            menuItem: intl.formatMessage({ id: 'sharedInstitutions.users' }),
            render: () => (
                <Tab.Pane className='shared-institutions-tab-pane'>
                    {activeInstitution.id
                        ? (
                            <InstitutionUserList
                                institutionName={activeInstitution.name}
                                institutionId={activeInstitution.id}
                            />
                        )
                        : null}
                </Tab.Pane>
            )
        }
    ]

    return (
        <Modal
            onClose={() => props.handleClose()}
            open={props.isOpen}
            closeIcon={<Icon name='close' size='large' onClick={() => props.handleClose()} />}
            style={{ width: '50%', maxWidth: '800px' }}
        >
            <ModalHeader>{intl.formatMessage({ id: 'sharedInstitutions.title' })}</ModalHeader>
            <ModalContent>
                {
                    canManage &&
                    (
                        <>
                            <Select
                                placeholder={intl.formatMessage({ id: 'sharedInstitutions.selectInstitution' })}
                                options={listOfInstitutionNonPart}
                                value={institutionIdToAdd ?? ''}
                                clearable
                                onChange={(_e, { value }) => setInstitutionIdToAdd(value ? String(value) : null)}
                            />
                            <Button
                                className='margin-left-5'
                                disabled={!institutionIdToAdd || isLoadingInstitution}
                                onClick={() => props.handleChangeConfirmModalState(true, intl.formatMessage({ id: 'sharedInstitutions.shareExperiment' }), intl.formatMessage({ id: 'sharedInstitutions.confirmShare' }), handleAddInstitution)}
                            >
                                {intl.formatMessage({ id: 'sharedInstitutions.addInstitution' })}
                            </Button>
                        </>
                    )
                }

                <Tab
                    activeIndex={activeTabIndex}
                    onTabChange={(_event, data) => setActiveTabIndex(Number(data.activeIndex))}
                    panes={panes}
                    renderActiveOnly
                />
            </ModalContent>
        </Modal>
    )
}
