import React, { useCallback, useEffect, useState } from 'react'
import { Container, Dropdown } from 'semantic-ui-react'
import { useDebounce } from '../../../../../utils/hooks/useDebounce'
import { MoleculesSectionData } from '../../../types'
interface SelectDropDownSingleMoleculeProps {
    handleAddMoleculeToSection: (value: MoleculesSectionData) => void
    handleSearchNewData: (query: string) => void,
    options: {
        isLoading: boolean,
        data: {
            key: string,
            text: string,
            value: string,
        }[]
    }
}
export const SelectDropDownSingleMolecule = ({ handleAddMoleculeToSection, handleSearchNewData, options }: SelectDropDownSingleMoleculeProps) => {
    const [inputString, setInputString] = useState({
        query: '',
        value: ''
    })
    const debouncedInputString = useDebounce(inputString.query, 1000)

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
    const handleSearchNewMolecules = useCallback((stringToSearch: string) => {
        if (debouncedInputString) {
            handleSearchNewData(stringToSearch)
        }
    }, [debouncedInputString, handleSearchNewData])

    useEffect(() => {
        if (inputString) {
            handleSearchNewMolecules(debouncedInputString)
        }
    }, [debouncedInputString, handleSearchNewMolecules])
    return (
        <Container className='biomarkers--side--bar--box'>
            <Dropdown
                loading={options.isLoading}
                className='biomarkers--side--bar--input'
                placeholder='Select molecules'
                fluid
                search
                name="moleculesMultiple"
                searchQuery={inputString.query}
                onSearchChange={(_, { searchQuery }) => setInputString({ ...inputString, query: searchQuery })}
                onChange={(_, { value }) => {
                    handleDropDownChange(typeof value === 'string' ? value : '')
                }}
                value=''
                selection
                options={options.data}
            />
        </Container>
    )
}
