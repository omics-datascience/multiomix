import React, { useEffect, useState } from 'react'
import ky from 'ky'
import { BiomarkerMolecule } from '../../../types'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { ResultPlaceholder } from '../../stat-validations/result/ResultPlaceholder'

declare const urlGeneInformation: string

/** GeneInformation props. */
interface GeneInformationProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedMolecule: BiomarkerMolecule,
}

/**
 * Renders a panel with general information of a molecule
 * @param props Component props.
 * @returns Component.
 */
export const GeneInformation = (props: GeneInformationProps) => {
    const [geneData, setGeneData] = useState(null) // TODO: type
    const [loadingData, setLoadingData] = useState(false)

    /** Every time the selected molecule changes, retrieves its data from the backend. */
    useEffect(() => {
        getMoleculeData(props.selectedMolecule)
    }, [props.selectedMolecule.id])

    const getMoleculeData = (selectedMolecule: BiomarkerMolecule) => {
        setLoadingData(true)

        const searchParams = { gene: selectedMolecule.identifier }
        ky.get(urlGeneInformation, { searchParams }).then((response) => {
            response.json().then((geneInformation/* TODO: type */) => {
                setGeneData(geneInformation)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error getting gene information', err)
        }).finally(() => {
            setLoadingData(false)
        })
    }

    if (loadingData) {
        return <ResultPlaceholder numberOfCards={1} fluid rectangular />
    }

    return null
}
