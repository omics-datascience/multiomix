import React, { useContext, useEffect, useRef, useState } from 'react'
import ky from 'ky'
import { CurrentUserContext } from '../Base'
import { SemanticListItem } from '../../utils/interfaces'
import { getDjangoHeader } from '../../utils/util_functions'
import { useIntl } from 'react-intl'
import { SharedInstitution, SharedInstitutionsModal } from '../common/SharedInstitutionsModal'

declare const urlGetInstitutionsNonInUserFile: string
declare const urlGetUsersCandidatesLimited: string
declare const urlShareUserFileToInstitution: string
declare const urlGetSharedInstitutionUserFile: string
declare const urlPostRemoveInstitutionUserFile: string

interface Props {
    isOpen: boolean,
    userFileId: number,
    user: { id: number, username: string },
    handleClose: VoidFunction,
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => void,
    onInstitutionsChange: (institutions: SharedInstitution[]) => void
}

/**
 * Manage the institutions with which a dataset is shared.
 * @param props Component props.
 * @returns Dataset sharing modal.
 */
export const SharedInstitutionsUserFile = (props: Props) => {
    const currentUser = useContext(CurrentUserContext)
    const intl = useIntl()
    const abortController = useRef(new AbortController())
    const [availableInstitutions, setAvailableInstitutions] = useState<SemanticListItem[]>([])
    const [sharedInstitutions, setSharedInstitutions] = useState<SharedInstitution[]>([])
    const [institutionIdToAdd, setInstitutionIdToAdd] = useState<string | null>(null)
    const [activeInstitution, setActiveInstitution] = useState<SharedInstitution | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    /** Fetches the institutions available for sharing and those already shared. */
    const loadInstitutions = () => {
        if (!props.userFileId) {
            return
        }

        const headers = getDjangoHeader()
        const availableUrl = `${urlGetInstitutionsNonInUserFile}${props.userFileId}/`
        const sharedUrl = `${urlGetSharedInstitutionUserFile}${props.userFileId}/`

        Promise.all([
            ky.get(availableUrl, { headers, signal: abortController.current.signal }).json<SharedInstitution[]>(),
            ky.get(sharedUrl, { headers, signal: abortController.current.signal }).json<SharedInstitution[]>()
        ]).then(([available, shared]) => {
            setAvailableInstitutions(available.map(institution => ({
                key: institution.id.toString(),
                value: institution.id.toString(),
                text: institution.name
            })))
            setSharedInstitutions(shared)
            props.onInstitutionsChange(shared)

            setInstitutionIdToAdd(null)

            if (!shared.some(institution => institution.id === activeInstitution?.id)) {
                setActiveInstitution(shared[0] ?? null)
            }
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                console.error('Error getting dataset institutions ->', err)
            }
        })
    }

    /** Shares the dataset with the selected institution after confirmation. */
    const handleAddInstitution = () => {
        if (!institutionIdToAdd) {
            return
        }

        setIsLoading(true)
        ky.post(urlShareUserFileToInstitution, {
            headers: getDjangoHeader(),
            signal: abortController.current.signal,
            json: {
                institutionId: Number(institutionIdToAdd),
                userFileId: props.userFileId
            }
        }).then(() => loadInstitutions())
            .catch((err) => console.error('Error sharing dataset with institution ->', err))
            .finally(() => setIsLoading(false))
    }

    /**
     * Removes the dataset sharing association with an institution after confirmation.
     * @param institutionId Institution to remove from the shared dataset.
     */
    const handleRemoveInstitution = (institutionId: number) => {
        setIsLoading(true)
        ky.post(urlPostRemoveInstitutionUserFile, {
            headers: getDjangoHeader(),
            signal: abortController.current.signal,
            json: {
                institutionId,
                userFileId: props.userFileId
            }
        }).then(() => loadInstitutions())
            .catch((err) => console.error('Error removing dataset institution ->', err))
            .finally(() => setIsLoading(false))
    }

    useEffect(() => {
        if (props.isOpen) {
            loadInstitutions()
        }
    }, [props.isOpen, props.userFileId])

    useEffect(() => () => abortController.current.abort(), [])

    const canManage = currentUser?.id === props.user.id

    return (
        <SharedInstitutionsModal
            isOpen={props.isOpen}
            title={intl.formatMessage({ id: 'files.manager.sharedInstitutions.title' })}
            selectPlaceholder={intl.formatMessage({ id: 'files.manager.sharedInstitutions.select' })}
            addButtonText={intl.formatMessage({ id: 'files.manager.sharedInstitutions.add' })}
            availableInstitutions={availableInstitutions}
            selectedInstitutionToAdd={institutionIdToAdd}
            sharedInstitutions={sharedInstitutions}
            selectedInstitution={activeInstitution}
            usersUrl={urlGetUsersCandidatesLimited}
            usersHeaderTitle={(institutionName) => `${institutionName} ${intl.formatMessage({ id: 'sharedInstitutions.users' })}`}
            userNameLabel={intl.formatMessage({ id: 'sharedInstitutions.userName' })}
            searchUserNamePlaceholder={intl.formatMessage({ id: 'sharedInstitutions.searchUserName' })}
            removeInstitutionTitle={intl.formatMessage({ id: 'files.manager.sharedInstitutions.remove' })}
            isLoading={isLoading}
            canManage={canManage}
            onClose={props.handleClose}
            onInstitutionToAddChange={setInstitutionIdToAdd}
            onAddInstitution={() => props.handleChangeConfirmModalState(
                true,
                intl.formatMessage({ id: 'files.manager.sharedInstitutions.addTitle' }),
                intl.formatMessage({ id: 'files.manager.sharedInstitutions.addConfirm' }),
                handleAddInstitution
            )}
            onSelectInstitution={setActiveInstitution}
            onRemoveInstitution={(institutionId) => props.handleChangeConfirmModalState(
                true,
                intl.formatMessage({ id: 'files.manager.sharedInstitutions.removeTitle' }),
                intl.formatMessage({ id: 'files.manager.sharedInstitutions.removeConfirm' }),
                () => handleRemoveInstitution(institutionId)
            )}
        />
    )
}
