import React, { useEffect, useState } from 'react'
import { BiomarkerStatisticalValidationsTable } from './BiomarkerStatisticalValidationsTable'
import { Biomarker } from '../types'
import { Icon, Modal } from 'semantic-ui-react'
import { BiomarkerNewStatisticalValidationModal } from './BiomarkerNewStatisticalValidationModal'

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

    // TODO: remove
    useEffect(() => {
        setTimeout(() => {
            setOpenModalNewStatValidation(true)
        }, 500)
    }, [])

    // Shows modal to add a new statistical validation analysis
    if (openModalNewStatValidation) {
        return (
            <Modal
                closeIcon={<Icon name='close' size='large' />}
                closeOnEscape={false}
                closeOnDimmerClick={false}
                closeOnDocumentClick={false}
                onClose={() => { setOpenModalNewStatValidation(false) }}
                open={openModalNewStatValidation}
            >
                <BiomarkerNewStatisticalValidationModal selectedBiomarker={props.selectedBiomarker}/>
            </Modal>
        )
    }

    return (
        <BiomarkerStatisticalValidationsTable
            selectedBiomarker={props.selectedBiomarker}
            setOpenModalNewStatValidation={setOpenModalNewStatValidation}
        />
    )
}
