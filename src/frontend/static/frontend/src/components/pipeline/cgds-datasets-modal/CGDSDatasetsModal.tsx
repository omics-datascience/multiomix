import React from 'react'
import { Header, Modal, Button, Form } from 'semantic-ui-react'
import { DjangoCGDSStudy } from '../../../utils/django_interfaces'
import { GeneralTableControl, Nullable } from '../../../utils/interfaces'
import { getDefaultPageSizeOption } from '../../../utils/util_functions'
import { CGDSStudiesTable } from './CGDSStudiesTable'
import { DatasetType } from '../SourceForm'

/**
 * Component's props
 */
interface CGDSDatasetsModalProps {
    studies: DjangoCGDSStudy[],
    showCGDSDatasetsModal: boolean,
    /** TableControl for filter, sorting and pagination */
    tableControl: GeneralTableControl,
    /* TODO: remove if unused */
    gettingDatasets: boolean,
    selectedStudy: Nullable<DjangoCGDSStudy>,
    /** Callback to handle TableControl changes */
    handleTableControlChanges: (field: string, value, resetPagination?: boolean) => void,
    selectStudy: (study: Nullable<DjangoCGDSStudy>) => void,
    handleClose: () => void,
    markStudyAsSelected: (study: DjangoCGDSStudy) => void,
    /** Callback to handle TableControl changes */
    handleSort: (headerServerCodeToSort: string, datasetType: DatasetType) => void
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

    const selectPageSizeOptions = getDefaultPageSizeOption()

    return (
        <Modal size='fullscreen' open={props.showCGDSDatasetsModal} onClose={props.handleClose} centered={false}>
            <Header icon='cloud' content='Select dataset from cBioPortal'/>
            <Modal.Content className='align-center'>
                {/* Search Form */}
                <Form>
                    <Form.Group>
                        {/* Name/Description search */}
                        <Form.Input
                            width={5}
                            icon='search' iconPosition='left'
                            label='Name/Description'
                            placeholder='Search by name/description'
                            name='textFilter'
                            value={props.tableControl.textFilter}
                            onChange={(_, { name, value }) => props.handleTableControlChanges(name, value)}
                        />

                        {/* Page size */}
                        <Form.Select
                            fluid
                            width={2}
                            label='Entries'
                            options={selectPageSizeOptions}
                            name='pageSize'
                            value={props.tableControl.pageSize}
                            onChange={(_, { name, value }) => props.handleTableControlChanges(name, value)}
                        />
                    </Form.Group>
                </Form>

                {/* Datasets table */}
                <CGDSStudiesTable
                    studies={props.studies}
                    selectedStudy={props.selectedStudy as DjangoCGDSStudy}
                    tableControl={props.tableControl}
                    handleSort={props.handleSort}
                    markStudyAsSelected={props.markStudyAsSelected}
                    handleTableControlChanges={props.handleTableControlChanges}
                    selectStudy={props.selectStudy}
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
