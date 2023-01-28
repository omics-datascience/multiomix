import React, { useCallback, useEffect, useState } from 'react'
import { Container, Dropdown } from 'semantic-ui-react'
import { debounce } from 'lodash'
import { MoleculesSectionData, MoleculesSymbolFinder } from '../../../../types'

/** SelectDropDownSingleMolecule props. */
interface SelectDropDownSingleMoleculeProps {
    handleAddMoleculeToSection: (value: MoleculesSectionData) => void
    handleSearchNewData: (query: string) => void,
    options: MoleculesSymbolFinder
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
        debounce((search: string) => {
            handleSearchNewData(search)
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
                value: value
            })
            setInputString({
                query: '',
                value: ''
            })
        }
    }

    return (
        <Container className='biomarkers--side--bar--box'>
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
                onSearchChange={(_, { searchQuery }) => setInputString({ ...inputString, query: searchQuery })}
                onChange={(_e, { value }) => handleDropDownChange(String(value) || '')}
                noResultsMessage="Molecule not found"
                selection
                options={options.data}
            />
        </Container>
    )
}
