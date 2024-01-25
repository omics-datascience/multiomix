import React, { useEffect, useRef, useState } from 'react'
import { BiomarkerMolecule } from '../../types'
import { MiRNATargetInteractionPanel } from '../../../pipeline/experiment-result/gene-gem-details/MiRNATargetInteractionPanel'
import { KySearchParams, Nullable } from '../../../../utils/interfaces'
import ky from 'ky'
import { DjangoMiRNADataJSON } from '../../../../utils/django_interfaces'

interface Props {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedMolecule: BiomarkerMolecule,
    gene: Nullable<string>,
    miRNA: Nullable<string>,
}
declare const urlGetMiRNAData: string

export const MirnaInteractionsPanel = (props: Props) => {
    const { selectedMolecule, gene, miRNA } = props
    const [miRNAData, setMiRNAData] = useState<Nullable<DjangoMiRNADataJSON>>(null)
    const abortController = useRef(new AbortController())

    const getMiRNAData = () => {
        const searchParams: KySearchParams = {
            mirna: selectedMolecule.identifier
        }

        ky.get(urlGetMiRNAData, { signal: abortController.current.signal, searchParams }).then((response) => {
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
        getMiRNAData()

        return () => {
            abortController.current.abort()
        }
    }, [])
    return (
        <>
            <MiRNATargetInteractionPanel
                miRNAData={miRNAData}
                gene={gene} // para mrna y cna se envia el gem
                miRNA={miRNA} // para los otros 2
            />
        </>

    )
}
