import React, { useEffect, useRef, useState } from 'react'
import { BiomarkerMolecule } from '../../../types'
import { MiRNADiseasesPanel } from '../../../../pipeline/experiment-result/gene-gem-details/MiRNADiseasesPanel'
import { KySearchParams, Nullable } from '../../../../../utils/interfaces'
import { DjangoMiRNADataJSON } from '../../../../../utils/django_interfaces'
import ky from 'ky'

interface BiomarkerDiseasesPanelProps {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedMolecule: BiomarkerMolecule,

}
// declare const urlGetMiRNAData: string

export const DiseasesPanel = (props: BiomarkerDiseasesPanelProps) => {
    const { selectedMolecule } = props
    const [miRNAData, setMiRNAData] = useState<Nullable<DjangoMiRNADataJSON>>(null)
    const abortController = useRef(new AbortController())

    const getMiRNAData = () => {
        const searchParams: KySearchParams = {
            mirna: selectedMolecule.identifier
        }

        ky.get('urlGetMiRNAData', { signal: abortController.current.signal, searchParams }).then((response) => {
            response.json().then((jsonResponse: DjangoMiRNADataJSON) => {
                setMiRNAData(jsonResponse)
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error getting studies ->', err)
        })
    }

    useEffect(() => {
        // getMiRNAData()
        return () => {
            abortController.current.abort()
        }
    }, [])

    return (
        <div>
            {/*  <MiRNADiseasesPanel miRNA={selectedMolecule.identifier} miRNAData={miRNAData} /> */}
        </div>
    )
}
