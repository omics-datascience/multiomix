import React, { useState } from 'react'
import { Input, Button } from 'semantic-ui-react'
interface SerachMoleculesProps {
    handleSearchData: (searchData: string) => void
}
export const SearchMoleculesInput = ({ handleSearchData }: SerachMoleculesProps) => {
    const [inputData, setInputData] = useState('')
    return (
        <div>
            <Input
                value={inputData}
                type='text'
                placeholder='Search...'
                onChange={(e) => setInputData(e.target.value)}
            >
                <input
                />
                <Button onClick={() => handleSearchData(inputData)}>Search</Button>
            </Input>
        </div>
    )
}
