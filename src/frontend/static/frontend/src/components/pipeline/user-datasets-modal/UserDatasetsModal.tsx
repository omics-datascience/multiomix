import React, { useContext, useEffect, useState } from 'react'
import { Header, Modal, Button, DropdownItemProps, Table } from 'semantic-ui-react'
import { DjangoTissue, DjangoUserFile, RowHeader } from '../../../utils/django_interfaces'
import { FileType, Nullable } from '../../../utils/interfaces'
import { formatDateLocale, getFileTypeName } from '../../../utils/util_functions'
import { PaginatedTable, PaginationCustomFilter } from '../../common/PaginatedTable'
import { TagLabel } from '../../common/TagLabel'
import { UserFileTypeLabel } from './UserFileTypeLabel'
import { CurrentUserContext } from '../../Base'
import { useIntl } from 'react-intl'
import ky from 'ky'
import { getTissueDropdownOptions, TissueLabels } from '../../common/TissueLabels'

declare const urlUserFilesCRUD: string
declare const urlTissuesCRUD: string

/**
 * Component's props
 */
interface UserDatasetsModalProps {
    /** If true, opens the modal */
    showUserDatasetsModal: boolean,
    /** Object of selected file to mark it in the modal and enable the confirmation button */
    selectedFile: Nullable<DjangoUserFile>,
    /** Type of FileType being selected to show a little label (mRNA, miRNA, CNA, etc) */
    selectingFileType: FileType,
    /** List of Tags to filter */
    tagOptions: DropdownItemProps[],
    /** List of Institutions to filter */
    institutionsOptions: DropdownItemProps[],
    /** Flag to retrieve only clinical datasets with at least one survival tuple (if the file type is other than clinical, this parameter is ignores). By default false */
    showOnlyClinicalDataWithSurvivalTuples: boolean,
    /** Select File callback */
    selectFile: (file: Nullable<DjangoUserFile>) => void,
    /** Modal close callback */
    handleClose: () => void,
    /** Callback to mark as select a specific User's file */
    markFileAsSelected: (file: DjangoUserFile) => void
}

/**
 * Generates a modal with the User's datasets
 * @returns React Modal component
 * @param props Component's props
 */
const UserDatasetsModal = (props: UserDatasetsModalProps) => {
    const intl = useIntl()
    const currentUser = useContext(CurrentUserContext)
    const [tissues, setTissues] = useState<DjangoTissue[]>([])

    useEffect(() => {
        if (!props.showUserDatasetsModal) {
            return
        }

        ky.get(urlTissuesCRUD).then((response) => {
            response.json<DjangoTissue[]>().then(setTissues).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error getting tissues ->', err)
        })
    }, [props.showUserDatasetsModal])

    /**
     * Generates default table's headers
     * @returns Default object for table's headers
     */
    function getDefaultHeaders (): RowHeader<DjangoUserFile>[] {
        let headersList: RowHeader<DjangoUserFile>[] = [
            { name: intl.formatMessage({ id: 'common.name' }), serverCodeToSort: 'name', width: 4 },
            { name: intl.formatMessage({ id: 'common.description' }), serverCodeToSort: 'description', width: 6 }
        ]

        const isClinical = props.selectingFileType === FileType.CLINICAL

        if (isClinical) {
            headersList.push({ name: intl.formatMessage({ id: 'userDatasetsModal.numberOfSurvivalTuples' }), width: 1 })
        }

        const restOfHeaders: RowHeader<DjangoUserFile>[] = [
            { name: 'Tissue' },
            { name: intl.formatMessage({ id: 'userDatasetsModal.tag' }), serverCodeToSort: 'tag' },
            { name: intl.formatMessage({ id: 'userDatasetsModal.uploadDate' }), serverCodeToSort: 'upload_date' },
            { name: intl.formatMessage({ id: 'userDatasetsModal.visibility' }), serverCodeToSort: 'institutions' },
            { name: intl.formatMessage({ id: 'userDatasetsModal.uploadedBy' }), serverCodeToSort: 'user' }
        ]

        headersList = headersList.concat(restOfHeaders)

        return headersList
    }

    /**
     * Generates default table's Filters
     * @returns Default object for table's Filters
     */
    function getDefaultFilters (): PaginationCustomFilter[] {
        return [
            { label: intl.formatMessage({ id: 'userDatasetsModal.tag' }), keyForServer: 'tag', defaultValue: '', placeholder: intl.formatMessage({ id: 'userDatasetsModal.selectExistingTag' }), options: props.tagOptions },
            { label: 'Tissue', keyForServer: 'tissues', defaultValue: '', placeholder: 'Select tissue', options: getTissueDropdownOptions(tissues) },
            { label: intl.formatMessage({ id: 'userDatasetsModal.visibility' }), keyForServer: 'visibility', defaultValue: 'all', placeholder: intl.formatMessage({ id: 'userDatasetsModal.selectExistingTag' }), options: props.institutionsOptions }
        ]
    }

    if (!props.showUserDatasetsModal) {
        return null
    }

    const fileType = getFileTypeName(props.selectingFileType)

    const isClinical = props.selectingFileType === FileType.CLINICAL

    return (
        <Modal size='fullscreen' open={props.showUserDatasetsModal} onClose={props.handleClose} centered={false}>
            <Header icon='database' content={intl.formatMessage({ id: 'userDatasetsModal.selectDataset' }, { fileType })} />
            <Modal.Content className='align-center'>
                <PaginatedTable<DjangoUserFile>
                    headers={getDefaultHeaders()}
                    customFilters={getDefaultFilters()}
                    showSearchInput
                    urlToRetrieveData={urlUserFilesCRUD}
                    queryParams={{ file_type: props.selectingFileType, with_survival_only: props.showOnlyClinicalDataWithSurvivalTuples }}
                    mapFunction={(userFile: DjangoUserFile) => {
                        return (
                            <Table.Row
                                key={userFile.id as number}
                                className='clickable'
                                active={userFile.id === props.selectedFile?.id}
                                onClick={() => props.markFileAsSelected(userFile)}
                                onDoubleClick={() => props.selectFile(userFile)}
                            >
                                <Table.Cell>{userFile.name}</Table.Cell>
                                <Table.Cell>{userFile.description}</Table.Cell>
                                {isClinical &&
                                    <Table.Cell textAlign='center'>{userFile.survival_columns ? userFile.survival_columns.length : 0}</Table.Cell>}
                                <Table.Cell collapsing textAlign='center'>
                                    <TissueLabels tissues={userFile.tissues} tissueOptions={tissues} />
                                </Table.Cell>
                                <Table.Cell collapsing textAlign='center'>
                                    <TagLabel tag={userFile.tag} fluid />
                                </Table.Cell>
                                <Table.Cell collapsing>{userFile.upload_date ? formatDateLocale(userFile.upload_date) : '-'}</Table.Cell>
                                <Table.Cell collapsing textAlign='center'>
                                    <UserFileTypeLabel dataset={userFile} />
                                </Table.Cell>
                                <Table.Cell collapsing textAlign='center'>
                                    {userFile.user.id === currentUser?.id ? intl.formatMessage({ id: 'userDatasetsModal.you' }) : userFile.user.username}
                                </Table.Cell>
                            </Table.Row>
                        )
                    }}
                />
            </Modal.Content>

            {/* Cancel button */}
            <Modal.Actions>
                <Button onClick={props.handleClose}>
                    {intl.formatMessage({ id: 'common.cancel' })}
                </Button>

                <Button
                    color='green'
                    onClick={() => props.selectFile(props.selectedFile)}
                    disabled={props.selectedFile === null}
                >
                    {intl.formatMessage({ id: 'common.confirm' })}
                </Button>
            </Modal.Actions>
        </Modal>
    )
}

export { UserDatasetsModal }
