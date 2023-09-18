import React, { useCallback, useEffect, useState } from 'react'
import { Checkbox, Container, Dropdown, Grid } from 'semantic-ui-react'
import { debounce } from 'lodash'
import { MoleculesSectionData, MoleculesSymbolFinder } from '../../../types'
import { InfoPopup } from '../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'

/** SelectDropDownSingleMolecule props. */
interface SelectDropDownSingleMoleculeProps {
    options: MoleculesSymbolFinder,
    /** Value for Checkbox. */
    checkedIgnoreProposedAlias: boolean,
    /** Handle change for Checkbox. */
    handleChangeIgnoreProposedAlias: (value: boolean) => void,
    handleAddMoleculeToSection: (value: MoleculesSectionData) => void,
    handleSearchNewData: (query: string) => void,
}

/**
 * Renders a Select Dropdown to select a molecule (mRNA, miRNA, CNA, Methylation)
 * @param props Component props
 * @returns Component
 */
export const SelectDropDownSingleMolecule = (props: SelectDropDownSingleMoleculeProps) => {
    const [inputString, setInputString] = useState({
        query: '',
        value: ''
    })

    const { handleAddMoleculeToSection, handleSearchNewData, options } = props

    /** Makes the query to Modulector/Bio-API to retrieve molecules. */
    const makeSearchRequest = useCallback(
        debounce(async (search: string) => {
            await handleSearchNewData(search)
        }, 1000),
        []
    )

    /** Every time the query changes, makes a debounced request. */
    useEffect(() => {
        if (inputString.query) {
            makeSearchRequest(inputString.query)
        }
    }, [inputString.query])

    /**
     * Handles changes on Dropdown.
     * @param value New value
     */
    const handleDropDownChange = (value: string) => {
        if (value) {
            handleAddMoleculeToSection({
                isValid: true,
                value
            })
            setInputString({
                query: '',
                value: ''
            })
        }
    }

    return (
        <Container className='biomarkers--side--bar--box'>
            <Grid>
                <Grid.Column width={14}>
                    <Dropdown
                        selectOnBlur={false}
                        selectOnNavigation={false}
                        loading={options.isLoading}
                        className='biomarkers--side--bar--input'
                        placeholder='Select molecules'
                        fluid
                        search
                        clearable
                        name="moleculesMultiple"
                        searchQuery={inputString.query}
                        onSearchChange={(_, { searchQuery }) => setInputString({ ...inputString, query: searchQuery.trim() })}
                        onChange={(_e, { value }) => handleDropDownChange((value as string) ?? '')}
                        noResultsMessage="Molecule not found"
                        selection
                        options={options.data}
                    />

                    <Checkbox
                        className='biomarkers--side--bar--validation--items'
                        label={
                            <label>
                                Don't use proposed alias

                                <InfoPopup
                                    content='If checked, the molecule will be added to the biomarker with the name that was fond in the query'
                                    onTop={false}
                                    onEvent='hover'
                                    extraClassName='margin-left-5'
                                />
                            </label>
                        }
                        checked={props.checkedIgnoreProposedAlias}
                        onChange={() => props.handleChangeIgnoreProposedAlias(!props.checkedIgnoreProposedAlias)}
                    />
                </Grid.Column>
                <Grid.Column width={2} style={{ lineHeight: 2 }}>
                    <InfoPopup
                        content='This search engine will display the molecules starting with the search criteria and will display (if necessary) the validated alias that was found in our database. The latter is the one that will be added to the biomarker, in case you want to enter the molecule as it was found check the Checkbox below'
                        onTop={false}
                    />
                </Grid.Column>
            </Grid>
        </Container>
    )
}
