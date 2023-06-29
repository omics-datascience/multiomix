import React, { useEffect, useState } from 'react'
import ky from 'ky'
import { BiomarkerMolecule } from '../../../types'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { ResultPlaceholder } from '../../stat-validations/result/ResultPlaceholder'
import { Nullable } from '../../../../../utils/interfaces'
import { GeneData } from './types'
import { Card, Grid, Message } from 'semantic-ui-react'

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
    const [geneData, setGeneData] = useState<Nullable<GeneData>>(null)
    const [loadingData, setLoadingData] = useState(false)

    /** Every time the selected molecule changes, retrieves its data from the backend. */
    useEffect(() => {
        getMoleculeData(props.selectedMolecule)
    }, [props.selectedMolecule.id])

    const getMoleculeData = (selectedMolecule: BiomarkerMolecule) => {
        setLoadingData(true)

        const searchParams = { gene: selectedMolecule.identifier }
        ky.get(urlGeneInformation, { searchParams }).then((response) => {
            response.json().then((jsonResponse: { data: GeneData }) => {
                setGeneData(jsonResponse.data)
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

    if (!geneData) {
        return null
    }

    return (
        <Grid>
            {/* Basic data */}
            <Grid.Row columns={2} divided stretched>
                <Grid.Column width={4}>
                    <Card
                        header={geneData.name}
                        meta={geneData.alias_symbol}
                        description={geneData.ensembl_gene_id}
                        extra={
                            <Grid textAlign='center'>
                                <Grid.Row columns={2} divided>
                                    <Grid.Column><strong>Start</strong>: {geneData.start_position}</Grid.Column>
                                    <Grid.Column><strong>End</strong>: {geneData.end_position}</Grid.Column>
                                </Grid.Row>
                            </Grid>
                        }
                        color='violet'
                    />
                </Grid.Column>
                <Grid.Column width={12}>
                    <Message
                        header='Summary'
                        content={geneData.refseq_summary}
                    />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={2} divided stretched>
                <Grid.Column width={4}>

                </Grid.Column>
                <Grid.Column width={12}>

                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
