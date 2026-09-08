import React, { useContext, useEffect, useRef, useState } from 'react'
import { getDjangoHeader } from '../../../utils/util_functions'
import ky from 'ky'
import { SemanticListItem } from '../../../utils/interfaces'
import { CurrentUserContext } from '../../Base'
import { useIntl } from 'react-intl'
import { SharedInstitution, SharedInstitutionsModal } from '../../common/SharedInstitutionsModal'

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

export const SharedInstitutions = (props: Props) => {
    const [activeInstitution, setActiveInstitution] = useState<{ id: number, name: string }>({ id: 0, name: '' })
    const [listOfInstitutionNonPart, setListOfInstitutionNonPart] = useState<SemanticListItem[]>([])
    const [institutionIdToAdd, setInstitutionIdToAdd] = useState<string | null>(null)
    const abortController = useRef(new AbortController())
    const [institutionList, setInstitutionList] = useState<{ id: number, name: string }[]>([])
    const [isLoadingInstitution, setIsLoadingInstitution] = useState<boolean>(false)
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
            setInstitutionIdToAdd(null)
            InstitutionsistNonInExperiment()
            usersListInstitution()
        }
    }, [props.experimentId, props.isOpen])

    const canManage = props.user.id === currentUser?.id
    const selectedInstitution: SharedInstitution | null = activeInstitution.id ? activeInstitution : null

    return (
        <SharedInstitutionsModal
            isOpen={props.isOpen}
            title={intl.formatMessage({ id: 'sharedInstitutions.title' })}
            selectPlaceholder={intl.formatMessage({ id: 'sharedInstitutions.selectInstitution' })}
            addButtonText={intl.formatMessage({ id: 'sharedInstitutions.addInstitution' })}
            availableInstitutions={listOfInstitutionNonPart}
            selectedInstitutionToAdd={institutionIdToAdd}
            sharedInstitutions={institutionList}
            selectedInstitution={selectedInstitution}
            usersUrl={urlGetUsersCandidatesLimited}
            usersHeaderTitle={(institutionName) => `${institutionName} ${intl.formatMessage({ id: 'sharedInstitutions.users' })}`}
            userNameLabel={intl.formatMessage({ id: 'sharedInstitutions.userName' })}
            searchUserNamePlaceholder={intl.formatMessage({ id: 'sharedInstitutions.searchUserName' })}
            removeInstitutionTitle={intl.formatMessage({ id: 'sharedInstitutions.removeInstitution' })}
            isLoading={isLoadingInstitution}
            canManage={canManage}
            onClose={props.handleClose}
            onInstitutionToAddChange={setInstitutionIdToAdd}
            onAddInstitution={() => props.handleChangeConfirmModalState(
                true,
                intl.formatMessage({ id: 'sharedInstitutions.shareExperiment' }),
                intl.formatMessage({ id: 'sharedInstitutions.confirmShare' }),
                handleAddInstitution
            )}
            onSelectInstitution={setActiveInstitution}
            onRemoveInstitution={(institutionId) => props.handleChangeConfirmModalState(
                true,
                intl.formatMessage({ id: 'sharedInstitutions.stopSharing' }),
                intl.formatMessage({ id: 'sharedInstitutions.confirmStopSharing' }),
                () => handleRemoveInstitution(institutionId)
            )}
        />
    )
}
