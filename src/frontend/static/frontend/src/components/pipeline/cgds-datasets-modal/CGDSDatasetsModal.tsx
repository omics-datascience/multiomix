import React, { useEffect, useState } from 'react'
import { Header, Modal, Button, Table, Icon } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoTissue, RowHeader } from '../../../utils/django_interfaces'
import { FileType, Nullable } from '../../../utils/interfaces'
import { formatDateLocale } from '../../../utils/util_functions'
import { PaginatedTable } from '../../common/PaginatedTable'
import { useIntl } from 'react-intl'
import ky from 'ky'
import { getTissueDropdownOptions, TissueLabels } from '../../common/TissueLabels'

declare const urlCGDSStudiesCRUD: string
declare const urlTissuesCRUD: string

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
    const intl = useIntl()
    const [tissues, setTissues] = useState<DjangoTissue[]>([])

    useEffect(() => {
        if (!props.showCGDSDatasetsModal) {
            return
        }

        ky.get(urlTissuesCRUD).then((response) => {
            response.json<DjangoTissue[]>().then(setTissues).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error getting tissues ->', err)
        })
    }, [props.showCGDSDatasetsModal])

    if (!props.showCGDSDatasetsModal) {
        return null
    }

    /**
     * Generates default table's headers
     * @returns Default object for table's headers
     */
    function getDefaultHeaders (): RowHeader<DjangoCGDSStudy>[] {
        const headersList: RowHeader<DjangoCGDSStudy>[] = [
            { name: intl.formatMessage({ id: 'common.name' }), serverCodeToSort: 'name' },
            { name: intl.formatMessage({ id: 'common.description' }), serverCodeToSort: 'description' },
            { name: 'Tissue' },
            { name: intl.formatMessage({ id: 'common.version' }), serverCodeToSort: 'version' },
            { name: intl.formatMessage({ id: 'sourcePopup.syncDate' }), serverCodeToSort: 'date_last_synchronization' },
            { name: intl.formatMessage({ id: 'cgdsDatasetsModal.studyInfo' }) }
        ]

        return headersList
    }

    return (
        <Modal size='fullscreen' open={props.showCGDSDatasetsModal} onClose={props.handleClose} centered={false}>
            <Header icon='cloud' content={intl.formatMessage({ id: 'cgdsDatasetsModal.title' })} />
            <Modal.Content className='align-center'>
                <PaginatedTable<DjangoCGDSStudy>
                    headers={getDefaultHeaders()}
                    showSearchInput
                    urlToRetrieveData={urlCGDSStudiesCRUD}
                    customFilters={[
                        { label: 'Tissue', keyForServer: 'tissues', defaultValue: '', placeholder: 'Select tissue', options: getTissueDropdownOptions(tissues), width: 3 },
                        { label: intl.formatMessage({ id: 'cgdsDatasetsModal.onlyLastVersion' }), keyForServer: 'only_last_version', defaultValue: true, type: 'checkbox' }
                    ]}
                    queryParams={{ file_type: props.selectingFileType }}
                    mapFunction={(CGDSStudy: DjangoCGDSStudy) => {
                        return (
                            <Table.Row
                                key={CGDSStudy.id as number}
                                className='clickable'
                                active={CGDSStudy.id === props.selectedStudy?.id}
                                onClick={() => props.markStudyAsSelected(CGDSStudy)}
                                onDoubleClick={() => props.selectStudy(CGDSStudy)}
                            >
                                <Table.Cell>{CGDSStudy.name}</Table.Cell>
                                <Table.Cell>{CGDSStudy.description}</Table.Cell>
                                <Table.Cell><TissueLabels tissues={CGDSStudy.tissues} tissueOptions={tissues} /></Table.Cell>
                                <Table.Cell>{CGDSStudy.version}</Table.Cell>
                                <Table.Cell collapsing>{CGDSStudy.date_last_synchronization
                                    ? formatDateLocale(CGDSStudy.date_last_synchronization)
                                    : '-'}
                                </Table.Cell>
                                <Table.Cell collapsing textAlign='center'>
                                    <Button
                                        basic
                                        color='blue'
                                        icon
                                        title={intl.formatMessage({ id: 'cgdsDatasetsModal.seeMoreInfo' })}
                                        className='borderless-button'
                                        as='a' href={CGDSStudy.url_study_info} target='_blank'
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
                    {intl.formatMessage({ id: 'common.cancel' })}
                </Button>

                <Button
                    color='green'
                    onClick={() => props.selectStudy(props.selectedStudy)}
                    disabled={props.selectedStudy === null}
                >
                    {intl.formatMessage({ id: 'common.confirm' })}
                </Button>
            </Modal.Actions>
        </Modal>
    )
}

export { CGDSDatasetsModal }
