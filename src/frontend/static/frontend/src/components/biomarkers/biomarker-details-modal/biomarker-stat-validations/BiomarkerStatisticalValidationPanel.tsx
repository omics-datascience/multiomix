import React, { useState } from 'react'
import { StatisticalValidationsTable } from './StatisticalValidationsTable'
import { Biomarker, StatisticalValidationForTable } from '../../types'
import { Header, Icon, Modal } from 'semantic-ui-react'
import { NewStatisticalValidationModal } from './NewStatisticalValidationModal'
import { Nullable } from '../../../../utils/interfaces'
import { StatisticalValidationResultModal } from './result/StatisticalValidationResultModal'

/** BiomarkerStatisticalValidationPanel props. */
interface BiomarkerStatisticalValidationPanelProps {
    /** Selected Biomarker instance to get its statistical validations. */
    selectedBiomarker: Biomarker
}

/**
 * Renders a panel to make statistical validations for a specific Biomarker.
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerStatisticalValidationPanel = (props: BiomarkerStatisticalValidationPanelProps) => {
    const [openModalNewStatValidation, setOpenModalNewStatValidation] = useState(false)
    const [openModalResultStatValidation, setOpenModalResultStatValidation] = useState(false)
    const [selectedStatisticalValidation, setSelectedTrainedModel] = useState<Nullable<StatisticalValidationForTable>>(null)

    /**
     * Opens the modal with the results for a StatisticalValidation instance.
     * @param statisticalValidation StatisticalValidationForTable instance
     */
    const openStatResult = (statisticalValidation: StatisticalValidationForTable) => {
        setSelectedTrainedModel(statisticalValidation)
        setOpenModalResultStatValidation(true)
    }

    /** Closes the modal with the results for a StatisticalValidation instance. */
    const closeStatResult = () => {
        setSelectedTrainedModel(null)
        setOpenModalResultStatValidation(false)
    }

    // Shows modal to add a new statistical validation analysis
    if (openModalNewStatValidation) {
        return (
            <NewStatisticalValidationModal
                selectedBiomarker={props.selectedBiomarker}
                openModalNewStatValidation={openModalNewStatValidation}
                closeModal={() => { setOpenModalNewStatValidation(false) }}
            />
        )
    }

    // Shows modal with the statistical validation results
    if (openModalResultStatValidation && selectedStatisticalValidation) {
        return (
            <Modal
                className='large-modal'
                closeIcon={<Icon name='close' size='large' />}
                closeOnEscape={false}
                centered={false}
                closeOnDimmerClick={false}
                closeOnDocumentClick={false}
                onClose={closeStatResult}
                open={openModalResultStatValidation}
            >
                <Header icon='area chart' content={selectedStatisticalValidation.name} />

                <Modal.Content>
                    <StatisticalValidationResultModal selectedStatisticalValidation={selectedStatisticalValidation} />
                </Modal.Content>
            </Modal>
        )
    }

    return (
        <StatisticalValidationsTable
            selectedBiomarker={props.selectedBiomarker}
            setOpenModalNewStatValidation={setOpenModalNewStatValidation}
            openStatResult={openStatResult}
        />
    )
}
