import React, { useState } from 'react'
import { PaginatedTable } from '../../common/PaginatedTable'
import { Button, Form, Icon, Modal, Table } from 'semantic-ui-react'
import { TableCellWithTitle } from '../../common/TableCellWithTitle'
import { ClusterLabelsSet } from '../../biomarkers/types'
import { NewClusterLabelsSetModal } from './NewClusterLabelsSetModal'
import { useIntl } from 'react-intl'

declare const urlClusterLabelsSetsPaginated: string

/** ClusterLabelsSetsModal props. */
interface ClusterLabelsSetsModalProps {
    /** TrainedModel primary key. */
    trainedModelPk: number,
    /** Modal's open prop. */
    isOpen: boolean,
    closeModal: () => void
}

/**
 * Renders a paginated table to select/CRUD a ClusterLabelsSet instance.
 * @param props Component props.
 * @returns Component.
 */
export const ClusterLabelsSetsModal = (props: ClusterLabelsSetsModalProps) => {
    const [showNewClusterLabelsSet, setShowNewClusterLabelsSet] = useState(false)
    const intl = useIntl()
    // TODO: show this in the TrainedModels page

    return (
        <>
            {/* New ClusterLabelsSet modal */}
            <NewClusterLabelsSetModal
                showNewClusterLabelsSet={showNewClusterLabelsSet}
                setShowNewClusterLabelsSet={setShowNewClusterLabelsSet}
                trainedModelPk={props.trainedModelPk}
            />

            {/* ClusterLabelsSets table */}
            <Modal
                className='large-modal'
                closeIcon={<Icon name='close' size='large' />}
                closeOnEscape={false}
                centered={false}
                closeOnDimmerClick={false}
                closeOnDocumentClick={false}
                onClose={props.closeModal}
                open={props.isOpen}
            >
                <Modal.Header>
                    <Icon name='braille' />
                    {intl.formatMessage({ id: 'clusterLabelsSetsModal.header' })}
                </Modal.Header>
                <Modal.Content>
                    <PaginatedTable<ClusterLabelsSet>
                        headerTitle={intl.formatMessage({ id: 'clusterLabelsSetsModal.header' })}
                        headers={[
                            { name: intl.formatMessage({ id: 'common.name' }), serverCodeToSort: 'name', width: 3 },
                            { name: intl.formatMessage({ id: 'common.description' }), serverCodeToSort: 'description', width: 4 },
                            { name: intl.formatMessage({ id: 'common.actions' }) }
                        ]}
                        queryParams={{ trained_model_pk: props.trainedModelPk }}
                        customElements={[
                            <Form.Field key={1} className='custom-table-field' title={intl.formatMessage({ id: 'clusterLabelsSetsModal.newClusterModel' })}>
                                <Button primary icon onClick={() => { setShowNewClusterLabelsSet(true) }}>
                                    <Icon name='add' />
                                </Button>
                            </Form.Field>
                        ]}
                        showSearchInput
                        searchLabel={intl.formatMessage({ id: 'common.name' })}
                        searchPlaceholder={intl.formatMessage({ id: 'clusterLabelsSetsModal.searchPlaceholder' })}
                        urlToRetrieveData={urlClusterLabelsSetsPaginated}
                        // updateWSKey='update_trained_models' // TODO: implement
                        mapFunction={(clusterLabelsSet: ClusterLabelsSet) => {
                            return (
                                <Table.Row key={clusterLabelsSet.id as number}>
                                    <TableCellWithTitle value={clusterLabelsSet.name} />
                                    <TableCellWithTitle value={clusterLabelsSet.description ?? ''} />
                                    <Table.Cell width={1}>
                                        {/* Edit button */}
                                        {/* TODO: implement */}
                                        {/* <Icon
                                            name='pencil'
                                            color='yellow'
                                            className='clickable'
                                            title={intl.formatMessage({ id: 'common.edit' })}
                                            // onClick={() => setShowNewClusterLabelsSet(clusterLabelsSet)}
                                        /> */}
                                    </Table.Cell>
                                </Table.Row>
                            )
                        }}
                    />
                </Modal.Content>
            </Modal>
        </>
    )
}
