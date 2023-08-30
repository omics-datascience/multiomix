import React, { useEffect, useRef, useState } from 'react'
import ky from 'ky'
import { BiomarkerMolecule } from '../../../types'
import { alertGeneralError, listToDropdownOptions } from '../../../../../utils/util_functions'
import { ResultPlaceholder } from '../../stat-validations/result/ResultPlaceholder'
import { DropdownItemProps, Grid, Header, Input, List, SearchProps, Select } from 'semantic-ui-react'
import { InputLabel } from '../../../../common/InputLabel'
import { InfoPopup } from '../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'

declare const urlMetabolicPathways: string

/** All MetabolicPathways available sources in BioAPI. */
const METABOLIC_PATHWAYS_SOURCES = [
    'KEGG',
    'BIOCARTA',
    'EHMN',
    'HUMANCYC',
    'INOH',
    'NETPATH',
    'PID',
    'REACTOME',
    'SMPDB',
    'SIGNALINK',
    'WIKIPATHWAYS'
]

const sourcesOptions: DropdownItemProps[] = listToDropdownOptions(METABOLIC_PATHWAYS_SOURCES)

/** MetabolicPathways props. */
interface MetabolicPathwaysProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedMolecule: BiomarkerMolecule,
}

/**
 * Renders a panel with a list of genes that are involved in a pathway for a given database
 * @param props Component props.
 * @returns Component.
 */
export const MetabolicPathways = (props: MetabolicPathwaysProps) => {
    const abortController = useRef(new AbortController())
    const [searchInput, setSearchInput] = useState<string>('')
    const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined)
    const [listOfGenes, setListOfGenes] = useState<string[]>([])
    const [loadingData, setLoadingData] = useState(false)

    /** Every time the selected molecule changes, retrieves its data from the backend. */
    useEffect(() => {
        getMetabolicPathwaysData(props.selectedMolecule)
        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [selectedSource])

    /**
     * Retrieves the list of genes that are involved in a pathway for a given database.
     * @param selectedMolecule BiomarkerMolecule instance to get the data from.
     */
    const getMetabolicPathwaysData = (selectedMolecule: BiomarkerMolecule) => {
        setLoadingData(true)

        const searchParams = { gene: selectedMolecule.identifier, source: selectedSource ?? '' }
        ky.get(urlMetabolicPathways, { searchParams, signal: abortController.current.signal }).then((response) => {
            response.json().then((jsonResponse: string[]) => {
                setListOfGenes(jsonResponse)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }
            console.log('Error getting gene information', err)
        }).finally(() => {
            if (!abortController.current.signal.aborted) {
                setLoadingData(false)
            }
        })
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>, { value }: SearchProps) => {
        setSearchInput(value as string)
    }

    if (loadingData) {
        return <ResultPlaceholder numberOfCards={1} fluid rectangular />
    }

    const searchInputTrimmed = searchInput.trim()
    const listOfGenesFiltered = searchInputTrimmed.length > 0
        ? listOfGenes.filter((gene) => gene.toLowerCase().includes(searchInput.toLowerCase()))
        : listOfGenes

    return (
        <Grid>
            <Grid.Row columns={1}>
                <Grid.Column>
                    <InfoPopup
                        content='List of genes that are involved in a pathway for a given database'
                        onTop
                        onEvent='click'
                        extraClassName='pull-right'
                    />

                    <Header as='h3'>
                        Metabolic pathways

                    </Header>

                    <InputLabel label='Select a source' />

                    <Select
                        selectOnBlur={false}
                        placeholder='Source'
                        className='selection-select-m selection-select'
                        options={sourcesOptions}
                        value={selectedSource}
                        onChange={(_, { value }) => setSelectedSource(value as string)}
                    />

                    <Input
                        icon='search'
                        fluid
                        placeholder='Search'
                        onChange={handleSearch}
                        value={searchInput}
                        disabled={selectedSource === undefined}
                    />

                    <List>
                        {listOfGenesFiltered.map((gene) => (
                            <List.Item key={gene}>
                                <List.Icon name='marker' />
                                <List.Content>{gene}</List.Content>
                            </List.Item>
                        ))}
                    </List>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
