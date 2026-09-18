import React, { useContext, useEffect, useRef, useState } from 'react'
import ky from 'ky'
import { CurrentUserContext } from '../Base'
import { SemanticListItem } from '../../utils/interfaces'
import { getDjangoHeader } from '../../utils/util_functions'
import { useIntl } from 'react-intl'
import { SharedInstitution, SharedInstitutionsModal } from '../common/SharedInstitutionsModal'

declare const urlGetUsersCandidatesLimitedBiomarker: string
declare const urlGetInstitutionsNonInExperimentBiomarker: string
declare const urlShareBiomarkerToInstitution: string
declare const urlGetSharedInstitutionBiomarker: string
declare const urlPostRemoveInstitutionBiomarker: string

export interface SharedInstitutionsBiomarkerPropsExtend {
    isOpen: boolean,
    institutions: { id: number, name: string }[],
    biomarkerId: number,
    isAdding: boolean,
    user: { id: number, username: string }
}
interface SharedInstitutionsBiomarkerProps extends SharedInstitutionsBiomarkerPropsExtend {
    handleClose: VoidFunction,
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => void,
}

/**
 * Modal that shows institutions shared to a biomarker
 * @param props Component props
 * @returns Component render
 */
export const SharedInstitutionsBiomarker = (props: SharedInstitutionsBiomarkerProps) => {
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

        const url = `${urlGetInstitutionsNonInExperimentBiomarker}/${props.biomarkerId}/`

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

        const url = `${urlGetSharedInstitutionBiomarker}/${props.biomarkerId}/`

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
                biomarkerId: props.biomarkerId
            }
            ky.post(urlShareBiomarkerToInstitution, { headers: myHeaders, signal: abortController.current.signal, json: body }).then((response) => {
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
        if (props.isOpen && props.biomarkerId) {
            setInstitutionIdToAdd(null)
            InstitutionsistNonInExperiment()
            usersListInstitution()
        }
    }, [props.biomarkerId, props.isOpen])

    const canManage = props.user.id === currentUser?.id
    const selectedInstitution: SharedInstitution | null = activeInstitution.id ? activeInstitution : null

    return (
        <SharedInstitutionsModal
            isOpen={props.isOpen}
            title={intl.formatMessage({ id: 'sharedInstitutionsBiomarker.header' })}
            selectPlaceholder={intl.formatMessage({ id: 'sharedInstitutionsBiomarker.selectPlaceholder' })}
            addButtonText={intl.formatMessage({ id: 'sharedInstitutionsBiomarker.addInstitution' })}
            availableInstitutions={listOfInstitutionNonPart}
            selectedInstitutionToAdd={institutionIdToAdd}
            sharedInstitutions={institutionList}
            selectedInstitution={selectedInstitution}
            usersUrl={urlGetUsersCandidatesLimitedBiomarker}
            usersHeaderTitle={(institutionName) => intl.formatMessage(
                { id: 'sharedInstitutionsBiomarker.users.title' },
                { institutionName }
            )}
            userNameLabel={intl.formatMessage({ id: 'sharedInstitutionsBiomarker.users.column' })}
            searchUserNamePlaceholder={intl.formatMessage({ id: 'sharedInstitutionsBiomarker.users.searchPlaceholder' })}
            removeInstitutionTitle={intl.formatMessage({ id: 'sharedInstitutionsBiomarker.removeInstitution' })}
            isLoading={isLoadingInstitution}
            canManage={canManage}
            onClose={props.handleClose}
            onInstitutionToAddChange={setInstitutionIdToAdd}
            onAddInstitution={() => props.handleChangeConfirmModalState(
                true,
                intl.formatMessage({ id: 'sharedInstitutionsBiomarker.confirm.share.header' }),
                intl.formatMessage({ id: 'sharedInstitutionsBiomarker.confirm.share.content' }),
                handleAddInstitution
            )}
            onSelectInstitution={setActiveInstitution}
            onRemoveInstitution={(institutionId) => props.handleChangeConfirmModalState(
                true,
                intl.formatMessage({ id: 'sharedInstitutionsBiomarker.confirm.stopShare.header' }),
                intl.formatMessage({ id: 'sharedInstitutionsBiomarker.confirm.stopShare.content' }),
                () => handleRemoveInstitution(institutionId)
            )}
        />
    )
}
