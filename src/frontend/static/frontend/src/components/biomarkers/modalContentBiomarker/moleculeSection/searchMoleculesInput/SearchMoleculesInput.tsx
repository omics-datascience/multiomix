import React, { FormEvent, useState } from 'react'
import { Input, Icon } from 'semantic-ui-react'
import { BiomarkerType } from '../../../types'
import './../MoleculeSectionStyles.css'
interface SerachMoleculesProps {
    handleSearchData: (searchData: string) => void,
    handleRemoveInvalidGenes: (sector: BiomarkerType) => void,
}
export const SearchMoleculesInput = ({ handleSearchData, handleRemoveInvalidGenes }: SerachMoleculesProps) => {
    const [inputData, setInputData] = useState('')
    const handleSubmitSearch = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        handleSearchData(inputData)
    }
    return (
        <>
            <form onSubmit={handleSubmitSearch}>
                <Input
                    value={inputData}
                    type='text'
                    placeholder='Search...'
                    onChange={(e) => setInputData(e.target.value)}
                    icon={<Icon name='search' inverted circular link onClick={() => handleSearchData(inputData)} />}
                />
                <Icon
                    className='biomarker--section--icon clickable'
                    name='trash'
                    onClick={() => {
                        setInputData('')
                        handleSearchData('')
                    }} />
                <Icon
                    className='biomarker--section--icon clickable'
                    name='ban'
                    color='red'
                    onClick={handleRemoveInvalidGenes} />
            </form>

        </>
    )
}
