import React, { FormEvent, useState } from 'react'
import { Input, Icon } from 'semantic-ui-react'
import './../MoleculeSectionStyles.css'
interface SerachMoleculesProps {
    handleSearchData: (searchData: string) => void
}
export const SearchMoleculesInput = ({ handleSearchData }: SerachMoleculesProps) => {
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
                    className='biomarker--section--icon'
                    name='trash'
                    onClick={() => {
                        setInputData('')
                        handleSearchData('')
                    }} />
            </form>

        </>
    )
}
