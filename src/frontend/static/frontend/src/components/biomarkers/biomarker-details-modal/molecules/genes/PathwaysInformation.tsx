import React, { useEffect, useRef, useState } from 'react'
import ky from 'ky'
import { BiomarkerMolecule } from '../../../types'
import { ResultPlaceholder } from '../../stat-validations/result/ResultPlaceholder'
import { Nullable } from '../../../../../utils/interfaces'
import { GeneData } from './types'
import { Grid, Header, Icon } from 'semantic-ui-react'
import { MetabolicPathways } from './MetabolicPathways'

declare const urlPathwaysInformation: string

/** PathwaysInformation props. */
interface PathwaysInformationProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedMolecule: BiomarkerMolecule,
}

/**
 * Renders a panel with pathways information of a gene
 * @param props Component props.
 * @returns Component.
 */
export const PathwaysInformation = (props: PathwaysInformationProps) => {
    const abortController = useRef(new AbortController())
    const [pathwaysData, setPathwaysData] = useState<Nullable<GeneData>>(null)
    const [loadingData, setLoadingData] = useState(false)

    /** Every time the selected molecule changes, retrieves its data from the backend. */
    useEffect(() => {
        getPathwaysData(props.selectedMolecule)

        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [props.selectedMolecule.id])

    /**
     * function to get pathways data
     * @param selectedMolecule BiomarkerMolecule search pathway
     */
    const getPathwaysData = (selectedMolecule: BiomarkerMolecule) => {
        setLoadingData(true)

        const searchParams = { gene: selectedMolecule.identifier }
        ky.get(urlPathwaysInformation, { searchParams, signal: abortController.current.signal }).then((response) => {
            response.json().then((jsonResponse: { data: GeneData[] }) => {
                if (jsonResponse.data.length) {
                    setPathwaysData(jsonResponse.data[0])
                }
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting pathways information', err)
        }).finally(() => {
            if (!abortController.current.signal.aborted) {
                setLoadingData(false)
            }
        })
    }

    if (loadingData) {
        return <ResultPlaceholder numberOfCards={1} fluid rectangular />
    }

    /**
     * Function to check any pathways was found
     * @returns component if not found
     */
    const getPathwaysDataPanel = () => {
        if (!pathwaysData) {
            return (
                <Grid padded>
                    <Grid.Row columns={1} className='min-height-50vh' verticalAlign='middle'>
                        <Grid.Column textAlign='center'>
                            <Header as='h2' icon>
                                <Icon name='search minus' />
                                No pathways found
                                <Header.Subheader>
                                    No pathways were found for this gene.
                                </Header.Subheader>
                            </Header>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
        } else {
            return null
        }
    }

    return (
        <Grid>
            <Grid.Row columns={2} divided stretched>
                <Grid.Column width={12}>
                    {getPathwaysDataPanel()}
                </Grid.Column>
                <Grid.Column width={4}>
                    <MetabolicPathways selectedMolecule={props.selectedMolecule} />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
