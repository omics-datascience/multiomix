import React, { useEffect, useRef, useState } from 'react'
import { BiomarkerMolecule } from '../../types'
import { MiRNADrugsPanel } from '../../../pipeline/experiment-result/gene-gem-details/MiRNADrugsPanel'
import { KySearchParams, Nullable } from '../../../../utils/interfaces'
import { DjangoMiRNADataJSON } from '../../../../utils/django_interfaces'
import ky from 'ky'

interface BiomarkerDiseasesPanelProps {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedMolecule: BiomarkerMolecule,

}
declare const urlGetMiRNAData: string

export const DrugsPanel = (props: BiomarkerDiseasesPanelProps) => {
    const { selectedMolecule } = props
    const [miRNAData, setMiRNAData] = useState<Nullable<DjangoMiRNADataJSON>>(null)
    const abortController = useRef(new AbortController())

    /**
     * Function to get data
     */
    const getMiRNAData = () => {
        const searchParams: KySearchParams = {
            mirna: selectedMolecule.identifier
        }

        ky.get(urlGetMiRNAData, { signal: abortController.current.signal, searchParams }).then((response) => {
            response.json().then((jsonResponse: DjangoMiRNADataJSON) => {
                setMiRNAData(jsonResponse)
                console.log(jsonResponse)
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error getting studies ->', err)
        })
    }

    useEffect(() => {
        getMiRNAData()

        return () => {
            abortController.current.abort()
        }
    }, [])

    return (
        <div>
            <MiRNADrugsPanel miRNA={selectedMolecule.identifier} miRNAData={miRNAData ?? {
                aliases: [],
                mirna_sequence: '',
                mirbase_accession_id: '',
                links: []
            }}
            />
        </div>
    )
}
