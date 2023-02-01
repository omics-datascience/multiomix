import React, { useCallback, useEffect, useState } from 'react'
import { Container, Dropdown, DropdownItemProps } from 'semantic-ui-react'
import { useDebounce } from '../../../../../utils/hooks/useDebounce'
import { MoleculesMultipleSelection } from '../../../types'
import './selectDropDownMoleculesStyles.css'

interface SelectDropDownMoleculesProps {
    moleculesMultiple: MoleculesMultipleSelection[],
    handleChangeMoleculeSelected: (name: string, value: number | Array<number | string | boolean> | DropdownItemProps | string) => void;
}
export const SelectDropDownMolecules = ({ moleculesMultiple, handleChangeMoleculeSelected }: SelectDropDownMoleculesProps) => {
    const [inputString, setInputString] = useState('')
    const debouncedInputString = useDebounce(inputString, 500)

    const selectionOptionsPreConfig = [
        {
            key: 1,
            text: 'asd',
            value: 1
        },
        {
            key: 2,
            text: 'asdddd',
            value: 2
        },
        {
            key: 3,
            text: 'asddddddd',
            value: 3
        },
        {
            key: 4,
            text: 'asdddddddd',
            value: 4
        },
        {
            key: 5,
            text: 'asddddddddddddsddd',
            value: 5
        }
    ]
    const selectionOptions = selectionOptionsPreConfig.concat(moleculesMultiple.filter(item => selectionOptionsPreConfig.includes(item)))
    const handleDropDownChange = (name: string, value: Array<string | number | boolean>) => {
        let moleculesDataSelected = moleculesMultiple
        if (moleculesMultiple.length < value.length) {
            const { 0: selectedData } = selectionOptions.filter(item => item.value === value[value.length - 1])
            moleculesDataSelected.push(selectedData)
        } else {
            moleculesDataSelected = moleculesDataSelected.filter(item => value.includes(item.value || 0))
        }
        handleChangeMoleculeSelected(name, moleculesDataSelected)
    }
    const handleSearchNewMolecules = useCallback((stringToSearch: string) => {
        console.log(stringToSearch)
    }, [])

    useEffect(() => {
        handleSearchNewMolecules(debouncedInputString)
    }, [debouncedInputString, handleSearchNewMolecules])
    return (
        <Container className='biomarkers--side--bar--box'>
            <Dropdown
                className='biomarkers--side--bar--input'
                placeholder='Select molecules'
                fluid
                value={moleculesMultiple.map(item => (item.value ? item.value : 1))}
                multiple
                search
                name="moleculesMultiple"
                searchQuery={inputString}
                onSearchChange={(_, { searchQuery }) => setInputString(searchQuery)}
                onChange={(_, { name, value }) => {
                    handleDropDownChange(name, (typeof value === 'object' && value.length) ? value : [])
                }}
                selection
                options={selectionOptions}
            />
        </Container>
    )
}
