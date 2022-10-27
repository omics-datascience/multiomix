import React, { useCallback, useEffect, useState } from 'react'
import { Container, Dropdown } from 'semantic-ui-react'
import { useDebounce } from '../../../../../utils/hooks/useDebounce'
import { MoleculesSectionData } from '../../../types'
interface SelectDropDownSingleMoleculeProps{
    handleAddMoleculeToSection: (value: MoleculesSectionData) => void
}
export const SelectDropDownSingleMolecule = ({ handleAddMoleculeToSection }:SelectDropDownSingleMoleculeProps) => {
    const [inputString, setInputString] = useState({
        query: '',
        value: ''
    })
    const debouncedInputString = useDebounce(inputString.query, 500)

    const selectionOptionsPreConfig = [
        {
            key: 'asd',
            text: 'asd',
            value: 'asd'
        },
        {
            key: 'asdddd',
            text: 'asdddd',
            value: 'asdddd'
        },
        {
            key: 'asddddddd',
            text: 'asddddddd',
            value: 'asddddddd'
        },
        {
            key: 'asdddddddd',
            text: 'asdddddddd',
            value: 'asdddddddd'
        },
        {
            key: 'asddddddddddddsddd',
            text: 'asddddddddddddsddd',
            value: 'asddddddddddddsddd'
        }
    ]
    const handleDropDownChange = (value: string) => {
        if (value) {
            handleAddMoleculeToSection({
                isValid: true,
                value: value,
                isRepeat: false,
                fakeId: value + 1
            })
            setInputString({
                query: '',
                value: ''
            })
        }
    }
    const handleSearchNewMolecules = useCallback((stringToSearch: string) => {
        console.log(stringToSearch)

        console.log('aca es donde busco mas datos pa el autocompletado')
    }, [])

    useEffect(() => {
        if (inputString) {
            handleSearchNewMolecules(debouncedInputString)
        }
    }, [debouncedInputString, handleSearchNewMolecules])
    return (
        <Container className='biomarkers--side--bar--box'>
            <Dropdown
                className='biomarkers--side--bar--input'
                placeholder='Select molecules'
                fluid
                search
                value="asdas"
                name="moleculesMultiple"
                searchQuery={inputString.query}
                onSearchChange={(_, { searchQuery }) => setInputString({ ...inputString, query: searchQuery })}
                onChange={(_, { value }) => handleDropDownChange(typeof value === 'string' ? value : '')}
                selection
                options={selectionOptionsPreConfig}
            />
        </Container>
    )
}
