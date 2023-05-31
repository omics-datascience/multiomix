import React, { useState } from 'react'
import { InferenceExperimentsTable } from './InferenceExperimentsTable'
import { Biomarker, InferenceExperimentForTable } from '../../types'
import { Header, Icon, Modal } from 'semantic-ui-react'
import { Nullable } from '../../../../utils/interfaces'
import { NewInferenceExperimentModal } from './NewInferenceExperimentModal'
import { InferenceExperimentResultModal } from './InferenceExperimentResultModal'
import ky from 'ky'
import { alertGeneralError } from '../../../../utils/util_functions'

declare const urlBiomarkerInferenceExperiments: string

/** BiomarkerInferenceExperimentsPanel props. */
interface BiomarkerInferenceExperimentsPanelProps {
    /** Selected Biomarker instance to get its inference experiments. */
    selectedBiomarker: Biomarker
}

/**
 * Renders a panel to make inference experiments for a specific Biomarker.
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerInferenceExperimentsPanel = (props: BiomarkerInferenceExperimentsPanelProps) => {
    const [openModalNewInferenceExperiment, setOpenModalNewInferenceExperiment] = useState(false)
    const [openModalResultInferenceExperiment, setOpenModalResultInferenceExperiment] = useState(false)
    const [selectedInferenceExperiment, setSelectedInferenceExperiment] = useState<Nullable<InferenceExperimentForTable>>(null)

    /**
     * Opens the modal with the results for a InferenceExperiment instance.
     * @param inferenceExperiment InferenceExperimentForTable instance
     */
    const openInferenceResult = (inferenceExperiment: InferenceExperimentForTable) => {
        setSelectedInferenceExperiment(inferenceExperiment)
        setOpenModalResultInferenceExperiment(true)
    }

    /** Closes the modal with the results for a InferenceExperiment instance. */
    const closeStatResult = () => {
        setSelectedInferenceExperiment(null)
        setOpenModalResultInferenceExperiment(false)
    }

    /**
     * Gets new experiment data from the backend to update a tab
     */
    const refreshExperimentInfo = () => {
        if (!selectedInferenceExperiment) {
            return
        }

        const url = `${urlBiomarkerInferenceExperiments}/${selectedInferenceExperiment.id}/`
        const searchParams = { biomarker_pk: props.selectedBiomarker.id as number }
        ky.get(url, { searchParams }).then((response) => {
            response.json().then((experiment: InferenceExperimentForTable) => {
                setSelectedInferenceExperiment(experiment)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error getting experiment', err)
        })
    }

    // Shows modal to add a new inference experiment analysis
    if (openModalNewInferenceExperiment) {
        return (
            <NewInferenceExperimentModal
                selectedBiomarker={props.selectedBiomarker}
                openModalNewInferenceExperiment={openModalNewInferenceExperiment}
                closeModal={() => { setOpenModalNewInferenceExperiment(false) }}
            />
        )
    }

    // Shows modal with the inference experiment results
    if (openModalResultInferenceExperiment && selectedInferenceExperiment) {
        return (
            <Modal
                className='large-modal'
                closeIcon={<Icon name='close' size='large' />}
                closeOnEscape={false}
                centered={false}
                closeOnDimmerClick={false}
                closeOnDocumentClick={false}
                onClose={closeStatResult}
                open={openModalResultInferenceExperiment}
            >
                <Header icon='area chart' content={`Inference experiment "${selectedInferenceExperiment.name}"`} />

                <Modal.Content>
                    <InferenceExperimentResultModal selectedInferenceExperiment={selectedInferenceExperiment} refreshExperimentInfo={refreshExperimentInfo} />
                </Modal.Content>
            </Modal>
        )
    }

    return (
        <InferenceExperimentsTable
            selectedBiomarker={props.selectedBiomarker}
            setOpenModalNewInferenceExperiment={setOpenModalNewInferenceExperiment}
            openInferenceResult={openInferenceResult}
        />
    )
}
