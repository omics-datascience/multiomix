import ky from 'ky'
import React, { useEffect, useRef, useState } from 'react'
import { Form } from 'semantic-ui-react'
import { alertGeneralError, listToDropdownOptions } from '../../../../utils/util_functions'
import { InferenceExperimentForTable } from '../../types'
import { InputLabel } from '../../../common/InputLabel'

declare const urlInferenceExperimentClinicalAttrs: string

/** InferenceExperimentClinicalAttributeSelect props. */
interface InferenceExperimentClinicalAttributeSelectProps {
    /** InferenceExperiment instance to get its clinical attributes. */
    selectedInferenceExperiment: InferenceExperimentForTable,
    /** Selected clinical attribute to group by. */
    selectedClinicalAttribute: string | undefined,
    /** Setter for the selected clinical attribute. */
    setSelectedClinicalAttribute: (clinicalAttribute: string | undefined) => void
}

/**
 * Renders a Select to select a clinical attribute to group in the 'Charts' panel in the 'Inference' page.
 * @param props Component props.
 * @returns Component.
 */
export const InferenceExperimentClinicalAttributeSelect = (props: InferenceExperimentClinicalAttributeSelectProps) => {
    const abortController = useRef(new AbortController())
    const [loadingClinicalAttributes, setLoadingClinicalAttributes] = useState(false)
    const [clinicalAttributes, setClinicalAttributes] = useState<string[]>([])

    /** Retrieve all the clinical attributes of the selected StatisticalValidation instance. */
    const getInferenceExperimentClinicalAttrs = () => {
        setLoadingClinicalAttributes(true)

        const searchParams = { inference_experiment_pk: props.selectedInferenceExperiment.id }
        ky.get(urlInferenceExperimentClinicalAttrs, { searchParams, timeout: 60000, signal: abortController.current.signal }).then((response) => {
            response.json().then((clinicalAttributes: string[]) => {
                setClinicalAttributes(clinicalAttributes)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting InferenceExperiments clinical attributes', err)
        }).finally(() => {
            if (!abortController.current.signal.aborted) {
                setLoadingClinicalAttributes(false)
            }
        })
    }

    const clinicalAttributesOptions = listToDropdownOptions(clinicalAttributes)
    /**
     * Every time the StatisticalValidation changes retrieves
     * its data from the backend
     */
    useEffect(() => {
        if (props.selectedInferenceExperiment.id) {
            getInferenceExperimentClinicalAttrs()
        }

        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [props.selectedInferenceExperiment.id])
    return (
        <>
            <InputLabel label='Group by clinical attribute' />

            <Form.Select
                fluid
                options={clinicalAttributesOptions}
                loading={loadingClinicalAttributes}
                className='margin-bottom-2'
                search
                selectOnBlur={false}
                clearable
                value={props.selectedClinicalAttribute}
                onChange={(_, { value }) => { props.setSelectedClinicalAttribute(value as string) }}
                placeholder='Clinical attribute to group by'
                disabled={clinicalAttributesOptions.length === 0}
            />
        </>
    )
}
