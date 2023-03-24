import React from 'react'
import { Header, Modal, Button, Table, Icon } from 'semantic-ui-react'
import { DjangoCGDSStudy, RowHeader } from '../../../utils/django_interfaces'
import { FileType, Nullable } from '../../../utils/interfaces'
import { formatDateLocale } from '../../../utils/util_functions'
import { PaginatedTable } from '../../common/PaginatedTable'

declare const urlCGDSStudiesCRUD: string

/**
 * Component's props
 */
interface CGDSDatasetsModalProps {
    /** If true, opens the modal */
    showCGDSDatasetsModal: boolean,
    /** Type of FileType being selected to show a little label (mRNA, miRNA, CNA, etc) */
    selectingFileType: FileType,
    /** Object of selected file to mark it in the modal and enable the confirmation button */
    selectedStudy: Nullable<DjangoCGDSStudy>,
    /** Select Study callback */
    selectStudy: (study: Nullable<DjangoCGDSStudy>) => void,
    /** Modal close callback */
    handleClose: () => void,
    /** Callback to mark as select a specific Study */
    markStudyAsSelected: (study: DjangoCGDSStudy) => void,
}

/**
 * Generates a modal with the User's datasets
 * @param props Component's props
 * @returns React Modal component
 */
const CGDSDatasetsModal = (props: CGDSDatasetsModalProps) => {
    if (!props.showCGDSDatasetsModal) {
        return null
    }

    /**
     * Generates default table's headers
     * @returns Default object for table's headers
     */
    function getDefaultHeaders (): RowHeader<DjangoCGDSStudy>[] {
        const headersList: RowHeader<DjangoCGDSStudy>[] = [
            { name: 'Name', serverCodeToSort: 'name' },
            { name: 'Description', serverCodeToSort: 'description' },
            { name: 'Sync. Date', serverCodeToSort: 'date_last_synchronization' },
            { name: 'Study info' }
        ]

        return headersList
    }

    return (
        <Modal size='fullscreen' open={props.showCGDSDatasetsModal} onClose={props.handleClose} centered={false}>
            <Header icon='cloud' content='Select dataset from cBioPortal'/>
            <Modal.Content className='align-center'>
                <PaginatedTable<DjangoCGDSStudy>
                    headers={getDefaultHeaders()}
                    showSearchInput
                    urlToRetrieveData={urlCGDSStudiesCRUD}
                    queryParams={ { file_type: props.selectingFileType } }
                    mapFunction={(CGDSStudy: DjangoCGDSStudy) => {
                        return (
                            <Table.Row key={CGDSStudy.id as number}
                                className="clickable"
                                active={CGDSStudy.id === props.selectedStudy?.id}
                                onClick={() => props.markStudyAsSelected(CGDSStudy)}
                                onDoubleClick={() => props.selectStudy(CGDSStudy)}
                            >
                                <Table.Cell>{CGDSStudy.name}</Table.Cell>
                                <Table.Cell>{CGDSStudy.description}</Table.Cell>
                                <Table.Cell collapsing>{CGDSStudy.date_last_synchronization
                                    ? formatDateLocale(CGDSStudy.date_last_synchronization)
                                    : '-'}</Table.Cell>
                                <Table.Cell collapsing textAlign='center'>
                                    <Button
                                        basic
                                        color="blue"
                                        icon
                                        title="See more info"
                                        className="borderless-button"
                                        as='a' href={CGDSStudy.url_study_info} target="_blank"
                                        disabled={!CGDSStudy.url_study_info}
                                    >
                                        <Icon name='info circle' />
                                    </Button>
                                </Table.Cell>
                            </Table.Row>
                        )
                    }}
                />
            </Modal.Content>

            {/* Cancel button */}
            <Modal.Actions>
                <Button onClick={props.handleClose}>
                    Cancel
                </Button>

                <Button
                    color="green"
                    onClick={() => props.selectStudy(props.selectedStudy)}
                    disabled={props.selectedStudy === null}
                >
                    Confirm
                </Button>
            </Modal.Actions>
        </Modal>
    )
}

export { CGDSDatasetsModal }
